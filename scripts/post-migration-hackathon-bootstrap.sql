-- Run in Supabase Dashboard -> SQL Editor AFTER db push + creating auth user
-- Grants admin access to test@example.com and verifies hackathon demo tasks exist

-- 1) Grant super_admin to test user (create user in Auth UI first)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::public.app_role
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT DO NOTHING;

-- 2) Ensure profile row exists for test user
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Hackathon Test User')
FROM auth.users
WHERE email = 'test@example.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);

-- 3) Verify hackathon demo tasks (from 20260620120000_task_triage_agent.sql)
SELECT id, title, priority, assigned_to
FROM public.project_tasks
WHERE project_id = 'a0000002-0000-4000-8000-000000000002'
ORDER BY title;
