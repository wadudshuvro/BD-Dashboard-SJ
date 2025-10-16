# SJ Business Development AI Platform

## Project Summary
- **Purpose:** Internal operations hub that unifies business development workflows, brand management, analytics, AI tooling, and daily reporting for SJ Innovation teams.
- **Key Capabilities:** Role-aware admin dashboards, CRM-style client + project tracking, KPI monitoring, AI agent orchestration, Gemini Veo video generation, and Supabase-backed data automation.

## Tech Stack
| Layer | Technologies |
| --- | --- |
| Frontend | Vite, React 18, TypeScript, React Router, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend APIs | Supabase Edge Functions (Deno), Supabase PostgREST, Custom REST helpers via Axios |
| Data & Auth | Supabase Postgres, Supabase Auth (RLS policies), Supabase Storage |
| Tooling | ESLint, TypeScript, Bun (tests), Fuse.js for search, Lucide React icon set |

## Folder Structure Highlights
| Path | Description |
| --- | --- |
| `src/main.tsx`, `src/App.tsx` | Bootstraps React, providers, and global routing shell. |
| `src/components/` | Shared UI primitives (cards, dialogs, tables) plus feature widgets such as AI runners, accountability chart editors, and documentation utilities. |
| `src/features/` | Domain-specific modules (admin, BD tooling, video studio, AI agents) co-locating components, hooks, and mock data. |
| `src/pages/` | Route-level screens including `/adminpanel`, manager dashboards, BD pods/niches, and AI feature pages. |
| `src/integrations/supabase/` | Auto-generated Supabase types, client factory, and data helpers for calling PostgREST. |
| `src/Api/` | REST helper wrappers for Supabase edge functions and external automation services. |
| `supabase/functions/` | Deno edge functions covering admin CRUD, analytics sync, AI operations, and integrations. |
| `supabase/migrations/` | SQL schema migrations, policies, and seed data for all tables referenced in the app. |
| `public/adminpanel/documentation/` | Markdown sources rendered inside the Admin Panel documentation experience. |

## Environment Variables
| Variable | Location | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vite client | Supabase project URL for auth and database calls (`src/integrations/supabase/client.ts`). |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite client | Public anon key passed to Supabase client factory. |
| `VITE_API_BASE_URL` | Vite client | Base URL for Axios wrapper hitting edge functions (`src/lib/axiosPrivate.ts`). |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase CLI | Required when running or deploying Supabase edge functions locally. |
| `OPENAI_API_KEY` (Supabase edge) | Edge functions | Used by AI-related functions such as `generate-code`, `run-ai-agent`, and `generate-eod-summary` for OpenAI calls. |

## Major Application Areas
- **Admin Layout (`src/components/AdminLayout.tsx`):** Role-gated navigation shell for `/adminpanel`, wiring tabs for brands, clients, documentation, KPIs, AI tooling, and settings.
- **Authentication (`src/features/auth`, `src/integrations/supabase/client.ts`):** Supabase-powered auth context with role-based routing guards in `src/App.tsx`.
- **Business Development Dashboards (`src/pages/ManagerDashboard.tsx`, `src/pages/PMDashboard.tsx`, `src/pages/MyDashboard.tsx`):** Aggregated KPIs, pipeline metrics, and team performance cards.
- **Project & Task Management (`src/pages/ProjectDetail.tsx`, `src/features/projects`):** Project drill downs, task lists, and timeline metrics tied to Supabase tables.
- **AI & Automation (`src/pages/ai-agents`, `src/components/ai/AIAgentRunner.tsx`, Supabase `run-ai-agent`):** Configures agents, executes automations, and surfaces generated tasks/summaries.
- **Video Studio (`src/pages/video/GeminiVideoStudioPage.tsx`, `supabase/functions/gemini-veo-manager`):** Frontend orchestration for Gemini Veo prompts, asset storage, and processing status.
- **Daily Reporting (`src/pages/EODSubmission.tsx`, `supabase/functions/generate-eod-summary`):** Collects end-of-day updates, aggregates summaries, and syncs with ActiveCollab.

## Build & Run
1. Install dependencies: `npm install`
2. Launch development server: `npm run dev`
3. Lint before commits: `npm run lint`
4. Build production bundle: `npm run build`
5. Optional type check: `npx tsc --noEmit`
6. Serve edge functions locally as needed: `supabase functions serve <name> --env-file .env.local`
