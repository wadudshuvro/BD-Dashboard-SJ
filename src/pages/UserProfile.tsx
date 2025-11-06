import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCollabAIIntegration, useCollabAIAgents } from "@/features/collabai/hooks";
import { AgentGrid } from "@/features/collabai/AgentGrid";
import { supabase } from "@/integrations/supabase/client";
import { User, Bot, Settings, TestTube, Zap, ClipboardList, Lock } from "lucide-react";
import { AccountabilityChartEditor } from "@/components/AccountabilityChartEditor";
import { AccountabilityChartImporter } from "@/components/AccountabilityChartImporter";

export default function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: integration } = useCollabAIIntegration();
  const { data: agents = [], isLoading: agentsLoading } = useCollabAIAgents(integration?.id);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    timezone: 'utc-5',
    language: 'en'
  });

  // CollabAI configuration state
  const [apiKey, setApiKey] = useState("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleSave = () => {
    // Here you would typically save to a backend
    console.log('Saving profile:', formData);
  };

  const testCollabAIConnection = async () => {
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

  const saveCollabAIConfiguration = async () => {
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
      // Refresh to show updated integration status
      window.location.reload();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message ?? 'Unable to save configuration.', variant: 'destructive' });
    } finally {
      setIsConfiguring(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmNewPassword) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({ title: "Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    
    setIsUpdatingPassword(true);
    
    try {
      // Optional: Verify current password first
      if (currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email || '',
          password: currentPassword
        });
        
        if (signInError) {
          throw new Error("Current password is incorrect");
        }
      }
      
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully!"
      });
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      
    } catch (err: any) {
      toast({
        title: "Update Failed",
        description: err.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        </div>
        <p className="text-muted-foreground">
          Manage your personal information and AI integrations
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Personal Information</TabsTrigger>
          <TabsTrigger value="accountability">Accountability Chart</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="integrations">AI Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Keep your profile information up to date.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full-name">Full Name</Label>
                  <Input 
                    id="full-name" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select 
                    value={formData.timezone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-8">UTC-8 (PST)</SelectItem>
                      <SelectItem value="utc-5">UTC-5 (EST)</SelectItem>
                      <SelectItem value="utc+0">UTC+0 (GMT)</SelectItem>
                      <SelectItem value="utc+1">UTC+1 (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={formData.language}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSave} className="bg-gradient-primary">
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accountability">
          <div className="space-y-6">
            <AccountabilityChartEditor userId={user?.id || ''} isEditable={true} />
            <AccountabilityChartImporter />
          </div>
        </TabsContent>

        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Update your password to keep your account secure
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password (Optional)</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter your current password to verify your identity
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password *</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password *</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isUpdatingPassword}
                  className="bg-gradient-primary"
                >
                  {isUpdatingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-6">
            {/* CollabAI Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  CollabAI Integration
                  {integration && (
                    <Badge variant="secondary" className="ml-auto">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                      Connected
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect your CollabAI account to access your AI agents
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!integration ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="collab-api-key">CollabAI API Key</Label>
                      <Input
                        id="collab-api-key"
                        type="password"
                        placeholder="Enter your CollabAI API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={testCollabAIConnection}
                        disabled={isTesting}
                        className="flex items-center gap-2"
                      >
                        <TestTube className="h-4 w-4" />
                        {isTesting ? "Testing..." : "Test Connection"}
                      </Button>
                      <Button 
                        onClick={saveCollabAIConfiguration}
                        disabled={isConfiguring}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        {isConfiguring ? "Saving..." : "Save Configuration"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">CollabAI Connected</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/my-agents">
                          <Zap className="h-4 w-4 mr-2" />
                          View My Agents
                        </a>
                      </Button>
                    </div>

                    {/* Agent Summary */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Your Agents</h4>
                      {agentsLoading ? (
                        <div className="text-sm text-muted-foreground">Loading agents...</div>
                      ) : agents.length > 0 ? (
                        <div className="grid gap-2">
                          {agents.slice(0, 3).map((agent: any) => (
                            <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Bot className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{agent.name}</span>
                                <Badge variant={agent.active ? "default" : "secondary"}>
                                  {agent.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {agents.length > 3 && (
                            <div className="text-sm text-muted-foreground">
                              And {agents.length - 3} more agents...
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No agents found</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}