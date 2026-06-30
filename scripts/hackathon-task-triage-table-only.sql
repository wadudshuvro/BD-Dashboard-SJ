-- =============================================================================
-- Add ONLY task_triage_results to an existing Supabase project (e.g. team DB)
-- =============================================================================
-- Use ONLY if you cannot point Vercel at the hackathon personal project.
-- Preferred: set Vercel env to oxvfbrxoooindyrqvjgk instead.
-- Safe to re-run.
-- =============================================================================

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

CREATE INDEX IF NOT EXISTS idx_task_triage_results_task_id ON public.task_triage_results(task_id);
CREATE INDEX IF NOT EXISTS idx_task_triage_results_status ON public.task_triage_results(status);

ALTER TABLE public.task_triage_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hackathon_triage_select" ON public.task_triage_results;
CREATE POLICY "hackathon_triage_select" ON public.task_triage_results
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_triage_insert" ON public.task_triage_results;
CREATE POLICY "hackathon_triage_insert" ON public.task_triage_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_triage_update" ON public.task_triage_results;
CREATE POLICY "hackathon_triage_update" ON public.task_triage_results
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
