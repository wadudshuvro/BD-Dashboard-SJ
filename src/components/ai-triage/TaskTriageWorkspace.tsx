import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Bot, Copy, Loader2, Sparkles } from "lucide-react";
import { useBDTeamMembers } from "@/hooks/useBDTeamMembers";
import { useTaskDetail } from "@/hooks/useTaskDetail";
import {
  useApproveTaskTriage,
  useRejectTaskTriage,
  useRunTaskTriage,
  useTaskTriageResult,
  type FollowUpSubtask,
  type TriageCategory,
  type TriagePriority,
} from "@/hooks/useTaskTriage";
import { toast } from "@/components/ui/use-toast";

interface TaskTriageWorkspaceProps {
  taskId?: string;
  projectId?: string;
  taskTitle?: string;
  variant?: "card" | "embedded";
}

const PRIORITIES: TriagePriority[] = ["low", "medium", "high", "urgent"];
const CATEGORIES: TriageCategory[] = ["ideas", "discussion", "work", "other"];

function parseSubtasks(raw: unknown): FollowUpSubtask[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is FollowUpSubtask =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as FollowUpSubtask).title === "string"
    )
    .map((item) => ({
      title: item.title,
      priority: PRIORITIES.includes(item.priority) ? item.priority : "medium",
      due_in_days: typeof item.due_in_days === "number" ? item.due_in_days : 1,
    }));
}

export function TaskTriageWorkspace({
  taskId,
  projectId,
  taskTitle,
  variant = "embedded",
}: TaskTriageWorkspaceProps) {
  const needsTaskFetch = Boolean(taskId && !projectId);
  const { task: fetchedTask, isLoading: isLoadingTask } = useTaskDetail(
    needsTaskFetch ? taskId : undefined
  );

  const resolvedProjectId = projectId ?? fetchedTask?.project_id ?? undefined;
  const resolvedTitle = taskTitle ?? fetchedTask?.title;

  const { data: triageResult, isLoading } = useTaskTriageResult(taskId);
  const { data: teamMembers = [] } = useBDTeamMembers();
  const runTriage = useRunTaskTriage();
  const approveTriage = useApproveTaskTriage();
  const rejectTriage = useRejectTaskTriage();

  const [priority, setPriority] = useState<TriagePriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [category, setCategory] = useState<TriageCategory>("work");
  const [nextAction, setNextAction] = useState("");
  const [clientUpdate, setClientUpdate] = useState("");
  const [subtasks, setSubtasks] = useState<FollowUpSubtask[]>([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!triageResult) return;

    setPriority(triageResult.suggested_priority as TriagePriority);
    setAssigneeId(triageResult.suggested_assignee_id ?? "");
    setCategory((triageResult.suggested_category as TriageCategory) ?? "work");
    setNextAction(triageResult.suggested_next_action);
    setClientUpdate(triageResult.client_status_update);

    const parsed = parseSubtasks(triageResult.follow_up_subtasks);
    setSubtasks(parsed);
    setSelectedSubtasks(Object.fromEntries(parsed.map((_, i) => [i, true])));
  }, [triageResult]);

  const isPending = triageResult?.status === "pending";
  const isApproved = triageResult?.status === "approved";
  const isRejected = triageResult?.status === "rejected";
  const isRunning = runTriage.isPending;

  const handleCopyClientUpdate = async () => {
    try {
      await navigator.clipboard.writeText(clientUpdate);
      toast({ title: "Copied", description: "Client update copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const handleApprove = () => {
    if (!triageResult || !taskId || !resolvedProjectId) return;

    const selected = subtasks.filter((_, i) => selectedSubtasks[i]);

    approveTriage.mutate({
      triageId: triageResult.id,
      taskId,
      projectId: resolvedProjectId,
      priority,
      assigneeId: assigneeId || null,
      category,
      followUpSubtasks: selected,
    });
  };

  const handleReject = () => {
    if (!triageResult || !taskId) return;
    rejectTriage.mutate({ triageId: triageResult.id, taskId });
  };

  if (!taskId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-violet-200 bg-violet-50/30 dark:border-violet-800 dark:bg-violet-950/20 p-12 text-center min-h-[320px]">
        <Bot className="h-12 w-12 text-violet-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Select a task to triage</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Choose a client task from the queue on the left. The AI agent will analyze it and suggest priority, owner, and follow-ups.
        </p>
      </div>
    );
  }

  if (needsTaskFetch && isLoadingTask) {
    return (
      <div className="space-y-4 rounded-xl border p-6 min-h-[320px]">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!resolvedProjectId) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/50 p-12 text-center min-h-[320px]">
        <Bot className="h-12 w-12 text-amber-600 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Task has no project</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This task is not linked to a project, so triage cannot create follow-up subtasks. Link it to a project or use a demo task from the hackathon seed.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 rounded-xl border p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={variant === "embedded" ? "rounded-xl border bg-card p-6 shadow-sm" : ""}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-violet-500" />
            Triage workspace
          </h3>
          {resolvedTitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{resolvedTitle}</p>
          )}
        </div>
        {isApproved && <Badge className="bg-green-100 text-green-800">Applied</Badge>}
        {isRejected && <Badge variant="secondary">Dismissed</Badge>}
        {isPending && <Badge className="bg-amber-100 text-amber-800">Review pending</Badge>}
      </div>

      <div className="space-y-4">
        {!triageResult && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Run the triage agent to analyze this task and get structured recommendations in seconds.
            </p>
            <Button
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              onClick={() => runTriage.mutate(taskId)}
              disabled={isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing task…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Triage
                </>
              )}
            </Button>
          </div>
        )}

        {triageResult && isPending && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as TriagePriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign to</Label>
                <Select value={assigneeId || "unassigned"} onValueChange={(v) => setAssigneeId(v === "unassigned" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {teamMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as TriageCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Next action</Label>
              <Textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Why</Label>
              <p className="text-sm text-muted-foreground rounded-md bg-muted p-3">
                {triageResult.reasoning}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Client update</Label>
                <Button variant="ghost" size="sm" onClick={handleCopyClientUpdate}>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <Textarea value={clientUpdate} onChange={(e) => setClientUpdate(e.target.value)} rows={3} />
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-2">
                <Label>Follow-up subtasks</Label>
                <div className="space-y-2">
                  {subtasks.map((subtask, index) => (
                    <label key={index} className="flex items-start gap-2 text-sm rounded-md border p-2">
                      <Checkbox
                        checked={selectedSubtasks[index] ?? true}
                        onCheckedChange={(checked) =>
                          setSelectedSubtasks((prev) => ({ ...prev, [index]: !!checked }))
                        }
                      />
                      <span>
                        {subtask.title}
                        <span className="text-muted-foreground ml-1">
                          ({subtask.priority}, due in {subtask.due_in_days} day{subtask.due_in_days === 1 ? "" : "s"})
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" onClick={handleReject} disabled={rejectTriage.isPending || approveTriage.isPending}>
                Reject
              </Button>
              <Button
                className="bg-gradient-to-r from-violet-600 to-indigo-600"
                onClick={handleApprove}
                disabled={approveTriage.isPending || rejectTriage.isPending}
              >
                {approveTriage.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying…
                  </>
                ) : (
                  "Approve & Apply"
                )}
              </Button>
              <Button variant="secondary" onClick={() => runTriage.mutate(taskId)} disabled={isRunning}>
                Re-run
              </Button>
            </div>
          </div>
        )}

        {triageResult && (isApproved || isRejected) && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isApproved
                ? `Applied ${triageResult.reviewed_at ? new Date(triageResult.reviewed_at).toLocaleString() : ""}`
                : "Suggestions were dismissed. You can run triage again."}
            </p>
            <Button variant="outline" onClick={() => runTriage.mutate(taskId)} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Run AI Triage Again
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
