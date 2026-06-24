import { Button } from "@/components/ui/button";
import { Bot, Clock, Shield, Sparkles, Zap } from "lucide-react";

interface AITriageHeroProps {
  onTryDemo: () => void;
  onScrollToHowItWorks: () => void;
}

export function AITriageHero({ onTryDemo, onScrollToHowItWorks }: AITriageHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-violet-200/60 bg-gradient-to-r from-violet-600/10 via-primary/5 to-indigo-600/10 p-8 md:p-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-600/15 px-3 py-1 text-xs font-semibold text-violet-700 dark:text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Hackathon 2026 · AI Agent
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
          Autonomous Client Task Triage Agent
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          A digital ops teammate inside SJ BD Dashboard. It reads messy client tasks, recommends priority,
          owner, and follow-ups — then applies changes only after you approve.
        </p>
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-violet-600" />
            <span><strong>~15 min → under 2 min</strong> per task</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-violet-600" />
            <span>Human approval required</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-violet-600" />
            <span>Supabase Edge Functions + structured AI</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
            onClick={onTryDemo}
          >
            <Bot className="h-4 w-4 mr-2" />
            Try demo task — “Site down???”
          </Button>
          <Button variant="outline" onClick={onScrollToHowItWorks}>
            How it works
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Loads the hackathon demo task “Site down???” and scrolls to the triage workspace below.
        </p>
      </div>
    </section>
  );
}
