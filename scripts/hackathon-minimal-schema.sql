-- =============================================================================
-- Hackathon MINIMAL database (skip full db push)
-- =============================================================================
-- Use when: full `supabase db push` keeps failing on fresh personal projects.
-- This creates ONLY what the Client Task Triage Agent demo needs.
--
-- HOW TO USE:
-- 1. Supabase Dashboard → your project → Settings → General
--    → "Reset database" (or create a brand-new free project)
-- 2. Do NOT run `supabase db push` on this project
-- 3. SQL Editor → paste this entire file → Run
-- 4. Auth → Users → Add user: test@example.com / TestPassword123! (auto-confirm)
-- 5. Run scripts/post-migration-hackathon-bootstrap.sql
-- 6. Set Vercel env vars to this project's URL + anon key
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helpers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'super_admin', 'admin', 'manager', 'project_manager', 'team_member',
    'bd_user', 'client', 'pm', 'user'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

-- Profiles & roles (login)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Core CRM tables for task triage demo
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  company TEXT,
  website TEXT,
  contact_person TEXT,
  industry TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  priority TEXT NOT NULL DEFAULT 'medium',
  deadline DATE,
  project_manager UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  category TEXT CHECK (category IN ('ideas', 'discussion', 'work', 'other')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Hackathon triage results
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

-- Patch columns missing when tables already exist from a partial `db push`
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
CREATE UNIQUE INDEX IF NOT EXISTS idx_hackathon_clients_slug ON public.clients(slug) WHERE slug IS NOT NULL;

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_manager UUID;

ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS created_by UUID;
-- Task form enhanced fields (full app sends these on create/update)
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS estimated_hours NUMERIC;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS actual_hours NUMERIC;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS is_campaign_associated BOOLEAN DEFAULT false;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS campaign_id UUID;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS google_folder JSONB;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS active_collab_link TEXT;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS workboard_ai_link TEXT;
ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS reference_url TEXT;

CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_task_triage_results_task_id ON public.task_triage_results(task_id);
CREATE INDEX IF NOT EXISTS idx_task_triage_results_status ON public.task_triage_results(status);

-- updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON public.project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_task_triage_results_updated_at ON public.task_triage_results;
CREATE TRIGGER update_task_triage_results_updated_at
  BEFORE UPDATE ON public.task_triage_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: authenticated users (hackathon sandbox — simple & permissive)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_triage_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hackathon_profiles_all" ON public.profiles;
CREATE POLICY "hackathon_profiles_all" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_user_roles_all" ON public.user_roles;
CREATE POLICY "hackathon_user_roles_all" ON public.user_roles
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_clients_all" ON public.clients;
CREATE POLICY "hackathon_clients_all" ON public.clients
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_projects_all" ON public.projects;
CREATE POLICY "hackathon_projects_all" ON public.projects
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_project_tasks_all" ON public.project_tasks;
CREATE POLICY "hackathon_project_tasks_all" ON public.project_tasks
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_triage_select" ON public.task_triage_results;
CREATE POLICY "hackathon_triage_select" ON public.task_triage_results
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_triage_insert" ON public.task_triage_results;
CREATE POLICY "hackathon_triage_insert" ON public.task_triage_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "hackathon_triage_update" ON public.task_triage_results;
CREATE POLICY "hackathon_triage_update" ON public.task_triage_results
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'team_member'::public.app_role)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Demo seed (same tasks as hackathon migration)
-- ---------------------------------------------------------------------------

INSERT INTO public.clients (
  id, name, slug, email, company, contact_person, status, industry, website
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
  id, name, description, status, client_id
) VALUES (
  'a0000002-0000-4000-8000-000000000002',
  'Acme Client Support & Delivery',
  'Hackathon demo project — incoming client tasks for AI triage agent',
  'in_progress',
  'a0000001-0000-4000-8000-000000000001'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.project_tasks (
  id, project_id, title, description, status, priority, category, assigned_to, due_date
) VALUES
  (
    'a0000011-0000-4000-8000-000000000011',
    'a0000002-0000-4000-8000-000000000002',
    'Site down???',
    'Client emailed: "Our site is not loading!!! Please fix ASAP" — no URL, no error screenshot, sent from phone.',
    'todo', 'medium', NULL, NULL, CURRENT_DATE
  ),
  (
    'a0000012-0000-4000-8000-000000000012',
    'a0000002-0000-4000-8000-000000000002',
    'Can we add a button on the homepage',
    'Quick ask from client PM — wants a "Book a Demo" button somewhere visible. No mockup attached.',
    'todo', 'medium', NULL, NULL, CURRENT_DATE + 7
  ),
  (
    'a0000013-0000-4000-8000-000000000013',
    'a0000002-0000-4000-8000-000000000002',
    'Invoice question - wrong amount',
    'Finance contact says last invoice total is wrong. Mentions PO #4482 but no line-item detail.',
    'todo', 'medium', NULL, NULL, CURRENT_DATE + 2
  ),
  (
    'a0000014-0000-4000-8000-000000000014',
    'a0000002-0000-4000-8000-000000000002',
    'Weekly sync notes',
    'Client shared bullet notes from their internal standup — mostly FYI, asks if we saw anything concerning.',
    'todo', 'medium', NULL, NULL, CURRENT_DATE + 5
  ),
  (
    'a0000015-0000-4000-8000-000000000015',
    'a0000002-0000-4000-8000-000000000002',
    'Need API docs updated before launch Friday',
    'Dev lead says public API docs are outdated. Launch is this Friday. Links to staging swagger in Slack thread we cannot access.',
    'todo', 'medium', NULL, NULL, CURRENT_DATE + 3
  ),
  (
    'a0000016-0000-4000-8000-000000000016',
    'a0000002-0000-4000-8000-000000000002',
    'Client angry about delay - please call ASAP',
    'Escalation from account owner. No specific deliverable named. Tone is urgent. Wants a call today.',
    'todo', 'medium', NULL, NULL, CURRENT_DATE
  ),
  (
    'a0000017-0000-4000-8000-000000000017',
    'a0000002-0000-4000-8000-000000000002',
    'Question about brand colors in new banner',
    'Marketing sent a banner PDF — asks if blues match brand guidelines. Low urgency but needs a reply.',
    'todo', 'low', NULL, NULL, CURRENT_DATE + 10
  )
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Hackathon minimal schema ready' AS status, count(*) AS demo_tasks
FROM public.project_tasks
WHERE project_id = 'a0000002-0000-4000-8000-000000000002';
