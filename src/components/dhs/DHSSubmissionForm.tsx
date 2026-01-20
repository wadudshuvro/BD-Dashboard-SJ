import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useSubmitDHS, useUpdateDHS, useTodayDHSSubmission } from "@/hooks/useDHSSubmissions";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, CheckCircle2, Edit2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DHSStatus } from "@/types/dhs";

const dhsFormSchema = z.object({
  follow_ups_done: z.coerce.number().min(0, "Cannot be negative").max(999, "Maximum 999"),
  calls_made: z.coerce.number().min(0, "Cannot be negative").max(999, "Maximum 999"),
  meetings_booked: z.coerce.number().min(0, "Cannot be negative").max(999, "Maximum 999"),
  pipeline_updated: z.boolean(),
  score: z.coerce.number().min(1).max(10).optional().or(z.literal('')),
  status: z.enum(['on_track', 'at_risk', 'blocked']).optional().or(z.literal('')),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

type DHSFormValues = z.infer<typeof dhsFormSchema>;

export function DHSSubmissionForm() {
  const { user } = useAuth();
  const submitDHS = useSubmitDHS();
  const updateDHS = useUpdateDHS();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [scoreValue, setScoreValue] = useState<number[]>([5]);

  // Check if user has already submitted DHS for today
  const { data: todaySubmission, isLoading: isCheckingSubmission } = useTodayDHSSubmission(user?.id);

  const hasSubmittedToday = !!todaySubmission;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DHSFormValues>({
    resolver: zodResolver(dhsFormSchema),
    defaultValues: {
      follow_ups_done: 0,
      calls_made: 0,
      meetings_booked: 0,
      pipeline_updated: false,
      score: '' as any,
      status: '' as any,
      notes: '',
    },
  });

  const pipelineUpdated = watch('pipeline_updated');
  const statusValue = watch('status');

  // Load existing submission data when in edit mode
  useEffect(() => {
    if (todaySubmission && isEditing) {
      setValue('follow_ups_done', todaySubmission.follow_ups_done);
      setValue('calls_made', todaySubmission.calls_made);
      setValue('meetings_booked', todaySubmission.meetings_booked);
      setValue('pipeline_updated', todaySubmission.pipeline_updated);
      setValue('score', todaySubmission.score as any || '' as any);
      setValue('status', todaySubmission.status as any || '' as any);
      setValue('notes', todaySubmission.notes || '');
      if (todaySubmission.score) {
        setScoreValue([todaySubmission.score]);
      }
    }
  }, [todaySubmission, isEditing, setValue]);

  const onSubmit = async (values: DHSFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to submit DHS");
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = {
        follow_ups_done: values.follow_ups_done,
        calls_made: values.calls_made,
        meetings_booked: values.meetings_booked,
        pipeline_updated: values.pipeline_updated,
        score: values.score && values.score !== '' ? Number(values.score) : undefined,
        status: values.status && values.status !== '' ? (values.status as DHSStatus) : undefined,
        notes: values.notes || undefined,
      };

      if (hasSubmittedToday && todaySubmission) {
        // Update existing submission
        await updateDHS.mutateAsync({
          id: todaySubmission.id,
          updates: submissionData,
        });
        toast.success("DHS updated successfully");
        setIsEditing(false);
      } else {
        // Create new submission
        await submitDHS.mutateAsync({
          date: new Date().toISOString().split('T')[0],
          ...submissionData,
        });
        toast.success("DHS submitted successfully");
        reset();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit DHS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    reset();
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
    <Card>
      <CardHeader>
        <CardTitle>Daily Head Start</CardTitle>
        <CardDescription>
          Plan your day and track BD health indicators
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCheckingSubmission ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : hasSubmittedToday && !isEditing ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-900">DHS Already Submitted</AlertTitle>
              <AlertDescription className="text-green-800">
                You have already submitted your Daily Head Start for today. You can edit it throughout the day if needed.
              </AlertDescription>
            </Alert>
            <Button onClick={handleEdit} variant="outline" className="w-full">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Today's Submission
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* BD Metrics Section */}
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
                    placeholder="0"
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
                    placeholder="0"
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
                    placeholder="0"
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

            {/* Score Section */}
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

            {/* Status Section */}
            <div className="space-y-2">
              <Label htmlFor="status">Status (Optional)</Label>
              <Select
                value={statusValue || ''}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  <SelectItem value="on_track">✅ On Track</SelectItem>
                  <SelectItem value="at_risk">⚠️ At Risk</SelectItem>
                  <SelectItem value="blocked">🚫 Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes Section */}
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

            <div className="flex gap-2">
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Saving..." : isEditing ? "Update DHS" : "Submit DHS"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

