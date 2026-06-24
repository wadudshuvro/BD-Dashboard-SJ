# Hackathon: Autonomous Client Task Triage Agent

**Status**: 🔄 In Progress (Hackathon MVP)  
**Author**: Hackathon team  
**Date**: June 20, 2026  
**Platform**: SJ BD Dashboard  
**Category**: AI Agent (primary) · Workflow Automation (secondary)

---

## Overview

PMs and client success teams manually read incoming client tasks, decide priority, assign owners, draft status updates, and create follow-ups. This agent acts as a **first-line digital teammate**: it analyzes a task, returns structured recommendations, and applies changes only after human approval.

**Hackathon goal:** Ship a demo-ready MVP in 1–2 days using existing SJ BD Dashboard infrastructure — not a standalone app.

**Demo metric:** Task triage from ~15 min → under 2 min per task.

---

## What Already Exists (Reuse This)

| Asset | Location | How you use it |
|-------|----------|----------------|
| Task records | `project_tasks` table | Input to the agent |
| Client context | `projects` → `clients` | Join via `project_id` |
| Team roster | `useBDTeamMembers()` | Owner suggestions |
| Task detail page | `src/pages/bd/TaskViewPage.tsx` | Mount triage UI here |
| Task CRUD hooks | `src/hooks/useProjectTasks.tsx` | Apply approved changes |
| AI structured output pattern | `supabase/functions/generate-followup-suggestions/` | Copy tool-call JSON pattern |
| Agent runs (optional) | `ai_agent_runs` + `run-ai-agent` | Log executions for demo |
| Task list | `src/pages/ActionsTasks.tsx` | Show “Needs triage” badge |

**Do NOT build:** Control Tower ingestion, n8n, or a new `client_tasks` table for MVP. Use `project_tasks` + seed data.

---

## MVP Scope

### In scope (must have for demo)

- [x] Database: `task_triage_results` table + RLS + demo seed (`20260620120000_task_triage_agent.sql`)
- [ ] “Run AI Triage” button on task detail page
- [ ] AI returns structured JSON: priority, owner, category, next action, client-safe update, 2–3 subtasks
- [ ] Human review panel: **Approve** / **Edit & Approve** / **Reject**
- [ ] On approve: update parent task + create subtasks in `project_tasks`
- [ ] 5–8 seeded demo tasks with messy/incomplete descriptions
- [ ] 3-minute live demo script

### Out of scope (skip for hackathon)

- Auto-trigger on task insert (webhook / n8n)
- Email/Slack notifications
- Full `run-ai-agent` integration (use dedicated Edge Function instead — faster)
- Control Tower sync
- Scheduled/cron runs

---

## Architecture (Minimal)

```
User opens task (/bd/actions/tasks/:id)
        │
        ▼
TaskTriagePanel ──► supabase.functions.invoke('triage-project-task')
        │                      │
        │                      ├─ Load task + project + client + team members
        │                      ├─ Call AI with structured tool schema
        │                      └─ Insert row into task_triage_results (status: pending)
        ▼
User reviews suggestions
        │
        ├─ Approve ──► update project_tasks + insert subtasks
        ├─ Reject  ──► mark triage row rejected
        └─ Edit      ──► inline edits then approve
```

---

## Prerequisites

Before Phase 2, use your **personal Supabase** (isolated from team DB):

**→ [Personal Supabase setup guide](./hackathon-personal-supabase-setup.md)**  
**→ Run:** `.\scripts\setup-personal-supabase.ps1`

---

### New table: `task_triage_results`

Store AI output separately so you never overwrite task data before approval.

```sql
-- Migration: supabase/migrations/YYYYMMDDHHMMSS_task_triage_agent.sql

CREATE TABLE public.task_triage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  suggested_priority TEXT NOT NULL CHECK (suggested_priority IN ('low','medium','high','urgent')),
  suggested_assignee_id UUID REFERENCES auth.users(id),
  suggested_category TEXT CHECK (suggested_category IN ('ideas','discussion','work','other')),
  suggested_next_action TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  client_status_update TEXT NOT NULL,
  follow_up_subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- follow_up_subtasks shape: [{ "title": "...", "priority": "medium", "due_in_days": 2 }]
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  raw_ai_response JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_triage_results_task_id ON public.task_triage_results(task_id);
CREATE INDEX idx_task_triage_results_status ON public.task_triage_results(status);

ALTER TABLE public.task_triage_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view triage results"
  ON public.task_triage_results FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create triage results"
  ON public.task_triage_results FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update triage results"
  ON public.task_triage_results FOR UPDATE TO authenticated
  USING (auth.uid() = reviewed_by OR auth.uid() = created_by);
```

### Seed demo tasks

Create one project linked to an existing client, then insert 5–8 tasks with realistic messy input:

| Title | Why it’s good for demo |
|-------|------------------------|
| “Site down???” | Urgent, vague, no owner |
| “Can we add a button on the homepage” | Medium, needs categorization |
| “Invoice question - wrong amount” | High, client-facing update needed |
| “Weekly sync notes” | Low, discussion category |
| “Need API docs updated before launch Friday” | Urgent + deadline in description |

Put seed SQL in the same migration or `supabase/seed/hackathon-triage-tasks.sql`.

---

## Phase 2: Edge Function (1–2 hours)

### File: `supabase/functions/triage-project-task/index.ts`

**Pattern to copy:** `supabase/functions/generate-followup-suggestions/index.ts` (structured tool call + JSON parse).

**Request body:**

```json
{
  "task_id": "uuid"
}
```

**Steps:**

1. Auth check (JWT from `Authorization` header)
2. Fetch task with joins:

```typescript
const { data: task } = await supabase
  .from('project_tasks')
  .select(`
    *,
    project:projects(
      id, name, priority, deadline, project_manager,
      client:clients(id, name, industry)
    )
  `)
  .eq('id', taskId)
  .single();
```

3. Fetch team members from `profiles` (id, full_name, email) for owner matching
4. Call AI with **forced tool schema** `triage_client_task`:

```typescript
{
  suggested_priority: 'low' | 'medium' | 'high' | 'urgent',
  suggested_assignee_email: string,  // match to profiles.email in code
  suggested_category: 'ideas' | 'discussion' | 'work' | 'other',
  suggested_next_action: string,
  reasoning: string,
  client_status_update: string,  // professional, no internal jargon
  follow_up_subtasks: Array<{
    title: string,
    priority: 'low' | 'medium' | 'high' | 'urgent',
    due_in_days: number
  }>
}
```

5. Map `suggested_assignee_email` → `suggested_assignee_id`
6. Insert into `task_triage_results` with `status: 'pending'`
7. Return the row to the frontend

**System prompt (keep short):**

> You are an autonomous client task triage agent for a digital agency. Analyze the task and client context. Recommend priority, owner (pick from team list), category, and next action. Draft a client-safe status update (professional, concise, no internal blame). Propose 2–3 internal follow-up subtasks. Be conservative on urgency — only mark urgent when deadline, outage, or revenue risk is explicit.

**Deploy:**

```bash
supabase functions deploy triage-project-task
```

---

## Phase 3: Frontend Hook (30 min)

### File: `src/hooks/useTaskTriage.ts`

```typescript
// Exports:
// useTaskTriageResult(taskId)     — query latest pending/approved result
// useRunTaskTriage()              — mutation: invoke edge function
// useApproveTaskTriage()          — mutation: apply suggestions to DB
// useRejectTaskTriage()           — mutation: set status rejected
```

**Approve logic (`useApproveTaskTriage`):**

1. Update parent `project_tasks` row:
   - `priority`, `assigned_to`, `category`
2. For each item in `follow_up_subtasks`:
   - Insert new `project_tasks` with same `project_id`, title from JSON, computed `due_date`
3. Update `task_triage_results.status = 'approved'`, set `reviewed_by`, `reviewed_at`
4. Invalidate: `['task-detail', taskId]`, `['project-tasks']`

Reference existing mutations in `src/hooks/useProjectTasks.tsx`.

---

## Phase 4: UI Component (1–2 hours)

### File: `src/components/tasks/TaskTriagePanel.tsx`

Mount on **`src/pages/bd/TaskViewPage.tsx`** above or beside `TaskDetailsPanel`.

**States:**

| State | UI |
|-------|-----|
| No triage yet | Card with “Run AI Triage” button + 1-line explanation |
| Loading | Skeleton + “Analyzing task…” |
| Pending result | Show all suggestions in editable fields |
| Approved | Green badge “Triage applied” + timestamp |
| Rejected | Muted “Triage dismissed” |

**Pending result layout:**

```
┌─ AI Task Triage ──────────────────────────────┐
│ Priority:     [urgent ▼]                       │
│ Assign to:    [Sarah Chen ▼]                   │
│ Category:     [work ▼]                         │
│ Next action:  [Investigate production outage]  │
│ Why:          "Description mentions site down" │
│                                                │
│ Client update (copyable):                      │
│ ┌────────────────────────────────────────────┐ │
│ │ We've received your report and escalated...  │ │
│ └────────────────────────────────────────────┘ │
│                                                │
│ Follow-up subtasks:                            │
│ ☑ Check server logs (high, due in 1 day)      │
│ ☑ Notify client with ETA (urgent, due today)   │
│                                                │
│ [Reject]  [Approve & Apply]                    │
└────────────────────────────────────────────────┘
```

Use existing shadcn components: `Card`, `Button`, `Select`, `Textarea`, `Badge`, `Loader2`.

**Optional polish:** “Copy client update” button with `navigator.clipboard.writeText`.

---

## Phase 5: Optional AI Agent Registry Row (15 min)

Insert into `ai_agents` so it appears in Admin → AI Agents for the pitch:

```sql
INSERT INTO ai_agents (name, slug, description, type, category, is_active, is_enabled, system_prompt, output_actions)
VALUES (
  'Client Task Triage Agent',
  'client-task-triage',
  'Analyzes incoming client tasks and recommends priority, owner, category, client updates, and follow-up subtasks.',
  'project_management',
  'project_management',
  true,
  true,
  '... same system prompt as Edge Function ...',
  '{"create_tasks": true, "send_alerts": false}'::jsonb
);
```

This is optional for MVP — the Edge Function + UI is enough for demo.

---

## File Checklist

| Step | File | Action |
|------|------|--------|
| 1 | `supabase/migrations/*_task_triage_agent.sql` | Create table + RLS + seed |
| 2 | `supabase/functions/triage-project-task/index.ts` | New Edge Function |
| 3 | `src/hooks/useTaskTriage.ts` | New hook |
| 4 | `src/components/tasks/TaskTriagePanel.tsx` | New component |
| 5 | `src/pages/bd/TaskViewPage.tsx` | Import + render panel |
| 6 | `src/integrations/supabase/types.ts` | Regenerate after migration |

---

## 3-Minute Demo Script

**Slide / opening (15 sec)**  
> “Client tasks arrive messy — no priority, no owner, slow responses. Our agent is a digital ops teammate that triages in seconds, with humans approving every change.”

**Live demo (2 min)**

1. Go to **BD → All Tasks** (`/bd/actions/tasks`)
2. Open **“Site down???”** task (urgent, unassigned)
3. Click **Run AI Triage** → wait ~5–10 sec
4. Walk through suggestions:
   - “AI flagged **urgent** because of outage language”
   - “Recommended **owner** based on project manager / workload”
   - “Drafted **client-safe update** — no internal panic language”
   - “Created **2 follow-up subtasks** automatically”
5. Click **Approve & Apply** → task updates, subtasks appear
6. Open a second task (“Invoice question”) → show different priority/category

**Close (45 sec)**  
> “Manual triage: ~15 minutes. With our agent: under 2 minutes, with full human control. Built on SJ BD Dashboard — tasks, clients, and our existing AI stack. Next: auto-trigger on task create and Control Tower integration.”

**Backup plan:** If AI is slow, pre-run triage on demo tasks before presenting; show fresh run only if time allows.

---

## Day-by-Day Plan

### Day 1 (Backend + core flow)

| Time | Task |
|------|------|
| AM | Migration + seed data + apply locally |
| AM | Edge Function + test with curl/Postman |
| PM | `useTaskTriage` hook + wire invoke |
| PM | Basic `TaskTriagePanel` (run + display only) |

### Day 2 (Polish + demo)

| Time | Task |
|------|------|
| AM | Approve/reject flow + subtask creation |
| AM | Edit fields before approve |
| PM | Seed polish + rehearse demo 3× |
| PM | Optional: badge on task list for untriaged tasks |

---

## Judging Alignment

| Hackathon criterion | How you hit it |
|---------------------|----------------|
| **AI Agent** | Autonomous analysis + structured decisions, not chat |
| **Workflow automation** | One-click apply creates subtasks + updates fields |
| **Productivity** | 15 min → 2 min metric |
| **Human in the loop** | Approve/reject gate — enterprise credible |
| **Uses company platform** | Built inside SJ BD Dashboard, not a throwaway repo |

---

## Pitch One-Liner

> **Autonomous Client Task Triage Agent** — ingests new client tasks in SJ BD Dashboard, classifies priority and category, recommends owner, drafts client-safe updates, and generates follow-up subtasks with human approval.

---

## Registration Text (copy-paste)

**Title:** Autonomous Client Task Triage Agent  

**Category:** AI Agent  

**Description:** A digital ops teammate inside SJ BD Dashboard that reads incoming client tasks, recommends priority/owner/category, drafts client-safe status updates, and proposes follow-up subtasks — with human approval before any changes are applied. Reduces manual triage from ~15 minutes to under 2 minutes per task.

**Tech:** Supabase (`project_tasks`, `task_triage_results`), Edge Function (`triage-project-task`), React + TanStack Query, structured AI JSON output.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| AI returns wrong owner | Pass explicit team list in prompt; match by email in code |
| `project_id` null on tasks | Seed tasks must link to a project with a client |
| Edge Function 401 | Pass session JWT: `supabase.functions.invoke(..., { headers: { Authorization: \`Bearer ${session.access_token}\` }})` |
| Types out of date | Run Supabase type generation after migration |
| Demo task has no client context | Join `projects → clients` in Edge Function; show client name in UI |

---

## After Hackathon (if you win / continue)

1. Auto-trigger triage on `project_tasks` INSERT (DB trigger → Edge Function)
2. Integrate with Control Tower task sync
3. Merge into `run-ai-agent` orchestrator for provider fallback chain
4. Add manager dashboard: “Tasks awaiting triage”
5. Log all runs to `ai_agent_runs` for analytics
