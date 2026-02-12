# CLAUDE.md - SJ BD Dashboard

**Last Updated**: February 12, 2026

---

## Project Identity

**SJ BD Dashboard** — Comprehensive Business Development & CRM platform for managing deals, campaigns, clients, AI automation, and team performance.

**Business Domain**: Agency / Internal BD Operations (SJ Innovation)

**Tech Stack**:
- Frontend: React 18.3 · TypeScript 5.8 · Vite 5.4 (SWC) · Tailwind CSS 3.4
- UI: Radix UI + shadcn/ui (48 components) · TipTap 3.13 · Recharts 2.15
- State: TanStack Query 5.83 · React Router DOM 6.30
- Forms: React Hook Form 7.61 · Zod 3.25
- Backend: Supabase (PostgreSQL) · Edge Functions (Deno) · Supabase Auth (JWT)
- Integrations: OpenAI · Perplexity · Anthropic · SendGrid · PandaDoc · Exa · ZeroBounce · GoHighLevel · HubSpot (Control Tower)

---

## How to Run

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint 9+
npm run test         # Bun test runner
npm run preview      # Preview production build
```

**Environment Variables** (required in `.env`):
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
PERPLEXITY_API_KEY=<perplexity-key>
```

**Deployment**: Via [Lovable](https://lovable.dev/projects/75f1f847-1a59-4bd3-9eb9-780955a7d4bf) (Share → Publish) or manual Vite build to any static host.

**Edge Function Deployment**: `supabase functions deploy [function-name]`

---

## Project Structure

```
sj-bd-dashboard/
├── src/
│   ├── App.tsx                  # All routing (50+ routes, role-based guards)
│   ├── main.tsx                 # Entry point
│   ├── pages/                   # 75 page components
│   │   ├── admin/               #   20 admin panel pages
│   │   ├── bd/                  #   25+ BD pages
│   │   │   └── pipeline/        #     6 pipeline stage views
│   │   ├── analytics/           #   2 analytics pages
│   │   └── feedback/            #   4 feedback pages
│   ├── components/              # 150+ React components
│   │   ├── ui/                  #   48 shadcn/ui primitives
│   │   ├── accountability/      #   11 goal tracking components
│   │   ├── bd/                  #   70+ BD components
│   │   │   ├── cells/           #     Table cell renderers
│   │   │   └── sequences/       #     17 email sequence components
│   │   ├── dhs/                 #   DHS submission components
│   │   ├── tasks/               #   16 task management components
│   │   ├── signing/             #   8 document signing components
│   │   ├── ai/                  #   AI agent components
│   │   ├── contact/             #   Contact profile components
│   │   ├── proposals/           #   Proposal components
│   │   ├── notifications/       #   4 notification components
│   │   ├── feedback/            #   15 feedback components
│   │   └── rich-text/           #   TipTap editor components
│   ├── hooks/                   # 111 custom hooks (ALL data fetching)
│   ├── features/                # 16 domain feature modules
│   │   ├── ai/agents/           #   7 agent runner/config files
│   │   ├── campaign-detail/     #   5 analytics components
│   │   ├── feedback/            #   3 feedback feature files
│   │   └── pipeline/            #   AI lead evaluation
│   ├── Api/                     # 4 API modules
│   │   ├── adminCampaigns.ts    #   Campaign CRUD
│   │   ├── aiAgents.ts          #   Agent management
│   │   ├── sequences.ts         #   Sequence operations
│   │   └── sqlExecutor.ts       #   Admin SQL execution
│   ├── lib/                     # Shared libraries
│   │   ├── utils.ts             #   cn(), formatRelativeTime()
│   │   ├── axiosPrivate.ts      #   Authenticated HTTP client
│   │   ├── dealStages.ts        #   Pipeline stage constants
│   │   ├── documentation.ts     #   Doc index
│   │   └── urlUtils.ts          #   URL validation
│   ├── types/                   # 7 TypeScript type files
│   ├── utils/                   # 5 utility modules
│   └── integrations/
│       ├── supabase/
│       │   ├── client.ts        #   Supabase client config
│       │   └── types.ts         #   Generated types (5163 lines)
│       └── controlTower/
│           ├── client.ts        #   Dynamic client factory
│           └── restApiClient.ts #   REST API client
├── supabase/
│   ├── functions/               # 71 Edge Functions
│   │   └── _shared/             #   12 shared utility modules
│   └── migrations/              # 224 migration files
├── tests/                       # Test files (bun)
├── docs/                        # Feature documentation
│   └── migrations/              #   Migration guides
├── .claude/
│   ├── agents/                  # 5 Claude Code subagents
│   └── skills/                  # 3 Claude Code skills
└── public/
    └── adminpanel/documentation/ # In-app docs
```

### Key Files

| Purpose | File |
|---------|------|
| Routing | `src/App.tsx` |
| Auth | `src/hooks/useAuth.tsx` |
| DB types | `src/integrations/supabase/types.ts` |
| Supabase client | `src/integrations/supabase/client.ts` |
| HTTP client | `src/lib/axiosPrivate.ts` |
| Stage constants | `src/lib/dealStages.ts` |
| UI primitives | `src/components/ui/` |
| All hooks | `src/hooks/` (111 files) |
| Edge Functions | `supabase/functions/` (71 functions) |

---

## Database (92+ tables)

### Tables by Domain

#### Users & Auth
- `profiles` — User profile data (name, email, avatar, login tracking)
- `users` — Extended user data with app_role enum
- `user_roles` — Role assignments (team_member, manager, admin, super_admin)
- `user_permissions` — Module-level permissions (can_view/create/edit/delete)
- `user_notifications` — In-app notifications with read tracking
- `user_activity_log` — Action audit trail

#### Campaigns
- `bd_campaigns` — Campaign records (name, status, owner, type, audience)
- `campaign_contacts` — Contacts enrolled in campaigns (with email validation status)
- `campaign_contact_status_history` — Contact status change tracking
- `campaign_contact_comments` — Comments on contacts
- `campaign_contact_linkedin_messages` — LinkedIn outreach messages
- `campaign_emails` — Email templates per campaign
- `campaign_sequences` — Email automation sequences
- `sequence_steps` — Steps within sequences (delay, action type)
- `sequence_execution_log` — Execution tracking (status, errors)
- `contact_sequence_enrollments` — Contact enrollment status (UNIQUE: contact+sequence)
- `campaign_financial_data` — ROI and cost tracking
- `campaign_tags` — Tag management
- `campaign_import_jobs` — Import job history

#### Deals
- `deals` — Deal/opportunity records (name, value, probability, stage, owner, PM)
- `deal_comments` — Discussion threads with mentions
- `deal_files` — Document attachments (storage bucket: deal-files)
- `deal_checklist_items` — Stage progression checklists
- `deal_system_info` — Slug generation and metadata

#### Clients & Contacts
- `clients` — Company records (name, website, industry, revenue)
- `contacts` — Contact persons (email, name, phone, title, client_id)
- `employees` — Employee records synced from Control Tower
- `leads` — Lead records (with Exa enrichment, lead scoring)

#### Tasks
- `project_tasks` — Task records (title, status, priority, assignee, campaign link)
- `task_comments` — Comments with rich text
- `task_comment_mentions` — @mention tracking
- `task_labels` — Reusable labels (name, color)
- `project_task_labels` — Task-label junction
- `task_attachments` — File uploads (storage bucket: task-files)
- `task_history` — Change audit log

#### DHS (Daily Head Start)
- `dhs_submissions` — Daily BD health metrics (follow_ups, calls, meetings, score 1-10, status: on_track/at_risk/blocked). UNIQUE(user_id, date).

#### Accountability Chart
- `accountability_quarters` — Quarterly periods (status: planning/active/completed/archived)
- `accountability_team_goals` — Manager-set team targets
- `accountability_rep_goals` — Individual goals with approval workflow (draft→pending→approved/rejected)
- `accountability_activities` — Trackable activities with frequency (daily/weekly/monthly)
- `accountability_weekly_updates` — Weekly progress submissions with blockers

#### AI & Automation
- `ai_agents` — Agent configurations (name, type, config JSONB, system_prompt)
- `ai_agent_runs` — Execution history with provider chain telemetry
- `ai_agent_templates` — Reusable agent templates
- `ai_shared_resources` — Vector stores and shared assets
- `ai_configurations` — Feature flags and integration configs
- `bd_weekly_reports` — BD Manager Agent analysis reports

#### Document Signing
- `signing_documents` — PandaDoc documents (type, status, merge_fields)
- `signing_document_recipients` — Signers/approvers with status
- `signing_document_activity_log` — Event tracking
- `signing_document_watchers` — Notification watchers

#### Feedback
- `feedback_reports` — User feedback (bug/feature, status, module, upvote_count)
- `feedback_comments` — Discussion threads
- `feedback_upvotes` — Upvote tracking

#### Integrations
- `control_tower_sync_log` — HubSpot sync history
- `control_tower_health_snapshots` — Sync health metrics
- `zerobounce_config` — Email validation configuration
- `zerobounce_validations` — Validation results
- `pandadoc_integrations` — PandaDoc configuration
- `gohighlevel_integrations` — GoHighLevel configuration
- `analytics_api_consumers` — External analytics API consumers

#### Other
- `products` — Product/service catalog
- `target_niches` — Market niche management
- `marketing_efforts` — Marketing effort tracking
- `pods` — Team pods (synced from Control Tower)
- `projects` — Project records
- `followups` — Follow-up tracking
- `email_templates` — Reusable email templates
- `sql_query_logs` — Admin SQL audit

### Key Relationships
```
campaigns → campaign_contacts → contacts
campaigns → campaign_sequences → sequence_steps
deals → clients → contacts
deals → deal_comments, deal_files, deal_checklist_items
deals → signing_documents → recipients, watchers, activity_log
project_tasks → task_comments → task_comment_mentions
accountability_quarters → team_goals → rep_goals → activities → weekly_updates
ai_agents → ai_agent_runs, ai_shared_resources
auth.users → profiles, user_roles, user_permissions, user_notifications
dhs_submissions (UNIQUE: user_id + date)
```

### RLS Policy

ALL tables have Row Level Security enabled. Common patterns:
- **Transparency**: `auth.uid() IS NOT NULL` (DHS, accountability, feedback)
- **Owner-based**: `auth.uid() = user_id`
- **Role-based**: `is_manager_or_admin()` helper function
- **Hierarchy**: super_admin > admin > manager > pm > user

---

## Edge Functions (71 total)

### AI & Agents
| Function | Purpose |
|----------|---------|
| `run-ai-agent` | Main agent orchestrator (OpenAI→Perplexity→Anthropic→OpenAI-mini fallback) |
| `bd-manager-weekly-review` | Weekly BD team performance analysis (50+ data points) |
| `scheduled-bd-manager-weekly-review` | Cron wrapper (Monday 9 AM) |
| `auto-enrich-leads` | Bulk lead enrichment via AI |
| `bd-research-batch` | Batch contact analysis |
| `create-company-vector-store` | Vector store management |
| `perplexity-manage` | Perplexity API config |

### Campaign & Email
| Function | Purpose |
|----------|---------|
| `admin-campaigns` | Campaign CRUD with KPI tracking |
| `campaign-lead-import` | Bulk contact import (CSV/manual) |
| `campaign-google-sheet-import` | Google Sheets import |
| `campaign-import-rollback` | Import rollback |
| `campaign-contact-research` | Contact research via Perplexity |
| `campaign-roi` | ROI calculation |
| `send-campaign-email` | Send emails via SendGrid |
| `sequence-enroll-contacts` | Sequence enrollment |
| `sequence-process-batches` | Batch email processing |
| `lead-email-automation` | Automated follow-ups |
| `send-lead-import-notification` | Import completion notifications |

### Integration & Sync
| Function | Purpose |
|----------|---------|
| `sync-control-tower-full` | Full bi-directional HubSpot sync |
| `sync-control-tower-deals` | Deal sync |
| `sync-control-tower-employees` | Employee sync |
| `sync-control-tower-pods` | Pod sync |
| `sync-control-tower-clients-api` | Client sync |
| `monitor-control-tower-health` | Health monitoring |
| `push-to-control-tower` | Push data to HubSpot |
| `hubspot-sync` | Direct HubSpot operations |
| `pandadoc-manage` | Document signing (PandaDoc) |
| `gohighlevel-manage` | GoHighLevel integration |
| `zerobounce-manage` | Email validation |
| `eod-data-sync` | EOD webhook receiver |
| `cleanup-sync-logs` | Log maintenance |

### Deals & Clients
| Function | Purpose |
|----------|---------|
| `apply-checklist-template` | Deal stage checklists |
| `deal-assignee-notification` | Assignment notifications |
| `resync-deal-checklist` | Checklist resync |
| `sync-deal-files` | File sync to storage |
| `lead-research-evaluate` | Lead evaluation (Exa/Perplexity) |
| `generate-followup-suggestions` | AI follow-up recommendations |

### Admin & Analytics
| Function | Purpose |
|----------|---------|
| `admin-products` | Product CRUD |
| `admin-users` | User management |
| `admin-sql-executor` | SQL execution (admin only) |
| `admin-leads-exa-enrich` | Single lead enrichment |
| `admin-leads-exa-import` | Bulk Exa import |
| `admin-campaigns-exa-research` | Campaign research |
| `analytics-dashboard` | Dashboard data |
| `calculate-performance-metrics` | Performance calculation (cron) |
| `team-performance` | Team aggregation |
| `user-activity-stats` | User activity |
| `push-analytics-to-consumers` | External analytics push |
| `external-analytics-api` | Analytics API endpoint |

### Notifications
| Function | Purpose |
|----------|---------|
| `send-dhs-reminder` | Daily DHS reminders (cron, 9 AM) |
| `manage-feedback` | Feedback management |
| `submit-feedback` | Submit feedback |
| `weekly-feedback-summary` | Weekly summary (cron) |
| `notify-low-usage` | Low usage alerts (cron) |

### Utility
| Function | Purpose |
|----------|---------|
| `auth` | Authentication operations |
| `exa` | Exa API gateway |
| `linkedin-upload-file-to-openai` | File uploads to OpenAI |
| `openai-test` | Connectivity test |
| `migrate-linkedin-data` | Data migration |

---

## Current State

### Complete ✅
- Authentication & Authorization (Supabase Auth, JWT, role-based RLS)
- User Management (admin panel, roles, permissions, activity tracking)
- Campaign Management (CRUD, contacts, email sequences, ROI, Google Sheets import)
- Deal Pipeline (5 stages: Prospecting→Qualification→Proposal→Negotiation→Clients)
- Client Management (CRUD, health stats, Control Tower sync)
- Contact & Lead Management (Exa import, enrichment, ZeroBounce validation)
- Task Management (CRUD, comments, @mentions, labels, attachments, history)
- DHS Daily Health Tracking (submit, edit today, team dashboard, daily reminders)
- Accountability Chart (quarters, goals, approval workflow, activities, weekly updates)
- AI Agent Framework (7-step config wizard, 5 agent types, provider fallback chain)
- Email Sequences (enrollment, batch processing, execution logs, Supabase Realtime)
- Document Signing (PandaDoc integration, recipients, watchers, activity log)
- Control Tower / HubSpot Sync (bi-directional, health monitoring, 6 sync functions)
- Analytics Dashboard (time series, team performance, usage analytics, external API)
- Feedback System (submit, vote, comment, triage, weekly summary)
- Notification System (in-app, email via SendGrid, task mentions, deal assignments)
- Proposal Management (CRUD, analytics, conversion funnel)
- Follow-up Tracking (AI suggestions, status management)
- User Activity Logging and Usage Analytics

### Known Tech Debt ⚠️
- `tsconfig.json` has `noImplicitAny: false` and `strictNullChecks: false` — should migrate to strict mode
- `bd_campaigns` (v1 table) coexists with `campaigns` (v2) — hooks still reference v1
- Limited test coverage (3 test files in `tests/`)
- Some components likely exceed 200 lines
- Generated types file is 5163 lines — could be split
- `campaign_channels`, `brand_kpis`, `brands` tables may be missing RLS policies

---

## Agent & Skill Registry

### Agents (`.claude/agents/`)

| Agent | Purpose | Tools |
|-------|---------|-------|
| **react-frontend-dev** | React/TypeScript specialist with complete knowledge of all 75 pages, 150+ components, 111 hooks, 50+ routes, UI patterns, and form/table/dialog patterns | Read, Write, Edit, Bash, Glob, Grep |
| **supabase-backend-dev** | Supabase specialist with complete knowledge of 92+ tables, 71 Edge Functions, all RLS policies, migration patterns, and hook→table mapping | Read, Write, Edit, Bash, Glob, Grep |
| **code-reviewer** | READ-ONLY code quality enforcer. Checks TypeScript strictness, React patterns, RLS policies, error handling, security, performance. Does not modify code. | Read, Grep, Glob |
| **debugger** | Bug investigation specialist with project-specific error patterns, key files to check per domain, Supabase error code reference, and systematic 7-step methodology | Read, Edit, Bash, Glob, Grep |
| **documentation-engineer** | Specs-first documentation specialist. Creates feature specs, implementation guides (for Lovable handoff), maintains CLAUDE.md, tracks module status | Read, Write, Edit, Glob, Grep |

### Skills (`.claude/skills/`)

| Skill | Purpose |
|-------|---------|
| **sj-code-standards** | SJ Innovation coding standards. Apply to ALL code changes. Covers TypeScript, React, naming, error handling, database, security, git conventions. |
| **sj-bug-fix-workflow** | 8-step bug fix process: Reproduce → Isolate → Read Error → Root Cause → Failing Test → Fix → Verify → Document. No shortcuts. |
| **sj-bd-dashboard-architecture** | Full architecture reference with data flow diagrams, module status, integration map, scheduled jobs, and deployment info. Load for architectural decisions. |

---

## Key Conventions

### Imports
```typescript
import { Button } from "@/components/ui/button";    // Always use @/ alias
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
```

### Data Fetching (ALWAYS through hooks)
```typescript
// ✅ Correct: Custom hook with TanStack Query
const { data, isLoading, error } = useBDCampaigns();

// ❌ Wrong: Direct Supabase in component
const { data } = await supabase.from('bd_campaigns').select('*');
```

### Mutations
```typescript
const { mutate } = useMutation({
  mutationFn: async (data) => {
    const { error } = await supabase.from('table').insert(data);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['table'] });
    toast({ title: "Success" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  },
});
```

### Naming
- Components: PascalCase (`CampaignDialog.tsx`)
- Hooks: camelCase with `use` prefix (`useBDCampaigns.tsx`)
- DB tables: snake_case (`campaign_contacts`)
- Constants: SCREAMING_SNAKE_CASE (`DEAL_STAGES`)

### Git
- Commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`
- Branches: `claude/[description]-[sessionId]`
- Push: `git push -u origin <branch-name>` with retry on network failure

---

## Rules

1. **Always follow sj-code-standards** for ALL code changes — TypeScript strict, no `any`, explicit return types, Zod validation, error handling.
2. **Always follow sj-bug-fix-workflow** for ALL bug fixes — 8 steps, no shortcuts.
3. **Run code-reviewer before suggesting any PR** — Check TypeScript, RLS, error handling, security.
4. **Create specs before implementing new features** — Use documentation-engineer agent. Specs go in `docs/`.
5. **Update CLAUDE.md when architecture changes** — New tables, hooks, pages, or Edge Functions must be documented here.
6. **Never skip documentation** — Every feature needs a spec. Every implementation needs a guide.
7. **Never use Supabase client directly in components** — Always go through custom hooks in `src/hooks/`.
8. **All tables must have RLS policies** — No exceptions.
9. **Handle loading, error, and empty states** — Every data display needs all three.
10. **Components under 200 lines** — Decompose if larger.
11. **Forms use React Hook Form + Zod** — No unvalidated form submissions.
12. **Dev server runs on port 8080** — `npm run dev`

---

## Quick Reference

### Most Used Hooks
| Hook | Purpose |
|------|---------|
| `useAuth()` | Authentication context, user, roles |
| `useBDCampaigns()` | Campaign CRUD |
| `useDeals()` | Deal operations |
| `useDealBySlug(slug)` | Single deal lookup |
| `useClients()` | Client CRUD |
| `useContacts()` | Contact CRUD |
| `useSequences(campaignId)` | Email sequences |
| `useDHSSubmissions()` | DHS management |
| `useAccountabilityGoals()` | Goal tracking |
| `useAgentList()` | AI agents |
| `useRunAIAgent()` | Agent execution |
| `useControlTowerHealth()` | HubSpot sync health |
| `useProjectTasks()` | Task management |
| `useNotifications()` | In-app notifications |
| `useFollowUps()` | Follow-up tracking |
| `useSigningDocuments()` | Document signing |

### Most Used UI Components
Button, Card, Dialog, Table, Form, Input, Select, Badge, Tabs, Sheet, Skeleton, Alert, Toast, Popover, DropdownMenu, Avatar, Checkbox, Calendar

### Key Utilities
- `cn()` — Tailwind class merging (`@/lib/utils`)
- `axiosPrivate` — Authenticated HTTP client (`@/lib/axiosPrivate`)
- `supabase` — Database client (`@/integrations/supabase/client`)
- `toast()` — User notifications (`@/components/ui/use-toast`)
- `DEAL_STAGES` — Pipeline stage constants (`@/lib/dealStages`)
