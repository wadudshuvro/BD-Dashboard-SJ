import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useTasksWithTriageStatus,
  type TaskWithTriageStatus,
  type TriageQueueStatus,
} from "@/hooks/useTaskTriage";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface AITriageTaskQueueProps {
  selectedTaskId?: string;
  onSelectTask: (task: TaskWithTriageStatus) => void;
}

function statusBadge(status: TriageQueueStatus) {
  switch (status) {
    case "needs_triage":
      return (
        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
          Needs triage
        </Badge>
      );
    case "pending_review":
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
          Review pending
        </Badge>
      );
    case "triaged":
      return (
        <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
          Triaged
        </Badge>
      );
  }
}

function priorityDot(priority: string) {
  const colors: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-green-500",
  };
  return <span className={cn("h-2 w-2 rounded-full shrink-0", colors[priority] ?? "bg-gray-400")} />;
}

export function AITriageTaskQueue({ selectedTaskId, onSelectTask }: AITriageTaskQueueProps) {
  const { data: tasks = [], isLoading, error } = useTasksWithTriageStatus();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Task queue
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {tasks.length} tasks · demo project tasks listed first
        </p>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[480px] overflow-y-auto">
        {isLoading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive p-3 rounded-md bg-destructive/10">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Failed to load tasks</p>
              <p className="text-xs mt-1 opacity-90">
                {(error as Error).message || "Check Vercel env vars point to your hackathon Supabase project."}
              </p>
            </div>
          </div>
        )}
        {!isLoading && tasks.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No tasks found</p>
        )}
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onSelectTask(task)}
            className={cn(
              "w-full text-left rounded-lg border p-3 transition-all hover:border-violet-300 hover:bg-violet-50/50 dark:hover:bg-violet-950/20",
              selectedTaskId === task.id && "border-violet-500 bg-violet-50 dark:bg-violet-950/30 ring-1 ring-violet-500/30"
            )}
          >
            <div className="flex items-start gap-2">
              {priorityDot(task.priority)}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{task.title}</p>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{task.description}</p>
                )}
                <div className="mt-2">{statusBadge(task.triageStatus)}</div>
              </div>
              {task.triageStatus === "triaged" && (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              )}
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
