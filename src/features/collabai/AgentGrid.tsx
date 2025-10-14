import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, ExternalLink } from "lucide-react";

export function AgentGrid({ agents, onTry }: { agents: any[]; onTry: (agent: any) => void }) {
  if (!agents?.length) return <div className="text-center text-muted-foreground py-8">No agents found.</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <Card key={agent.id} className="relative hover:shadow-lg transition-shadow">
          <CardContent className="p-6 space-y-4">
            {/* Header with icon and model */}
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{agent.type || "gpt-4"}</span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg leading-tight">{agent.name}</h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {agent.description}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <span>🎯</span>
                <span>{agent.category || "Business Development"}</span>
              </Badge>
              <Badge variant="secondary">ORGANIZATIONAL</Badge>
            </div>

            {/* Sample Questions */}
            {agent.sample_questions && agent.sample_questions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Sample Questions:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {agent.sample_questions.slice(0, 2).map((q: string, idx: number) => (
                    <li key={idx} className="truncate">• {q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Open Chat Button */}
            <Button 
              onClick={() => onTry(agent)} 
              className="w-full"
              disabled={!agent.active}
              variant={agent.active ? "default" : "outline"}
            >
              Open Chat
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}