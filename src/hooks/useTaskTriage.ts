import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type TaskTriageResult = Database["public"]["Tables"]["task_triage_results"]["Row"];

export type TriagePriority = "low" | "medium" | "high" | "urgent";
export type TriageCategory = "ideas" | "discussion" | "work" | "other";

export interface FollowUpSubtask {
  title: string;
  priority: TriagePriority;
  due_in_days: number;
}

export interface ApproveTriagePayload {
  triageId: string;
  taskId: string;
  projectId: string;
  priority: TriagePriority;
  assigneeId: string | null;
  category: TriageCategory | null;
  followUpSubtasks: FollowUpSubtask[];
}

export const HACKATHON_DEMO_PROJECT_ID = "a0000002-0000-4000-8000-000000000002";
export const HACKATHON_DEMO_TASK_ID = "a0000011-0000-4000-8000-000000000011";

async function getFunctionInvokeErrorMessage(error: unknown, data: unknown): Promise<string> {
  if (data && typeof data === "object" && data !== null) {
    const record = data as Record<string, unknown>;
    if (typeof record.error === "string") return record.error;
    if (typeof record.message === "string") return record.message;
  }

  if (error && typeof error === "object" && error !== null) {
    const err = error as { message?: string; context?: unknown };
    const context = err.context;

    if (context instanceof Response) {
      try {
        const body = (await context.clone().json()) as Record<string, unknown>;
        if (typeof body.error === "string") return body.error;
        if (typeof body.message === "string") return body.message;
      } catch {
        // Response body is not JSON
      }
    } else if (context && typeof context === "object") {
      const ctx = context as Record<string, unknown>;
      if (typeof ctx.error === "string") return ctx.error;
      if (typeof ctx.message === "string") return ctx.message;
    }

    if (typeof err.message === "string" && err.message.length > 0) {
      if (err.message.includes("non-2xx")) {
        return "Edge Function failed. Deploy triage-project-task to this Supabase project and check function logs.";
      }
      return err.message;
    }
  }

  return "Edge Function request failed. Deploy triage-project-task to this Supabase project.";
}

export type TriageQueueStatus = "needs_triage" | "pending_review" | "triaged";

export interface TaskWithTriageStatus {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  triageStatus: TriageQueueStatus;
  latestTriageId?: string;
}

export function useTasksWithTriageStatus() {
  return useQuery({
    queryKey: ["tasks-with-triage-status"],
    queryFn: async (): Promise<TaskWithTriageStatus[]> => {
      const { data: tasks, error: tasksError } = await supabase
        .from("project_tasks")
        .select("id, project_id, title, description, priority, status, due_date")
        .order("created_at", { ascending: false });

      if (tasksError) throw tasksError;

      const { data: triageResults, error: triageError } = await supabase
        .from("task_triage_results")
        .select("id, task_id, status, created_at")
        .order("created_at", { ascending: false });

      // Graceful fallback when hackathon table isn't migrated yet (e.g. wrong Supabase project)
      if (triageError) {
        console.warn("task_triage_results unavailable:", triageError.message);
      }

      const latestByTask = new Map<string, { id: string; status: string }>();
      for (const result of triageResults ?? []) {
        if (!latestByTask.has(result.task_id)) {
          latestByTask.set(result.task_id, { id: result.id, status: result.status });
        }
      }

      const withStatus: TaskWithTriageStatus[] = (tasks ?? []).map((task) => {
        const latest = latestByTask.get(task.id);
        let triageStatus: TriageQueueStatus = "needs_triage";

        if (latest?.status === "approved") triageStatus = "triaged";
        else if (latest?.status === "pending") triageStatus = "pending_review";
        else if (latest?.status === "rejected") triageStatus = "needs_triage";

        return {
          ...task,
          triageStatus,
          latestTriageId: latest?.id,
        };
      });

      return withStatus.sort((a, b) => {
        const aDemo = a.project_id === HACKATHON_DEMO_PROJECT_ID ? 0 : 1;
        const bDemo = b.project_id === HACKATHON_DEMO_PROJECT_ID ? 0 : 1;
        if (aDemo !== bDemo) return aDemo - bDemo;

        const order: Record<TriageQueueStatus, number> = {
          needs_triage: 0,
          pending_review: 1,
          triaged: 2,
        };
        return order[a.triageStatus] - order[b.triageStatus];
      });
    },
    staleTime: 15000,
  });
}

export function useRecentTriageResults(limit = 5) {
  return useQuery({
    queryKey: ["recent-triage-results", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_triage_results")
        .select(`
          id,
          task_id,
          status,
          suggested_priority,
          created_at,
          reviewed_at,
          task:project_tasks(title)
        `)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.warn("recent triage results unavailable:", error.message);
        return [];
      }
      return data ?? [];
    },
    staleTime: 15000,
  });
}

export function useTriageHubStats() {
  const { data: tasks = [] } = useTasksWithTriageStatus();

  const needsTriage = tasks.filter((t) => t.triageStatus === "needs_triage").length;
  const pendingReview = tasks.filter((t) => t.triageStatus === "pending_review").length;
  const triaged = tasks.filter((t) => t.triageStatus === "triaged").length;

  return { needsTriage, pendingReview, triaged, total: tasks.length };
}

export function useTaskTriageResult(taskId?: string) {
  return useQuery({
    queryKey: ["task-triage", taskId],
    queryFn: async (): Promise<TaskTriageResult | null> => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from("task_triage_results")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
    staleTime: 15000,
  });
}

export function useRunTaskTriage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<TaskTriageResult> => {
      const { data, error } = await supabase.functions.invoke("triage-project-task", {
        body: { task_id: taskId },
      });

      if (error) {
        throw new Error(await getFunctionInvokeErrorMessage(error, data));
      }
      if (data?.error) throw new Error(data.error as string);
      if (!data?.result) throw new Error("Triage returned no result");

      return data.result as TaskTriageResult;
    },
    onSuccess: (_data, taskId) => {
      queryClient.invalidateQueries({ queryKey: ["task-triage", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks-with-triage-status"] });
      queryClient.invalidateQueries({ queryKey: ["recent-triage-results"] });
      toast({
        title: "Triage complete",
        description: "AI recommendations are ready for your review.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Triage failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useApproveTaskTriage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (payload: ApproveTriagePayload) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error: taskError } = await supabase
        .from("project_tasks")
        .update({
          priority: payload.priority,
          assigned_to: payload.assigneeId,
          category: payload.category,
        })
        .eq("id", payload.taskId);

      if (taskError) throw taskError;

      if (payload.followUpSubtasks.length > 0) {
        const subtasks = payload.followUpSubtasks.map((subtask) => {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + subtask.due_in_days);

          return {
            project_id: payload.projectId,
            title: subtask.title,
            priority: subtask.priority,
            status: "todo" as const,
            due_date: dueDate.toISOString().split("T")[0],
            created_by: user.id,
          };
        });

        const { error: subtaskError } = await supabase
          .from("project_tasks")
          .insert(subtasks);

        if (subtaskError) throw subtaskError;
      }

      const { error: triageError } = await supabase
        .from("task_triage_results")
        .update({
          status: "approved",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          suggested_priority: payload.priority,
          suggested_assignee_id: payload.assigneeId,
          suggested_category: payload.category,
          follow_up_subtasks: payload.followUpSubtasks,
        })
        .eq("id", payload.triageId);

      if (triageError) throw triageError;
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: ["task-triage", payload.taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-detail", payload.taskId] });
      queryClient.invalidateQueries({ queryKey: ["project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["all-project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["my-project-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-with-triage-status"] });
      queryClient.invalidateQueries({ queryKey: ["recent-triage-results"] });
      toast({
        title: "Triage applied",
        description: "Task updated and follow-up subtasks created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to apply triage",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRejectTaskTriage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ triageId, taskId }: { triageId: string; taskId: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("task_triage_results")
        .update({
          status: "rejected",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", triageId);

      if (error) throw error;
      return taskId;
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: ["task-triage", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks-with-triage-status"] });
      queryClient.invalidateQueries({ queryKey: ["recent-triage-results"] });
      toast({
        title: "Triage dismissed",
        description: "AI suggestions were rejected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to reject triage",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
