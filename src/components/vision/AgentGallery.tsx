import { Bot, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgentList } from "@/hooks/useAgentList";

const agentMissions: Record<string, string> = {
  "bd-research-analyst": "Analyzes lead research data and provides 10 key insights",
  "bd-weekly-insights": "Generates weekly BD insights and action items",
  "client-intelligence-assistant": "Analyzes client data for strategic insights",
  "client-objection-handler": "Provides evidence-based responses to objections",
  "deal-pipeline-analyzer": "Identifies bottlenecks and opportunities in pipeline",
  "deal-status-intelligence": "Analyzes meeting notes for deal status updates",
  "document-qa-assistant": "Answers questions about deal documents instantly",
  "lead-auto-enrichment-agent": "Enriches contacts with company data and scores",
  "linkedin-lead-analyzer": "Analyzes engagement and recommends follow-up",
  "linkedin-message-generator": "Generates personalized outreach messages",
  "proposal-gap-analysis": "Compares requirements against proposals",
};

const AgentGallery = () => {
  const { data: agents, isLoading } = useAgentList();
  
  const activeAgents = agents?.filter(a => a.is_active) ?? [];

  return (
    <section>
      <div className="flex items-center gap-3 mb-2">
        <Bot className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">AI Agent Gallery</h2>
      </div>
      <p className="text-muted-foreground mb-6">
        Meet the intelligent agents powering your business development workflows
      </p>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activeAgents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No active agents configured</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeAgents.map((agent) => (
            <Card key={agent.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {agent.category || "General"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                  {agent.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agentMissions[agent.slug || ""] || agent.description || "AI-powered automation"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
};

export default AgentGallery;
