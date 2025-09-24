import { useState } from "react";
import { useCollabAIIntegration, useCollabAIAgents, useCollabAIChat } from "@/features/collabai/hooks";
import { AgentGrid } from "@/features/collabai/AgentGrid";
import { ChatPanel } from "@/features/collabai/ChatPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AIAgentsPage() {
  const { toast } = useToast();
  const { data: integration } = useCollabAIIntegration();
  const { data: agents = [], isLoading } = useCollabAIAgents(integration?.id);
  const chat = useCollabAIChat();

  const [open, setOpen] = useState(false);
  const [agent, setAgent] = useState<any | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);

  const handleTry = (a: any) => { 
    setAgent(a); 
    setOpen(true); 
    setMessages([]); 
  };

  const handleSend = async (text: string) => {
    if (!integration?.id || !agent?.id) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    try {
      const res = await chat.mutateAsync({ 
        integrationId: integration.id, 
        agentId: agent.id, 
        message: text 
      });
      const reply = res?.reply ?? JSON.stringify(res);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      toast({ 
        title: "Chat failed", 
        description: e.message, 
        variant: "destructive" 
      });
    }
  };

  if (!integration) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect CollabAI to access your AI agents and start collaborative conversations.
            </p>
            <Button asChild>
              <a href="/adminpanel/integrations">Configure CollabAI Integration</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground">
          Collaborate with AI agents to boost your productivity
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading agents...</div>
      ) : (
        <AgentGrid agents={agents} onTry={handleTry} />
      )}

      <ChatPanel
        open={open}
        onClose={() => setOpen(false)}
        agent={agent}
        onSend={handleSend}
        pending={chat.isPending}
        messages={messages}
      />
    </div>
  );
}