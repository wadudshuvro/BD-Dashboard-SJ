-- Hackathon: Client Task Triage Agent — Phase 1
-- Stores AI triage suggestions pending human approval

CREATE TABLE IF NOT EXISTS public.task_triage_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  suggested_priority TEXT NOT NULL CHECK (suggested_priority IN ('low', 'medium', 'high', 'urgent')),
  suggested_assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  suggested_category TEXT CHECK (suggested_category IN ('ideas', 'discussion', 'work', 'other')),
  suggested_next_action TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  client_status_update TEXT NOT NULL,
  follow_up_subtasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  raw_ai_response JSONB,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_triage_results_task_id
  ON public.task_triage_results(task_id);

CREATE INDEX IF NOT EXISTS idx_task_triage_results_status
  ON public.task_triage_results(status);

CREATE INDEX IF NOT EXISTS idx_task_triage_results_task_status
  ON public.task_triage_results(task_id, status);

COMMENT ON TABLE public.task_triage_results IS
  'AI-generated task triage suggestions awaiting human approval (Hackathon: Client Task Triage Agent)';

COMMENT ON COLUMN public.task_triage_results.follow_up_subtasks IS
  'JSON array: [{ "title": string, "priority": string, "due_in_days": number }]';

DROP TRIGGER IF EXISTS update_task_triage_results_updated_at ON public.task_triage_results;
CREATE TRIGGER update_task_triage_results_updated_at
  BEFORE UPDATE ON public.task_triage_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.task_triage_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view triage results" ON public.task_triage_results;
CREATE POLICY "Authenticated users can view triage results"
  ON public.task_triage_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can create triage results" ON public.task_triage_results;
CREATE POLICY "Authenticated users can create triage results"
  ON public.task_triage_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update triage results" ON public.task_triage_results;
CREATE POLICY "Authenticated users can update triage results"
  ON public.task_triage_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ---------------------------------------------------------------------------
-- Hackathon demo seed data (idempotent — safe to re-run)
-- Fixed UUIDs so demo tasks are easy to find in the UI
-- ---------------------------------------------------------------------------

INSERT INTO public.clients (
  id,
  name,
  slug,
  email,
  company,
  contact_person,
  status,
  industry,
  website
) VALUES (
  'a0000001-0000-4000-8000-000000000001',
  'Acme Retail Co',
  'hackathon-acme-retail',
  'support@acmeretail.example',
  'Acme Retail Co',
  'Jordan Lee',
  'active',
  'Retail',
  'https://acmeretail.example'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.projects (
  id,
  name,
  description,
  status,
  client_id
) VALUES (
  'a0000002-0000-4000-8000-000000000002',
  'Acme Client Support & Delivery',
  'Hackathon demo project — incoming client tasks for AI triage agent',
  'in_progress',
  'a0000001-0000-4000-8000-000000000001'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (
  id,
  project_id,
  title,
  description,
  status,
  priority,
  category,
  assigned_to,
  due_date
) VALUES
  (
    'a0000011-0000-4000-8000-000000000011',
    'a0000002-0000-4000-8000-000000000002',
    'Site down???',
    'Client emailed: "Our site is not loading!!! Please fix ASAP" — no URL, no error screenshot, sent from phone.',
    'todo',
    'medium',
    NULL,
    NULL,
    CURRENT_DATE
  ),
  (
    'a0000012-0000-4000-8000-000000000012',
    'a0000002-0000-4000-8000-000000000002',
    'Can we add a button on the homepage',
    'Quick ask from client PM — wants a "Book a Demo" button somewhere visible. No mockup attached.',
    'todo',
    'medium',
    NULL,
    NULL,
    CURRENT_DATE + 7
  ),
  (
    'a0000013-0000-4000-8000-000000000013',
    'a0000002-0000-4000-8000-000000000002',
    'Invoice question - wrong amount',
    'Finance contact says last invoice total is wrong. Mentions PO #4482 but no line-item detail.',
    'todo',
    'medium',
    NULL,
    NULL,
    CURRENT_DATE + 2
  ),
  (
    'a0000014-0000-4000-8000-000000000014',
    'a0000002-0000-4000-8000-000000000002',
    'Weekly sync notes',
    'Client shared bullet notes from their internal standup — mostly FYI, asks if we saw anything concerning.',
    'todo',
    'medium',
    NULL,
    NULL,
    CURRENT_DATE + 5
  ),
  (
    'a0000015-0000-4000-8000-000000000015',
    'a0000002-0000-4000-8000-000000000002',
    'Need API docs updated before launch Friday',
    'Dev lead says public API docs are outdated. Launch is this Friday. Links to staging swagger in Slack thread we cannot access.',
    'todo',
    'medium',
    NULL,
    NULL,
    CURRENT_DATE + 3
  ),
  (
    'a0000016-0000-4000-8000-000000000016',
    'a0000002-0000-4000-8000-000000000002',
    'Client angry about delay - please call ASAP',
    'Escalation from account owner. No specific deliverable named. Tone is urgent. Wants a call today.',
    'todo',
    'medium',
    NULL,
    NULL,
    CURRENT_DATE
  ),
  (
    'a0000017-0000-4000-8000-000000000017',
    'a0000002-0000-4000-8000-000000000002',
    'Question about brand colors in new banner',
    'Marketing sent a banner PDF — asks if blues match brand guidelines. Low urgency but needs a reply.',
    'todo',
    'low',
    NULL,
    NULL,
    CURRENT_DATE + 10
  )
ON CONFLICT (id) DO NOTHING;
