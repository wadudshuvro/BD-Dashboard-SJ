-- =============================================================================
-- Hackathon patch: project_tasks columns required by TaskForm
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor if task create fails with:
--   "Could not find the 'active_collab_link' column of 'project_tasks'"
--
-- Safe to re-run (IF NOT EXISTS on every column).
-- =============================================================================

ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS is_campaign_associated BOOLEAN DEFAULT false;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS google_folder JSONB;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS active_collab_link TEXT;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS workboard_ai_link TEXT;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS reference_url TEXT;

-- Refresh PostgREST schema cache (Supabase picks this up automatically; no action needed)
