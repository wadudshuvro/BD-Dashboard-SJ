import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SequenceBuilder } from "./SequenceBuilder";
import { useCreateSequence } from "@/hooks/useSequences";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBDCampaigns } from "@/hooks/useBDCampaigns";

interface SequenceStepInsert {
  sequence_id?: string;
  step_order: number;
  channel: string;
  delay_value: number;
  delay_unit: 'days' | 'hours' | 'minutes';
  content_template: {
    subject?: string;
    body?: string;
    variables?: string[];
  };
  conditions?: any;
  ai_personalization_enabled?: boolean;
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
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | undefined>(campaignId);
  const { campaigns, isLoading } = useBDCampaigns(undefined, 1, 100);
  
  const createSequence = useCreateSequence();

  const handleSave = async () => {
    if (!name.trim() || !selectedCampaignId) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    await createSequence.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      campaign_id: selectedCampaignId,
      status: 'draft',
      created_by: user?.id,
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
          <DialogDescription>
            Select a campaign to associate this sequence with, then add steps and content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Campaign</label>
            <Select
              value={selectedCampaignId}
              onValueChange={setSelectedCampaignId}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Loading campaigns..." : "Select a campaign"} />
              </SelectTrigger>
              <SelectContent>
                {campaigns && campaigns.length > 0 ? (
                  campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No campaigns available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
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
            disabled={!name.trim() || !selectedCampaignId || createSequence.isPending}
          >
            {createSequence.isPending ? "Creating..." : "Create Sequence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
