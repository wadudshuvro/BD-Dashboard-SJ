# Personal Supabase Setup (Hackathon)

**Goal:** Run SJ BD Dashboard against **your own** Supabase project — same **schema** as the team app (from this repo’s migrations), **not** connected to the team’s live database.

**Status:** Setup guide  
**Date:** June 20, 2026

---

## What “import structure” actually means

You do **not** need access to the team database (`qzzvcqoletuummdsbbio`).

| What | How |
|------|-----|
| **Database structure (tables, RLS, functions)** | Already in `supabase/migrations/` (232 files). Push to your project with `supabase db push`. |
| **Seed / demo data** | Included in some migrations + hackathon seed in `20260620120000_task_triage_agent.sql`. |
| **Live team production data** | **Not copied** (no access needed; you shouldn’t clone prod anyway). |
| **Your login user** | You create manually in Auth (Step 4). |

The repo **is** the source of truth for schema — same as the “provided project.”

---

## Prerequisites

- [ ] Supabase account (free tier OK)
- [ ] Node.js + npm (already have for this repo)
- [ ] Room for **1 active project** on free tier (restore or delete a paused project if at limit)

---

## Step 1 — Create a Supabase project (your account)

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **+ New project** (or restore a paused one)
3. Settings:
   - **Name:** `sj-bd-hackathon` (any name)
   - **Database password:** strong password → **save in password manager**
   - **Region:** e.g. `South Asia (Mumbai)` / `ap-south-1`
4. Wait until status is **Active** (~2 minutes)

---

## Step 2 — Copy 2 values from the dashboard

Open **Project Settings → API**:

| Copy this | Used for |
|-----------|----------|
| **Project URL** | `https://YOUR_REF.supabase.co` |
| **Project ref** | Short ID in URL: `YOUR_REF` |
| **anon public** key | Long JWT — safe for frontend |

Also note your **database password** from Step 1 (for CLI link only).

---

## Step 3 — Run the automated setup script

Open **PowerShell**:

```powershell
cd C:\Users\pc\sj-bd-dashboard
.\scripts\setup-personal-supabase.ps1
```

The script will ask for:
1. **Project ref**
2. **Anon public key**

Then it will:
- `npx supabase login` (browser)
- `npx supabase link --project-ref YOUR_REF` (asks DB password)
- `npx supabase db push` (applies all migrations — **5–15 min**)
- Creates **`.env.local`** pointing at **your** project (overrides `.env`)

### Manual alternative (if script fails)

```powershell
cd C:\Users\pc\sj-bd-dashboard
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Then copy `.env.personal.example` → `.env.local` and fill in your URL + anon key.

---

## Step 4 — Create a test user

1. Dashboard → **Authentication** → **Users** → **Add user**
2. Email: `test@example.com`
3. Password: `TestPassword123!`
4. **Auto Confirm User:** ON
5. **Create user**

---

## Step 5 — Grant admin role + verify demo tasks

Dashboard → **SQL Editor** → run:

`scripts/post-migration-hackathon-bootstrap.sql`

You should see 7 rows including **"Site down???"**.

---

## Step 6 — Run the app

```powershell
cd C:\Users\pc\sj-bd-dashboard
npm run dev
```

1. Open **http://localhost:8080**
2. Log in: `test@example.com` / `TestPassword123!`
3. Go to **BD → All Tasks**
4. Open **"Site down???"** (hackathon demo)

---

## How `.env` vs `.env.local` works

| File | Purpose |
|------|---------|
| `.env` | Team/Lovable project (already in repo clone) — **leave as backup** |
| `.env.local` | **Your personal project** — Vite loads this **on top** and wins |

After setup, the app uses **your** Supabase, not the team one.

---

## What to share with Cursor / your mentor

### Safe to share

- Project **ref** (e.g. `abcdefghijklmnop`)
- “`db push` succeeded” or “failed at migration X”
- **Error message text** (copy/paste)
- Screenshots of errors (blur keys if visible)
- “Login works” / “tasks page empty”

### Never share in chat / Slack / GitHub

- **service_role** key (Secret)
- Database **password**
- Your **login password**
- Full `.env` / `.env.local` files

The **anon public** key is designed for browsers — low risk, but still don’t commit it to public repos.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Free tier: can’t create project | Delete or restore a paused project (max 2 on free) |
| `supabase: command not found` | Use `npx supabase` (script does this) |
| `db push` fails on `relation "deals" does not exist` | Fixed in repo (migration order). Run `git pull` then `npx supabase db push` again. |
| `db push` fails on `relation "public.users" does not exist` | Fixed in repo (foundation migration). Run `npx supabase db push` again. |
| `db push` keeps failing after partial run | Dashboard -> Project Settings -> Database -> **Reset database**, then `npx supabase db push` again |
| Login “Invalid credentials” | Confirm user in Auth UI, Auto Confirm ON |
| App still hits old DB | Ensure `.env.local` exists; restart `npm run dev` |
| No demo tasks | Re-run `20260620120000_task_triage_agent.sql` in SQL Editor |
| Blank page after login | Run bootstrap SQL for `user_roles` + `profiles` |

---

## After Supabase works

1. Confirm hackathon demo tasks visible  
2. Tell Cursor: **“build Phase 2”** (AI triage Edge Function)  
3. Phase 3 UI → hackathon demo  

Related: [hackathon-client-task-triage-agent.md](./hackathon-client-task-triage-agent.md)

---

## Quick checklist

- [ ] Supabase project created (your account)
- [ ] `setup-personal-supabase.ps1` completed OR manual `db push`
- [ ] `.env.local` created with your URL + anon key
- [ ] Test user created in Auth
- [ ] Bootstrap SQL run
- [ ] `npm run dev` + login works
- [ ] “Site down???” task visible
