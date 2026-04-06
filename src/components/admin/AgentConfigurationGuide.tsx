import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronDown, ChevronRight, HelpCircle, Info } from "lucide-react";

const CATEGORIES = [
  { value: "general", label: "General", desc: "Broad assistance and Q&A" },
  { value: "communication", label: "Communication", desc: "Drafts, emails, messaging" },
  { value: "analysis", label: "Analysis", desc: "Data and report analysis" },
  { value: "task_management", label: "Task Management", desc: "Tasks and follow-ups" },
];

export function QuickStartWizard() {
  const steps = ["Name & slug", "Category", "System prompt", "Enable & memory", "Save"];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Quick start</CardTitle>
      </CardHeader>
      <CardContent className="text-xs text-muted-foreground">
        <ol className="list-decimal list-inside space-y-1">
          {steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function AgentCategoryGuide() {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </CardHeader>
      {open && (
        <CardContent className="pt-0">
          <ul className="text-xs text-muted-foreground space-y-2">
            {CATEGORIES.map((c) => (
              <li key={c.value}>
                <span className="font-medium">{c.label}</span> — {c.desc}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

export function SystemPromptGuide() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">Good:</p>
          <p className="text-xs">Clear role, tone, and scope (e.g. &quot;You are a BD analyst. Be concise.&quot;)</p>
          <p className="font-medium mt-2">Avoid:</p>
          <p className="text-xs">Vague or contradictory instructions.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MemorySystemGuide() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" variant="ghost" size="icon" className="h-6 w-6">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          When enabled, conversation history is stored and sent as context so the agent can refer to earlier messages.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function MultiAgentCollaborationInfo() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>You can use multiple agents for different tasks; assign categories and routes so users see the right one.</AlertDescription>
    </Alert>
  );
}

export function HITLApprovalInfo() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>For sensitive actions (e.g. sending emails), consider human-in-the-loop approval in your workflow.</AlertDescription>
    </Alert>
  );
}
