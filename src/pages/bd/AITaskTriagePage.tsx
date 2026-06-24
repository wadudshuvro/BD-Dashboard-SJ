import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AITriageHero } from "@/components/ai-triage/AITriageHero";
import { useTaskDetail } from "@/hooks/useTaskDetail";
import { AITriageHowItWorks } from "@/components/ai-triage/AITriageHowItWorks";
import { AITriageTaskQueue } from "@/components/ai-triage/AITriageTaskQueue";
import { AITriageRecentActivity } from "@/components/ai-triage/AITriageRecentActivity";
import { TaskTriageWorkspace } from "@/components/ai-triage/TaskTriageWorkspace";
import {
  HACKATHON_DEMO_PROJECT_ID,
  HACKATHON_DEMO_TASK_ID,
  useTasksWithTriageStatus,
  useTriageHubStats,
  type TaskWithTriageStatus,
} from "@/hooks/useTaskTriage";
import { Bot, CheckCircle2, ListTodo, Sparkles } from "lucide-react";

export default function AITaskTriagePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const { data: tasks = [] } = useTasksWithTriageStatus();
  const stats = useTriageHubStats();

  const selectedTaskId = searchParams.get("task") ?? undefined;
  const { task: urlTaskDetail } = useTaskDetail(selectedTaskId);

  const selectedTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId),
    [tasks, selectedTaskId]
  );

  const workspaceTaskId = selectedTaskId;
  const workspaceProjectId =
    selectedTask?.project_id ??
    urlTaskDetail?.project_id ??
    (selectedTaskId === HACKATHON_DEMO_TASK_ID ? HACKATHON_DEMO_PROJECT_ID : undefined);
  const workspaceTaskTitle = selectedTask?.title ?? urlTaskDetail?.title;

  const scrollToWorkspace = useCallback(() => {
    workspaceRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSelectTask = useCallback(
    (task: TaskWithTriageStatus) => {
      setSearchParams({ task: task.id });
      window.setTimeout(scrollToWorkspace, 150);
    },
    [setSearchParams, scrollToWorkspace]
  );

  const handleTryDemo = useCallback(() => {
    setSearchParams({ task: HACKATHON_DEMO_TASK_ID });
    toast({
      title: "Demo task loaded",
      description: "“Site down???” is selected — scroll down and click Run AI Triage.",
    });
    window.setTimeout(scrollToWorkspace, 150);
  }, [setSearchParams, scrollToWorkspace]);

  const scrollToHowItWorks = useCallback(() => {
    howItWorksRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem("ai-triage-seen");
    if (!seen) {
      localStorage.setItem("ai-triage-seen", "true");
    }
  }, []);

  return (
    <div className="py-8 space-y-8 max-w-7xl mx-auto">
      <AITriageHero onTryDemo={handleTryDemo} onScrollToHowItWorks={scrollToHowItWorks} />

      <div ref={howItWorksRef}>
        <AITriageHowItWorks id="how-it-works" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ListTodo className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.needsTriage}</p>
              <p className="text-xs text-muted-foreground">Needs triage</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pendingReview}</p>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.triaged}</p>
              <p className="text-xs text-muted-foreground">Triaged & applied</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div ref={workspaceRef} className="grid gap-6 lg:grid-cols-5 scroll-mt-24">
        <div className="lg:col-span-2">
          <AITriageTaskQueue
            selectedTaskId={selectedTaskId}
            onSelectTask={handleSelectTask}
          />
        </div>
        <div className="lg:col-span-3">
          <TaskTriageWorkspace
            taskId={workspaceTaskId}
            projectId={workspaceProjectId}
            taskTitle={workspaceTaskTitle}
            variant="embedded"
          />
        </div>
      </div>

      <AITriageRecentActivity />

      <footer className="text-center text-xs text-muted-foreground border-t pt-6 flex items-center justify-center gap-2">
        <Bot className="h-3.5 w-3.5" />
        Built on SJ BD Dashboard · Supabase Edge Functions · Human-in-the-loop approval
      </footer>
    </div>
  );
}
