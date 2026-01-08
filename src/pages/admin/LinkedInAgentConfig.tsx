import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAgentList } from "@/hooks/useAgentList";
import { useRunAIAgent } from "@/hooks/useRunAIAgent";
import { useAuth } from "@/hooks/useAuth";
import { AgentConfigModal } from "@/features/ai/agents/AgentConfigModal";
import { AgentRunHistoryPanel } from "@/features/ai/agents/AgentRunHistoryPanel";
import { LeadEnrichmentAgentRunner } from "@/features/ai/agents/LeadEnrichmentAgentRunner";
import { BDResearchAnalystRunner } from "@/features/ai/agents/BDResearchAnalystRunner";
import BDWeeklyInsightsRunner from "@/features/ai/agents/BDWeeklyInsightsRunner";
import { LinkedInMessageGeneratorRunner } from "@/features/ai/agents/LinkedInMessageGeneratorRunner";
import type { AIAgent, AgentProviderConfig } from "@/Api/aiAgents";
import { cn } from "@/lib/utils";
import { Loader2, PlayCircle, RefreshCw, Settings, Bot, Sparkles } from "lucide-react";

function ProviderSummary({ agent }: { agent: AIAgent }) {
  const providers = agent.config?.providers;

  const providerEntries: Array<{ label: string; config?: AgentProviderConfig | null }> = [
    { label: "Primary", config: providers?.primary },
    { label: "Fallback", config: providers?.fallback },
  ];

  if (agent.config?.features?.enableResearch && providers?.research) {
    providerEntries.push({ label: "Research", config: providers.research });
  }

  if (!providerEntries.some((entry) => entry.config?.provider)) {
    return <p className="text-sm text-muted-foreground">No provider routing configured.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {providerEntries.map((entry) => {
        const providerName = entry.config?.provider;
        const model = entry.config?.model;
        if (!providerName) return null;
        const label = [entry.label, providerName, model].filter(Boolean).join(" • ");
        return (
          <Badge key={entry.label} variant="outline" className="font-normal">
            {label}
          </Badge>
        );
      })}
      {agent.config?.features?.enableTelemetry ? (
        <Badge variant="secondary" className="font-normal">
          Telemetry enabled
        </Badge>
      ) : (
        <Badge variant="outline" className="font-normal">
          Telemetry off
        </Badge>
      )}
    </div>
  );
}

function AgentStatusBadge({ agent }: { agent: AIAgent }) {
  const isActive = agent.is_active ?? agent.is_enabled ?? false;
  return (
    <Badge variant={isActive ? "secondary" : "outline"} className="font-normal">
      {isActive ? "Enabled" : "Disabled"}
    </Badge>
  );
}

export default function LinkedInAgentConfig() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: agents = [], isLoading, isRefetching, refetch } = useAgentList();
  const runMutation = useRunAIAgent();

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Sort agents to put Lead Auto-Enrichment first
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      if (a.slug === "lead-auto-enrichment") return -1;
      if (b.slug === "lead-auto-enrichment") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [agents]);

  useEffect(() => {
    if (!selectedAgentId && sortedAgents.length > 0) {
      setSelectedAgentId(sortedAgents[0].id);
    }
  }, [sortedAgents, selectedAgentId]);

  const selectedAgent = useMemo(() => {
    return sortedAgents.find((agent) => agent.id === selectedAgentId) ?? null;
  }, [sortedAgents, selectedAgentId]);

  const handleRunAgent = async () => {
    if (!selectedAgent) {
      toast({
        title: "Select an agent",
        description: "Choose an agent before triggering a run.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to execute an agent.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await runMutation.mutateAsync({
        agent_id: selectedAgent.id,
        execution_context: {
          user_id: user.id,
          filters: { category: selectedAgent.category ?? selectedAgent.type ?? "linkedin" },
        },
      });

      toast({
        title: `${selectedAgent.name} executed`,
        description: response.summary || "Agent run completed successfully.",
      });
    } catch (error) {
      toast({
        title: "Agent execution failed",
        description: error instanceof Error ? error.message : "Unknown error encountered.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Agent Management
          </h1>
          <p className="text-muted-foreground">
            Configure AI agents, manage provider settings, and monitor execution history.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => {
            setEditingAgent(null);
            setIsEditorOpen(true);
          }} className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Create agent
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isRefetching} className="flex items-center gap-2">
            {isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-xl">Configured agents</CardTitle>
              <CardDescription>
                Select an agent to update provider settings or trigger an execution.
              </CardDescription>
            </div>
            {selectedAgent && <AgentStatusBadge agent={selectedAgent} />}
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sortedAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No AI agents are configured yet.</p>
            ) : (
              <ScrollArea className="h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[45%]">Agent</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAgents.map((agent) => {
                      const isSelected = agent.id === selectedAgentId;
                      const isFeatured = agent.slug === "lead-auto-enrichment";
                      return (
                        <TableRow
                          key={agent.id}
                          className={cn(
                            "cursor-pointer transition-all",
                            isSelected ? "bg-muted/70" : "hover:bg-muted/40",
                            isFeatured && "border-l-4 border-l-primary bg-primary/5 hover:bg-primary/10",
                            isFeatured && isSelected && "bg-primary/15",
                          )}
                          onClick={() => setSelectedAgentId(agent.id)}
                        >
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                {isFeatured && (
                                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                                )}
                                <p className={cn(
                                  "font-medium leading-none",
                                  isFeatured && "text-primary"
                                )}>{agent.name}</p>
                                {isFeatured && (
                                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 text-xs">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                              {agent.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-normal">
                              {agent.category || agent.type || "general"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AgentStatusBadge agent={agent} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}

            {selectedAgent && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold leading-tight">{selectedAgent.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedAgent.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="font-normal">
                      Slug: {selectedAgent.slug || "n/a"}
                    </Badge>
                    {selectedAgent.config?.features?.enableResearch && (
                      <Badge variant="secondary" className="font-normal">
                        Research mode
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Provider routing</h3>
                  <ProviderSummary agent={selectedAgent} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleRunAgent}
                    disabled={runMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {runMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    {runMutation.isPending ? "Running..." : "Run agent"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingAgent(selectedAgent);
                      setIsEditorOpen(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Agent
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Show interactive runner for Lead Auto-Enrichment Agent */}
          {selectedAgent?.slug === "lead-auto-enrichment" && (
            <LeadEnrichmentAgentRunner />
          )}
          
          {/* Show interactive runner for BD Research Analyst Agent */}
          {selectedAgent?.slug === "bd-research-analyst" && (
            <BDResearchAnalystRunner />
          )}
          
          {/* Show interactive runner for BD Weekly Insights Agent */}
          {selectedAgent?.slug === "bd-weekly-insights" && selectedAgent?.id && (
            <BDWeeklyInsightsRunner agentId={selectedAgent.id} />
          )}
          
          {/* Show interactive runner for LinkedIn Message Generator Agent */}
          {selectedAgent?.slug === "linkedin-message-generator" && (
            <LinkedInMessageGeneratorRunner />
          )}
          
          <AgentRunHistoryPanel agentId={selectedAgent?.id} />
        </div>
      </div>

      <AgentConfigModal
        agent={editingAgent}
        open={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSuccess={(savedAgent) => {
          setSelectedAgentId(savedAgent.id);
          setIsEditorOpen(false);
          setEditingAgent(savedAgent);
        }}
      />
    </div>
  );
}
