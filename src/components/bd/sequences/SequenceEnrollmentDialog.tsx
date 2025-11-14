import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { SequenceWithSteps } from "@/Api/sequences";
import { ContactSelectionTable } from "./ContactSelectionTable";
import { EmailTemplateSelector } from "./EmailTemplateSelector";
import { DripModeConfig, type BatchConfig } from "./DripModeConfig";

interface SequenceEnrollmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequence: SequenceWithSteps | null;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  messagesPerBatch: 25,
  repeatInterval: 1,
  repeatUnit: 'days',
  sendDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  timeWindowStart: '09:00',
  timeWindowEnd: '17:00',
};

export function SequenceEnrollmentDialog({
  open,
  onOpenChange,
  sequence,
}: SequenceEnrollmentDialogProps) {
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [emailTemplateId, setEmailTemplateId] = useState<string | null>(null);
  const [schedulingMode, setSchedulingMode] = useState<'immediate' | 'scheduled' | 'drip'>('drip');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [batchConfig, setBatchConfig] = useState<BatchConfig>(DEFAULT_BATCH_CONFIG);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setSelectedContactIds([]);
      setEmailTemplateId(null);
      setSchedulingMode('drip');
      setScheduledDateTime('');
      setBatchConfig(DEFAULT_BATCH_CONFIG);
    }
  }, [open]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      if (!sequence) throw new Error('No sequence selected');
      if (selectedContactIds.length === 0) throw new Error('No contacts selected');
      if (!emailTemplateId) throw new Error('No email template selected');

      const startDateTime = schedulingMode === 'scheduled' && scheduledDateTime
        ? scheduledDateTime
        : new Date().toISOString();

      const { data, error } = await supabase.functions.invoke('sequence-enroll-contacts', {
        body: {
          sequenceId: sequence.id,
          contactIds: selectedContactIds,
          config: {
            scheduling_mode: schedulingMode,
            batch_config: schedulingMode === 'drip' ? {
              messagesPerBatch: batchConfig.messagesPerBatch,
              interval: batchConfig.repeatInterval,
              intervalUnit: batchConfig.repeatUnit,
            } : undefined,
            send_days: schedulingMode === 'drip' ? batchConfig.sendDays : undefined,
            time_window_start: schedulingMode === 'drip' ? batchConfig.timeWindowStart : undefined,
            time_window_end: schedulingMode === 'drip' ? batchConfig.timeWindowEnd : undefined,
            start_date_time: startDateTime,
            email_template_id: emailTemplateId,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Contacts enrolled successfully');
      queryClient.invalidateQueries({ queryKey: ['sequence-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['sequence-metrics'] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to enroll contacts', {
        description: error.message,
      });
    },
  });

  const handleEnroll = () => {
    enrollMutation.mutate();
  };

  const isValid = selectedContactIds.length > 0 && 
    emailTemplateId !== null &&
    (schedulingMode !== 'scheduled' || scheduledDateTime !== '');

  if (!sequence) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Automation</DialogTitle>
          <DialogDescription>
            Runs the selected workflow or campaign for all selected contacts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sequence Info */}
          <div className="space-y-2">
            <Label>Sequence</Label>
            <div className="p-3 bg-muted rounded-lg">
              <div className="font-medium">{sequence.name}</div>
              {sequence.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {sequence.description}
                </div>
              )}
            </div>
          </div>

          {/* Contact Selection */}
          <div className="space-y-2">
            <Label>Select Contacts *</Label>
            <ContactSelectionTable
              campaignId={sequence.campaign_id}
              selectedContactIds={selectedContactIds}
              onSelectionChange={setSelectedContactIds}
            />
          </div>

          {/* Email Template Selection */}
          <EmailTemplateSelector
            selectedTemplateId={emailTemplateId}
            onTemplateChange={setEmailTemplateId}
          />

          {/* Mode Selection */}
          <div className="space-y-4">
            <Label>Mode</Label>
            <RadioGroup value={schedulingMode} onValueChange={(value: any) => setSchedulingMode(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="immediate" id="immediate" />
                <Label htmlFor="immediate" className="font-normal cursor-pointer">
                  Send All at Once
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="scheduled" id="scheduled" />
                <Label htmlFor="scheduled" className="font-normal cursor-pointer">
                  Send at Scheduled Time
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="drip" id="drip" />
                <Label htmlFor="drip" className="font-normal cursor-pointer">
                  Send in Drip Mode
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Scheduled DateTime */}
          {schedulingMode === 'scheduled' && (
            <div className="space-y-2">
              <Label htmlFor="scheduled-time">Start Date & Time *</Label>
              <Input
                id="scheduled-time"
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
              />
            </div>
          )}

          {/* Drip Mode Configuration */}
          {schedulingMode === 'drip' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-datetime">Start Date & Time</Label>
                <Input
                  id="start-datetime"
                  type="datetime-local"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  placeholder="Start immediately if not set"
                />
              </div>
              
              <DripModeConfig
                config={batchConfig}
                onChange={setBatchConfig}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={!isValid || enrollMutation.isPending}
          >
            {enrollMutation.isPending ? 'Adding...' : 'Add to Automation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}