import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Sparkles } from "lucide-react";

const STEPS = [
  {
    icon: ListTodo,
    title: "1. Select a client task",
    description: "Pick an incoming task from the queue — vague titles, missing owners, urgent client emails.",
  },
  {
    icon: Sparkles,
    title: "2. AI analyzes & recommends",
    description: "The agent suggests priority, owner, category, a client-safe update, and 2–3 follow-up subtasks.",
  },
  {
    icon: CheckCircle2,
    title: "3. You approve & apply",
    description: "Nothing changes until you click Approve. Edit suggestions first, or reject entirely.",
  },
];

interface AITriageHowItWorksProps {
  id?: string;
}

export function AITriageHowItWorks({ id }: AITriageHowItWorksProps) {
  return (
    <section id={id} className="scroll-mt-6">
      <h2 className="text-lg font-semibold mb-4">How it works</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title} className="border-violet-100 dark:border-violet-900/50">
            <CardContent className="pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/40 mb-4">
                <step.icon className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-medium mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground mt-4 text-center">
        AI suggests · You approve · Full audit trail in <code className="text-xs bg-muted px-1 rounded">task_triage_results</code>
      </p>
    </section>
  );
}
