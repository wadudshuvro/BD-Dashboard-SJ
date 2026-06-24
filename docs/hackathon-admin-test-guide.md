# Hackathon Admin Test Guide

**Project:** Autonomous Client Task Triage Agent  
**For:** SJ Innovation hackathon reviewers

---

## Quick access

| Item | Value |
|------|--------|
| **App URL** | `https://YOUR-VERCEL-URL.vercel.app` *(replace after deploy)* |
| **Login email** | `test@example.com` |
| **Login password** | `TestPassword123!` |

---

## What to test (3 minutes)

### 1. Log in
Open the app URL → sign in with the credentials above.

### 2. Open a demo task
Go to **BD → All Tasks** (sidebar under Daily Work).

Open the task **"Site down???"** — a vague, unassigned client escalation (best demo case).

Direct link (after deploy):
```
https://YOUR-VERCEL-URL.vercel.app/bd/actions/tasks/a0000011-0000-4000-8000-000000000011
```

### 3. Run AI triage
On the task page, find the **AI Task Triage** card at the top.

Click **Run AI Triage** → wait ~5–10 seconds.

The agent should suggest:
- **Priority** (e.g. urgent — outage language)
- **Owner** from team list
- **Category** (work)
- **Client-safe status update** (professional, no internal panic)
- **2–3 follow-up subtasks**

### 4. Approve
Review suggestions → optionally edit fields → click **Approve & Apply**.

Expected result:
- Parent task priority/owner/category update
- New subtasks appear under the same project

### 5. Optional second task
Try **"Invoice question - wrong amount"** for a different priority/category.

---

## What this demonstrates

| Criterion | How |
|-----------|-----|
| **AI Agent** | Structured analysis, not chat |
| **Human in the loop** | Nothing changes until Approve |
| **Workflow automation** | One click creates subtasks + updates task |
| **Platform integration** | Built inside SJ BD Dashboard (tasks, clients, Supabase) |

---

## Troubleshooting

| Issue | Likely cause |
|-------|----------------|
| Can't log in | User not created in Supabase Auth, or wrong password |
| No "Site down???" task | Hackathon seed not applied — contact developer |
| "Run AI Triage" fails | Edge Function not deployed or `LOVABLE_API_KEY` missing |
| Empty task list | App env vars point at wrong Supabase project |

---

## Developer checklist (before sharing this link)

- [ ] `npx supabase db push` completed on personal project `oxvfbrxoooindyrqvjgk`
- [ ] `scripts/post-migration-hackathon-bootstrap.sql` run in SQL Editor
- [ ] `test@example.com` user created (auto-confirmed)
- [ ] `npx supabase functions deploy triage-project-task`
- [ ] `LOVABLE_API_KEY` set in Supabase Edge Function secrets
- [ ] Vercel env: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- [ ] Tested full flow on Vercel URL (not only localhost)

---

## Pitch one-liner

> **Autonomous Client Task Triage Agent** — reads incoming client tasks in SJ BD Dashboard, recommends priority/owner/category, drafts client-safe updates, and proposes follow-up subtasks with human approval before any changes are applied.
