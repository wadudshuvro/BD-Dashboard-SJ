import { useState } from "react";
import { useAgentList } from "@/hooks/useAgentList";
import { useRunAIAgent } from "@/hooks/useRunAIAgent";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, PlayCircle, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIAgent } from "@/Api/aiAgents";

function AgentCard({ agent, onRun, isRunning }: { 
  agent: AIAgent; 
  onRun: (agent: AIAgent) => void;
  isRunning: boolean;
}) {
  const isActive = agent.is_active ?? agent.is_enabled ?? false;
  const isFeatured = agent.slug === "lead-auto-enrichment";

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      isFeatured && "border-primary/50 bg-primary/5"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {isFeatured ? (
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
            ) : (
              <Bot className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
            <CardTitle className={cn(
              "text-lg",
              isFeatured && "text-primary"
            )}>
              {agent.name}
            </CardTitle>
          </div>
          <Badge variant={isActive ? "secondary" : "outline"} className="shrink-0">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        {agent.description && (
          <CardDescription className="line-clamp-2">
            {agent.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-4">
          <Badge variant="outline" className="font-normal">
            {agent.category || agent.type || "General"}
          </Badge>
          <Button
            size="sm"
            onClick={() => onRun(agent)}
            disabled={isRunning || !isActive}
            className="gap-2"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Run
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyAgents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: agents = [], isLoading, refetch, isRefetching } = useAgentList();
  const runMutation = useRunAIAgent();
  const [runningAgentId, setRunningAgentId] = useState<string | null>(null);

  // Filter to only show active/enabled agents for regular users
  const availableAgents = agents.filter(agent => agent.is_active || agent.is_enabled);

  const handleRunAgent = async (agent: AIAgent) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to run an agent.",
        variant: "destructive",
      });
      return;
    }

    setRunningAgentId(agent.id);
    try {
      const response = await runMutation.mutateAsync({
        agent_id: agent.id,
        execution_context: {
          user_id: user.id,
          filters: { category: agent.category ?? agent.type ?? "general" },
        },
      });

      toast({
        title: `${agent.name} executed`,
        description: response.summary || "Agent run completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Agent execution failed",
        description: error instanceof Error ? error.message : "Unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setRunningAgentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            My Agents
          </h1>
          <p className="text-muted-foreground">
            Run AI agents to automate tasks and generate insights.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => refetch()} 
          disabled={isRefetching}
          className="gap-2"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-9 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : availableAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No agents available</h3>
            <p className="text-muted-foreground text-center mt-1">
              There are no active AI agents configured for your use.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availableAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onRun={handleRunAgent}
              isRunning={runningAgentId === agent.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
