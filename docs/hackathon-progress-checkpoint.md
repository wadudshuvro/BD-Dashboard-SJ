# Hackathon Progress Checkpoint

**Last updated:** June 24, 2026  
**Project:** Autonomous Client Task Triage Agent  
**Supabase project:** `oxvfbrxoooindyrqvjgk` (SJ BD Dashboard — personal)

---

## What's done

### Code (in repo)
| Item | Status | Path |
|------|--------|------|
| DB migration (full app) | Written | `supabase/migrations/20260620120000_task_triage_agent.sql` |
| Minimal hackathon DB script | Done | `scripts/hackathon-minimal-schema.sql` |
| One-command deploy script | Done | `scripts/hackathon-deploy-all.ps1` |
| Resume deploy script | Done | `scripts/hackathon-deploy-resume.ps1` |
| Edge Function | Done + deployed | `supabase/functions/triage-project-task/` |
| React hook | Done | `src/hooks/useTaskTriage.ts` |
| AI Triage hub page | Done | `src/pages/bd/AITaskTriagePage.tsx` |
| Sidebar nav (NEW badge) | Done | `src/components/Layout.tsx` |
| Task detail → hub link | Done | `src/pages/bd/TaskViewPage.tsx` |
| UI panel (hub workspace) | Done | `src/components/ai-triage/TaskTriageWorkspace.tsx` |
| Task detail page wired | Done | Slim banner → hub |
| Task detail fix (no bd_campaigns join) | Done | `src/hooks/useTaskDetail.tsx` |
| Demo triage fallback (no AI key) | Done | Edge Function `buildDemoTriage()` |
| Admin test guide | Done | `docs/hackathon-admin-test-guide.md` |
| Task create project_id fix | Done | `src/components/tasks/TaskForm.tsx` |
| Task create column patch SQL | Done | `scripts/hackathon-patch-project-tasks-columns.sql` |
| Try demo task scroll + toast | Done | `src/pages/bd/AITaskTriagePage.tsx` |

### Infrastructure (your Supabase)
| Item | Status |
|------|--------|
| Minimal schema applied | Yes — 7 demo tasks |
| Test user | `test@example.com` / `TestPassword123!` |
| Bootstrap SQL (super_admin) | Run |
| `.env.local` | Created → personal project |
| Edge Function deployed | `triage-project-task` |
| Full `db push` (232 migrations) | **Abandoned** — use minimal schema instead |
| `LOVABLE_API_KEY` on Edge Functions | **Not set** — demo mode works without it |
| Vercel deploy | **Not done yet** |

---

## What works today

1. `npm run dev` with `.env.local` → personal Supabase
2. Login as `test@example.com` (Super Admin)
3. **Sidebar → AI Task Triage (NEW)** → dedicated hub at `/bd/ai-task-triage`
4. Click **Site down???** in queue (or **Try demo task**)
5. **Run AI Triage** → demo suggestions (urgent, subtasks, client update)
6. **Approve & Apply** → updates task + creates subtasks
7. **Create new task** → pick Project (defaults to Acme), save to personal Supabase

**Demo URLs:**
- Hub: http://localhost:8080/bd/ai-task-triage
- Site down with task pre-selected: http://localhost:8080/bd/ai-task-triage?task=a0000011-0000-4000-8000-000000000011
- Task detail (banner → hub): http://localhost:8080/bd/actions/tasks/a0000011-0000-4000-8000-000000000011

---

## Known issues (non-blocking for demo)

| Issue | Impact | Fix when ready |
|-------|--------|----------------|
| Task create: `active_collab_link` column missing | Create Task fails on minimal DB | Run `scripts/hackathon-patch-project-tasks-columns.sql` in Supabase SQL Editor |
| Task create: `project_id` null | Fixed in app — Project dropdown required | Refresh app; default project = Acme demo |
| Comments: `task_comments` table missing | Red error in Comments panel | Add table to minimal schema or ignore |
| `LOVABLE_API_KEY` empty | Uses **demo** triage, not live AI | Add key + redeploy function |
| `VERCEL_TOKEN` empty | No Vercel deploy yet | Add token + run deploy |
| Full app routes may error | Only tasks/triage path tested | Expected on minimal DB |

---

## Your local files (do not commit)

| File | Purpose |
|------|---------|
| `.env.local` | Points app at `oxvfbrxoooindyrqvjgk` |
| `hackathon.secrets.env` | DB password, anon key, service role, optional LOVABLE/VERCEL |

---

## Tomorrow — start here (30 min plan)

### 1. Verify local still works
```powershell
cd C:\Users\pc\sj-bd-dashboard
npm run dev
```
Login: `test@example.com` / `TestPassword123!`  
Open: http://localhost:8080/bd/ai-task-triage?task=a0000011-0000-4000-8000-000000000011  
Run **Run AI Triage** → **Approve & Apply**

### 2. Optional — real AI
Add `LOVABLE_API_KEY` to `hackathon.secrets.env`, then:
```powershell
npx supabase secrets set LOVABLE_API_KEY=your-key --project-ref oxvfbrxoooindyrqvjgk
npx supabase functions deploy triage-project-task --project-ref oxvfbrxoooindyrqvjgk
```

### 3. Deploy for admin (Vercel)
1. Push code to GitHub
2. Import repo on [vercel.com](https://vercel.com)
3. Set env vars (same as `.env.local`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy → share URL + test login from `docs/hackathon-admin-test-guide.md`

Or add `VERCEL_TOKEN` to `hackathon.secrets.env` and run:
```powershell
npm run hackathon:deploy
```

### 4. Polish (if time)
- [ ] Rehearse 3-minute demo script (`docs/hackathon-client-task-triage-agent.md`)
- [ ] Optional: "Needs triage" badge on task list
- [ ] Optional: fix Comments panel (add `task_comments` to minimal schema)

---

## Quick commands reference

```powershell
# Resume deploy (schema already applied — skips if re-run)
powershell -ExecutionPolicy Bypass -File scripts/hackathon-deploy-resume.ps1

# Full deploy from scratch
npm run hackathon:deploy

# Redeploy Edge Function only
npx supabase functions deploy triage-project-task --project-ref oxvfbrxoooindyrqvjgk
```

---

## Demo task IDs

| Task | ID |
|------|-----|
| Site down??? | `a0000011-0000-4000-8000-000000000011` |
| Invoice question | `a0000013-0000-4000-8000-000000000013` |
| Demo project | `a0000002-0000-4000-8000-000000000002` |

---

## Pitch one-liner

> **Autonomous Client Task Triage Agent** — reads client tasks in SJ BD Dashboard, recommends priority/owner/category, drafts client-safe updates, and proposes follow-up subtasks with human approval before any changes are applied.
