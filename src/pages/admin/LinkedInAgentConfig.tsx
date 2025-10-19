import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAgentList } from "@/hooks/useAgentList";
import { useRunAIAgent } from "@/hooks/useRunAIAgent";
import type { AIAgent } from "@/Api/aiAgents";
import { AgentConfigModal } from "@/features/ai/agents/AgentConfigModal";
import { AgentRunHistoryPanel } from "@/features/ai/agents/AgentRunHistoryPanel";
import { useAuth } from "@/hooks/useAuth";

export default function LinkedInAgentConfig() {
  const { user } = useAuth();
  const { data: agents, isLoading } = useAgentList();
  const runMutation = useRunAIAgent();
  const { toast } = useToast();

  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [historyAgentId, setHistoryAgentId] = useState<string | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const orderedAgents = useMemo(() => {
    return (agents ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [agents]);

  const handleConfigure = (agent: AIAgent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleRunAgent = (agent: AIAgent) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "You must be authenticated to run an agent.",
        variant: "destructive",
      });
      return;
    }

    setHistoryAgentId(agent.id);

    runMutation.mutate(
      {
        agent_id: agent.id,
        execution_context: {
          user_id: user.id,
          timeframe: "latest",
          filters: { type: agent.type },
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: `${agent.name} executed`,
            description: data.summary,
          });
        },
        onError: (error) => {
          toast({
            title: "Agent execution failed",
            description: error instanceof Error ? error.message : "Unknown error",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LinkedIn Agent Configuration</h1>
        <p className="text-muted-foreground">
          Manage provider routing, fallbacks, and run telemetry for LinkedIn operations agents.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {isLoading && (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}

          {!isLoading && orderedAgents.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No LinkedIn agents found</CardTitle>
                <CardDescription>
                  Create an agent in Supabase to begin configuring routing and telemetry.
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {orderedAgents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{agent.name}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </div>
                <Badge variant={agent.is_active ? "secondary" : "outline"}>
                  {agent.is_active ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm">
                  <div className="font-medium">Type</div>
                  <div className="text-muted-foreground capitalize">{agent.type.replace(/_/g, " ")}</div>
                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => handleConfigure(agent)}>
                    Configure providers
                  </Button>
                  <Button onClick={() => handleRunAgent(agent)} disabled={runMutation.isPending && historyAgentId === agent.id}>
                    {runMutation.isPending && historyAgentId === agent.id ? "Running..." : "Run agent"}
                  </Button>
                  <Button variant="ghost" onClick={() => setHistoryAgentId(agent.id)}>
                    View history
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <AgentRunHistoryPanel agentId={historyAgentId} />
        </div>
      </div>

      <AgentConfigModal
        agent={selectedAgent}
        open={isModalOpen && Boolean(selectedAgent)}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAgent(null);
        }}
      />
    </div>
  );
}
