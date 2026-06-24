import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface TaskTriagePanelProps {
  taskId: string;
  taskTitle?: string;
}

export function TaskTriagePanel({ taskId, taskTitle }: TaskTriagePanelProps) {
  return (
    <Card className="border-violet-200 bg-gradient-to-r from-violet-50/80 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 dark:border-violet-800">
      <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
            <Bot className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              AI Task Triage
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Triage{taskTitle ? ` “${taskTitle}”` : " this task"} in the dedicated hub — queue, live workspace, and audit trail.
            </p>
          </div>
        </div>
        <Button
          className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
          asChild
        >
          <Link to={`/bd/ai-task-triage?task=${taskId}`}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in AI Triage hub
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
