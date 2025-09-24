import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AgentGrid({ agents, onTry }: { agents: any[]; onTry: (agent: any) => void }) {
  if (!agents?.length) return <div className="text-center text-muted-foreground py-8">No agents found.</div>;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <Card key={agent.id} className="relative">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{agent.name}</span>
              <Badge variant={agent.active ? "default" : "secondary"}>
                {agent.active ? "Active" : "Inactive"}
              </Badge>
            </CardTitle>
            <Badge variant="outline">{agent.type || "Agent"}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{agent.description}</p>
            <Button 
              onClick={() => onTry(agent)} 
              className="w-full"
              disabled={!agent.active}
            >
              Try {agent.name}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}