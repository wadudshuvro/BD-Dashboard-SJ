import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Trash2, Eye } from "lucide-react";
import { useSequences, useToggleSequence, useDeleteSequence } from "@/hooks/useSequences";
import type { SequenceWithSteps } from "@/Api/sequences";

interface SequenceListProps {
  campaignId?: string;
  onViewSequence?: (sequence: SequenceWithSteps) => void;
}

export function SequenceList({ campaignId, onViewSequence }: SequenceListProps) {
  const { data: sequences, isLoading } = useSequences(campaignId);
  const toggleSequence = useToggleSequence();
  const deleteSequence = useDeleteSequence();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading sequences...</div>;
  }

  if (!sequences || sequences.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No sequences created yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {sequences.map((sequence) => (
        <Card key={sequence.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{sequence.name}</CardTitle>
                  <Badge variant={sequence.is_active ? "default" : "secondary"}>
                    {sequence.is_active ? "Active" : "Paused"}
                  </Badge>
                </div>
                {sequence.description && (
                  <CardDescription>{sequence.description}</CardDescription>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSequence.mutate({
                    id: sequence.id,
                    isActive: !sequence.is_active
                  })}
                >
                  {sequence.is_active ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                {onViewSequence && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewSequence(sequence)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteSequence.mutate(sequence.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {sequence.outreach_sequence_steps?.length || 0} steps
              </div>
              {sequence.outreach_sequence_steps && sequence.outreach_sequence_steps.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {sequence.outreach_sequence_steps.map((step, idx) => (
                    <Badge key={idx} variant="outline">
                      Step {step.step_order}: {step.channel_type}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
