import { useState } from "react";
import { useCollabAIIntegration, useCollabAIAgents, useSyncCollabAIAgents } from "@/features/collabai/hooks";
import { AgentGrid } from "@/features/collabai/AgentGrid";
import { AgentChatModal } from "@/features/collabai/AgentChatModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bot, Settings, TestTube, Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function MyAgentsPage() {
  const { toast } = useToast();
  const { data: integration } = useCollabAIIntegration();
  const { data: agents = [], isLoading } = useCollabAIAgents(integration?.id);
  const syncMutation = useSyncCollabAIAgents();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  
  // Configuration state
  const [apiKey, setApiKey] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Filter agents based on search query
  const filteredAgents = agents.filter((agent) =>
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTry = (agent: any) => {
    setSelectedAgent(agent);
    setChatModalOpen(true);
  };

  const handleSync = async () => {
    if (!integration?.id) return;
    try {
      const result = await syncMutation.mutateAsync({ 
        integrationId: integration.id 
      });
      toast({ 
        title: 'Sync Complete', 
        description: `Synced ${result.synced || 0} agents successfully!` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Sync Failed', 
        description: error.message || 'Unable to sync agents', 
        variant: 'destructive' 
      });
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Missing API Key',
        description: 'Please enter your CollabAI API key.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('collabai-manage', {
        body: {
          action: 'test',
          apiKey: apiKey.trim(),
        },
      });
      if (error || !data?.ok) throw error || new Error(data?.error || 'Test failed');
      toast({ title: 'Connection Successful', description: 'Your CollabAI API key is working!' });
    } catch (err: any) {
      toast({
        title: 'Connection Failed',
        description: err.message || 'Please check your API key.',
        variant: 'destructive',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const saveConfiguration = async () => {
    if (!apiKey.trim()) {
      toast({ title: 'Missing API Key', description: 'API key is required.', variant: 'destructive' });
      return;
    }
    
    setIsConfiguring(true);
    try {
      const { data, error } = await supabase.functions.invoke('collabai-manage', {
        body: { action: 'save', apiKey: apiKey.trim() },
      });
      if (error || !data?.ok) throw error || new Error(data?.error || 'Save failed');
      toast({ title: 'Settings Saved', description: 'Your CollabAI configuration has been saved!' });
      setApiKey("");
      // Refresh the page to load agents
      window.location.reload();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message ?? 'Unable to save configuration.', variant: 'destructive' });
    } finally {
      setIsConfiguring(false);
    }
  };

  if (!integration) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            My AI Agents
          </h1>
          <p className="text-muted-foreground">
            Configure your CollabAI connection to access your AI agents
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              CollabAI Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your CollabAI account to access and manage your AI agents.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="api-key">CollabAI API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your CollabAI API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={testConnection}
                disabled={isTesting}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isTesting ? "Testing..." : "Test Connection"}
              </Button>
              <Button 
                onClick={saveConfiguration}
                disabled={isConfiguring}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                {isConfiguring ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            My AI Agents
          </h1>
          <p className="text-muted-foreground">
            Manage and interact with your CollabAI agents
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            Connected
          </Badge>
          <Button
            onClick={handleSync}
            disabled={syncMutation.isPending}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Synchronize'}
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading your agents...</p>
        </div>
      ) : (
        <AgentGrid agents={filteredAgents} onTry={handleTry} />
      )}

      <AgentChatModal
        open={chatModalOpen}
        onOpenChange={setChatModalOpen}
        agent={selectedAgent}
      />
    </div>
  );
}
