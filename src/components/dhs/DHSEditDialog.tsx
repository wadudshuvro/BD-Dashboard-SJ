import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateDHS } from "@/hooks/useDHSSubmissions";
import { Loader2 } from "lucide-react";
import { DHSStatus } from "@/types/dhs";

const dhsEditSchema = z.object({
  follow_ups_done: z.coerce.number().min(0).max(999),
  calls_made: z.coerce.number().min(0).max(999),
  meetings_booked: z.coerce.number().min(0).max(999),
  pipeline_updated: z.boolean(),
  score: z.coerce.number().min(1).max(10).optional().or(z.literal('')),
  status: z.enum(['on_track', 'at_risk', 'blocked']).optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
});

type DHSEditFormValues = z.infer<typeof dhsEditSchema>;

interface DHSEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: {
    id: string;
    follow_ups_done: number;
    calls_made: number;
    meetings_booked: number;
    pipeline_updated: boolean;
    score?: number | null;
    status?: DHSStatus | null;
    notes?: string | null;
  };
}

export function DHSEditDialog({ open, onOpenChange, submission }: DHSEditDialogProps) {
  const updateDHS = useUpdateDHS();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreValue, setScoreValue] = useState<number[]>([submission.score || 5]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DHSEditFormValues>({
    resolver: zodResolver(dhsEditSchema),
    defaultValues: {
      follow_ups_done: submission.follow_ups_done || 0,
      calls_made: submission.calls_made || 0,
      meetings_booked: submission.meetings_booked || 0,
      pipeline_updated: submission.pipeline_updated || false,
      score: submission.score as any || '' as any,
      status: submission.status as any || '' as any,
      notes: submission.notes || "",
    },
  });

  const pipelineUpdated = watch('pipeline_updated');
  const statusValue = watch('status');

  useEffect(() => {
    if (submission.score) {
      setScoreValue([submission.score]);
    }
  }, [submission.score]);

  const onSubmit = async (values: DHSEditFormValues) => {
    setIsSubmitting(true);
    try {
      await updateDHS.mutateAsync({
        id: submission.id,
        updates: {
          follow_ups_done: values.follow_ups_done,
          calls_made: values.calls_made,
          meetings_booked: values.meetings_booked,
          pipeline_updated: values.pipeline_updated,
          score: values.score != null && values.score !== ('' as unknown) ? Number(values.score) : undefined,
          status: values.status != null && values.status !== ('' as unknown) ? (values.status as DHSStatus) : undefined,
          notes: values.notes || undefined,
        },
      });

      toast.success("DHS updated successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update DHS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score <= 3) return 'text-red-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 3) return 'Needs Attention';
    if (score <= 6) return 'On Track';
    return 'Excellent';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit DHS Submission</DialogTitle>
          <DialogDescription>
            Update your Daily Head Start metrics
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">BD Health Indicators</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="follow_ups_done">Follow-ups Done</Label>
                <Input
                  id="follow_ups_done"
                  type="number"
                  min="0"
                  max="999"
                  {...register("follow_ups_done")}
                />
                {errors.follow_ups_done && (
                  <p className="text-sm text-destructive">{errors.follow_ups_done.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="calls_made">Calls Made</Label>
                <Input
                  id="calls_made"
                  type="number"
                  min="0"
                  max="999"
                  {...register("calls_made")}
                />
                {errors.calls_made && (
                  <p className="text-sm text-destructive">{errors.calls_made.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="meetings_booked">Meetings Booked</Label>
                <Input
                  id="meetings_booked"
                  type="number"
                  min="0"
                  max="999"
                  {...register("meetings_booked")}
                />
                {errors.meetings_booked && (
                  <p className="text-sm text-destructive">{errors.meetings_booked.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="pipeline_updated"
                checked={pipelineUpdated}
                onCheckedChange={(checked) => setValue('pipeline_updated', checked)}
              />
              <Label htmlFor="pipeline_updated" className="cursor-pointer">
                Pipeline Updated
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="score">Daily Score (Optional)</Label>
            <div className="space-y-2">
              <Slider
                id="score"
                min={1}
                max={10}
                step={1}
                value={scoreValue}
                onValueChange={(value) => {
                  setScoreValue(value);
                  setValue('score', value[0] as any);
                }}
                className="w-full"
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">1 (Low)</span>
                <span className={`font-semibold ${getScoreColor(scoreValue[0])}`}>
                  {scoreValue[0]} - {getScoreLabel(scoreValue[0])}
                </span>
                <span className="text-muted-foreground">10 (High)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status (Optional)</Label>
            <Select
              value={statusValue || 'none'}
              onValueChange={(value) => setValue('status', value === 'none' ? undefined : value as any)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="on_track">✅ On Track</SelectItem>
                <SelectItem value="at_risk">⚠️ At Risk</SelectItem>
                <SelectItem value="blocked">🚫 Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes / Exceptions (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context, exceptions, or notes..."
              className="min-h-[100px]"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

