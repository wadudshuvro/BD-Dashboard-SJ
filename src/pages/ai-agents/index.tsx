import { useState } from "react";
import { useCollabAIIntegration, useCollabAIAgents } from "@/features/collabai/hooks";
import { buildAgentChatUrl } from "@/features/collabai/buildAgentChatUrl";
import { AgentGrid } from "@/features/collabai/AgentGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AIAgentsPage() {
  const { toast } = useToast();
  const { data: integration } = useCollabAIIntegration();
  const { data: agents = [], isLoading } = useCollabAIAgents(integration?.id);

  const [searchQuery] = useState("");

  const handleTry = (agent: any) => {
    const chatUrl = buildAgentChatUrl(integration?.base_url, agent.agent_id);

    if (!chatUrl) {
      toast({
        variant: "destructive",
        title: "CollabAI URL missing",
        description: "Add a base URL to your CollabAI integration before launching an agent.",
      });
      return;
    }

    // Respect the configured integration URL instead of hard-coding the hosted domain.
    window.open(chatUrl, "_blank", "noopener,noreferrer");
  };

  if (!integration) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Please configure your CollabAI integration in the My Agents page first.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/my-agents'}>
              Go to My Agents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading agents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
        <p className="text-muted-foreground">
          Browse and interact with available AI agents
        </p>
      </div>

      <AgentGrid agents={agents} onTry={handleTry} />
    </div>
  );
}
