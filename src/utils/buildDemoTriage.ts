import type { FollowUpSubtask, TriageCategory, TriagePriority } from "@/hooks/useTaskTriage";

export interface DemoTriageResult {
  suggested_priority: TriagePriority;
  suggested_assignee_email: string;
  suggested_category: TriageCategory;
  suggested_next_action: string;
  reasoning: string;
  client_status_update: string;
  follow_up_subtasks: FollowUpSubtask[];
}

export function buildDemoTriage(
  task: { title?: string | null; description?: string | null },
  profiles: Array<{ email?: string | null }> | null
): DemoTriageResult {
  const title = (task.title ?? "").toLowerCase();
  const description = (task.description ?? "").toLowerCase();
  const text = `${title} ${description}`;

  let suggested_priority: TriagePriority = "medium";
  let suggested_category: TriageCategory = "work";
  let suggested_next_action = "Review the client request and assign an owner.";
  let reasoning = "Demo triage mode (Edge Function unavailable or no AI key).";
  let client_status_update =
    "Thank you for reaching out. We have received your request and are reviewing it. We will follow up shortly with an update.";
  let follow_up_subtasks: FollowUpSubtask[] = [
    { title: "Clarify requirements with client", priority: "medium", due_in_days: 1 },
    { title: "Assign owner and post internal update", priority: "medium", due_in_days: 1 },
  ];

  if (text.includes("site down") || text.includes("not loading") || text.includes("asap")) {
    suggested_priority = "urgent";
    suggested_next_action = "Investigate production outage and confirm impact scope.";
    reasoning = "Outage / downtime language detected — escalated to urgent.";
    client_status_update =
      "Thank you for flagging this. We are investigating the site availability issue now and will share an ETA as soon as we have one.";
    follow_up_subtasks = [
      { title: "Check server logs and uptime monitors", priority: "urgent", due_in_days: 0 },
      { title: "Confirm fix and notify client with ETA", priority: "urgent", due_in_days: 0 },
      { title: "Document root cause for post-incident review", priority: "high", due_in_days: 2 },
    ];
  } else if (text.includes("invoice") || text.includes("wrong amount")) {
    suggested_priority = "high";
    suggested_next_action = "Reconcile invoice against PO and respond to finance contact.";
    reasoning = "Billing discrepancy — high priority for client trust.";
    client_status_update =
      "We are reviewing the invoice details you mentioned and will confirm the correct amount shortly.";
    follow_up_subtasks = [
      { title: "Pull invoice line items from billing", priority: "high", due_in_days: 1 },
      { title: "Send corrected summary to client finance contact", priority: "high", due_in_days: 2 },
    ];
  } else if (text.includes("weekly sync") || text.includes("fyi")) {
    suggested_priority = "low";
    suggested_category = "discussion";
    suggested_next_action = "Skim notes and reply with any concerns.";
    reasoning = "Informational client notes — low urgency.";
    client_status_update =
      "Thanks for sharing these notes. We have reviewed them and will follow up if anything needs attention.";
    follow_up_subtasks = [{ title: "Reply with brief acknowledgment", priority: "low", due_in_days: 3 }];
  }

  return {
    suggested_priority,
    suggested_assignee_email: profiles?.[0]?.email ?? "test@example.com",
    suggested_category,
    suggested_next_action,
    reasoning,
    client_status_update,
    follow_up_subtasks,
  };
}
