import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SequenceBuilder } from "./SequenceBuilder";
import { useCreateSequence } from "@/hooks/useSequences";

interface SequenceStepInsert {
  sequence_id?: string;
  step_order: number;
  channel_type: string;
  delay_days: number;
  delay_hours: number;
  template_id?: string | null;
  custom_message?: string | null;
  conditions?: any;
}

interface SequenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId?: string;
}

export function SequenceDialog({ open, onOpenChange, campaignId }: SequenceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState<SequenceStepInsert[]>([]);
  
  const createSequence = useCreateSequence();

  const handleSave = async () => {
    if (!name.trim()) {
      return;
    }

    await createSequence.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      campaign_id: campaignId,
      steps,
    });

    // Reset form
    setName("");
    setDescription("");
    setSteps([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Outreach Sequence</DialogTitle>
        </DialogHeader>
        
        <SequenceBuilder
          name={name}
          description={description}
          steps={steps}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onStepsChange={setSteps}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!name.trim() || createSequence.isPending}
          >
            {createSequence.isPending ? "Creating..." : "Create Sequence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
