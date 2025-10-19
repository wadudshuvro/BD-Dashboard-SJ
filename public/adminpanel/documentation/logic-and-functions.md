# Logic & Functions

## Supabase Edge Functions (Deno)
Each function is deployed under `supabase/functions/<name>/index.ts` and is exposed through Supabase Edge Function URLs. All functions enforce CORS headers via `_shared/cors.ts` and authenticate using the service role key unless otherwise noted.

### Function: admin-users
- **File:** `supabase/functions/admin-users/index.ts`
- **Purpose:** Full CRUD + assignment sync for platform users, brand memberships, and granular permissions.
- **HTTP Methods:**
  - `GET /?id=<uuid>` – Fetch single user with `user_brands` + `user_permissions` joins.
  - `GET /list` – Paginated user directory with filters for role/status.
  - `POST` – Creates auth user via Admin API, inserts profile row, and assigns brands/permissions.
  - `PUT /<id>` – Updates metadata, resyncs brand assignments, and permissions.
  - `DELETE /<id>` – Soft deletes user and revokes brand links.
- **Linked Tables:** `users`, `user_brands`, `user_permissions`, `user_roles`, `brands`.
- **Notable Logic:** Automatically normalizes brand assignments, removes stale links, and wraps Supabase Admin API calls with retry + error shaping.

### Function: admin-brands
- **File:** `supabase/functions/admin-brands/index.ts`
- **Purpose:** Manage brand catalog, brand KPIs, analytics integrations, and ownership metadata.
- **HTTP Methods:**
  - `GET` – Lists brands with aggregated KPI count + integration state.
  - `POST` – Creates new brand record and optional default KPIs.
  - `PUT /<id>` – Updates brand profile, active integrations, and owner assignments.
  - `DELETE /<id>` – Deactivates brand and cleans dependent relations.
- **Linked Tables:** `brands`, `brand_kpis`, `brand_analytics_integrations`, `user_brands`.

### Function: admin-panel auth helpers
- **File:** `supabase/functions/auth/index.ts`
- **Purpose:** Login/refresh helpers invoked by the frontend for service-level actions (e.g., exchanging invite tokens, verifying roles).
- **Behavior:** Validates Supabase auth sessions, issues ephemeral tokens with elevated claims for short-lived admin workflows, and surfaces profile data with `user_roles` join.

### Function: collabai-manage
- **File:** `supabase/functions/collabai-manage/index.ts`
- **Purpose:** Secure proxy to the CollabAI API for syncing agents, conversations, and metadata into Supabase.
- **Responsibilities:**
  - Imports CollabAI agents → `collabai_agents` table.
  - Persists chat logs into `collabai_chats` with streaming support.
  - Encrypts API keys using Supabase secrets and stores them in `collabai_integrations`.

### Function: gohighlevel-manage
- **File:** `supabase/functions/gohighlevel-manage/index.ts`
- **Purpose:** REST facade around GoHighLevel CRM for pulling contacts, updating pipeline status, and mirroring integration health.
- **Endpoints:**
  - `POST /sync-contacts` – Fetches contacts by location, upserts into `gohighlevel_contacts`.
  - `POST /webhook` – Handles status change webhooks.
  - `DELETE /integration/<id>` – Revokes integration and cascades contact cleanup.
- **Linked Tables:** `gohighlevel_integrations`, `gohighlevel_contacts`, `clients`, `deals`.

### Function: hubspot-sync
- **File:** `supabase/functions/hubspot-sync/index.ts`
- **Purpose:** Ingest HubSpot deals/companies and normalize them for BD dashboards.
- **Behavior:** Schedules batched fetches using pagination cursors, maps HubSpot pipeline stages to internal `deals.status`, and updates `clients` & `contacts` when company metadata changes.

### Function: n8n-analytics-manage
- **File:** `supabase/functions/n8n-analytics-manage/index.ts`
- **Purpose:** Entry point for the Google Analytics → n8n workflow. Handles handshake, secret verification, ingestion, and reporting APIs.
- **Key Operations:**
  - `POST /webhook` – Validates secret, persists payload into `brand_analytics_data`, and updates `brand_analytics_integrations.last_sync_at`.
  - `GET /integrations` – Lists configured integrations with last sync timestamp.
  - `POST /integrations` – Creates or updates integration metadata.
  - `DELETE /integrations/<id>` – Disables analytics feed.

### Function: generate-eod-summary
- **File:** `supabase/functions/generate-eod-summary/index.ts`
- **Purpose:** For a given date, gather `team_eod_submissions`, join ActiveCollab data, and craft AI-powered daily summaries.
- **Inputs:** JSON body `{ "date"?: string }`; defaults to current date in ISO format.
- **Outputs:** JSON payload containing per-user summary objects `{ user, submission, aiSummary, tasks }`.
- **Linked Tables:** `team_eod_submissions`, `activecollab_task_data`, `team_daily_summaries`, `ai_agent_runs`.

### Function: eod-data-sync
- **File:** `supabase/functions/eod-data-sync/index.ts`
- **Purpose:** Sync End-of-Day submissions from ActiveCollab to Supabase.
- **Behavior:** Pulls tasks via ActiveCollab API, upserts into `team_eod_submissions` and `activecollab_task_data`, triggers `generate-eod-summary` when new submissions arrive.

### Function: generate-code
- **File:** `supabase/functions/generate-code/index.ts`
- **Purpose:** Prompt OpenAI with curated templates to generate React/TypeScript code.
- **Process:**
  1. Fetches appropriate `code_generation_templates` based on request parameters (framework, category).
  2. Builds context from `code_repositories`, existing files, and AI config.
  3. Calls OpenAI responses, logs output to `code_analyses` and `code_analysis_results` when validation fails.
- **Outputs:** Markdown-formatted code suggestion with snippet metadata.

### Function: analyze-codebase
- **File:** `supabase/functions/analyze-codebase/index.ts`
- **Purpose:** Crawl repository metadata, summarize architecture, and store findings in `code_analysis_results`.
- **Linked Tables:** `code_repositories`, `code_analysis_results`, `ai_agent_runs`.

### Function: run-ai-agent (Enhanced)
- **File:** `supabase/functions/run-ai-agent/index.ts`
- **Purpose:** Unified dispatcher that executes any registered AI agent configuration with provider chain orchestration.
- **Behavior:**
  - Validates agent activation and permissions.
  - Compiles `input_context` from Supabase tables (e.g., tasks, CRM metrics).
  - **Provider Chain:** Orchestrates primary → fallback → OpenAI mini → research provider sequence based on `ai_agents.config.providers`.
  - **Telemetry Capture:** Stores provider execution chain in `ai_agent_runs.output.provider_chain` array with timestamps, tokens, and error details.
  - Streams responses, persists them into `ai_agent_runs`, and optionally writes follow-up tasks (`project_tasks`).
  - **LinkedIn Integration:** Supports file upload to OpenAI vector stores via `linkedin-upload-file-to-openai` function for knowledge base augmentation.

### Function: gemini-veo-manager
- **File:** `supabase/functions/gemini-veo-manager/index.ts`
- **Purpose:** Integrate with Google Gemini Veo for video creation.
- **Endpoints:**
  - `POST /render` – Sends prompt + asset preferences, stores job metadata in `gemini_videos`.
  - `POST /webhook` – Receives completion events, updates `videos` + `gemini_videos` status fields.
  - `GET /videos` – Lists generated assets with filters.

### Function: import-hours
- **File:** `supabase/functions/import-hours/index.ts`
- **Purpose:** Pull billable hours from external sources (e.g., Toggl) and map to `projects` / `tasks` for EOD reconciliation.
- **Behavior:** Validates CSV payloads, normalizes durations, and inserts aggregated metrics into `analytics_data`.

### Function: seed-sample-eod-data
- **File:** `supabase/functions/seed-sample-eod-data/index.ts`
- **Purpose:** Developer utility for populating `team_eod_submissions`, `activecollab_task_data`, and `team_daily_summaries` with mock records to test dashboards.

### Function: openai-test
- **File:** `supabase/functions/openai-test/index.ts`
- **Purpose:** Health-check endpoint to validate OpenAI credentials and response formatting. Returns example completions for debugging.

### Function: admin settings helpers
- **File:** `supabase/functions/admin-settings/index.ts`
- **Purpose:** Persist platform-wide configuration toggles (feature flags, announcement banners) into `ai_configurations` and `integrations` tables.

## Client-side Service Layer

### `src/lib/axiosPrivate.ts`
- **Purpose:** Axios instance that injects `VITE_API_BASE_URL`, Authorization headers, and error interceptors for calling Supabase edge functions.
- **Key Functions:**
  - `axiosPrivate.get/post/put/delete` wrappers returned from `useAxiosPrivate()` hook.
  - Automatically refreshes tokens using Supabase session when 401 responses occur.

### `src/integrations/supabase/client.ts`
- **Purpose:** Factory for Supabase browser client using environment variables. Adds auth helpers and typed responses from `src/integrations/supabase/types.ts`.

### React Query Hooks (selected)
- **`src/features/brands/hooks/useBrands.ts`** – Fetches brand list with KPI aggregates, caches by `brandId` and invalidates on mutations.
- **`src/features/kpis/hooks/useKpis.ts`** – Wraps `axiosPrivate` calls to manage KPI CRUD flows.
- **`src/features/eod/hooks/useEodSubmissions.ts`** – Provides create/update/fetch helpers that call `generate-eod-summary` after submissions.

### BD Management Hooks
- **`src/hooks/usePods.tsx`** – CRUD operations for team PODs with React Query caching. Fetches from `pods` table, provides `createPod`, `updatePod`, `deletePod` mutations with optimistic updates.
- **`src/hooks/useTargetNiches.tsx`** – Target niche management with filtering by POD. Queries `target_niches` with joins to `pods`, supports create/update/delete with cache invalidation.
- **`src/hooks/useBDCampaigns.tsx`** – Campaign tracking with metrics aggregation. Fetches from `bd_campaigns` with `target_niches` joins, provides mutations for campaign lifecycle and metric updates.

### Admin Panel Utilities
- **`src/components/ai/AIAgentRunner.tsx`** – Executes `run-ai-agent` edge function, streams updates to UI, and writes generated tasks locally before Supabase persistence.
- **`src/components/video-veo/GeminiVideoCard.tsx`** – Polls `gemini-veo-manager` for render progress and surfaces download links.
- **`src/pages/admin/UserManagement.tsx`** – Orchestrates `admin-users` CRUD flows, user invite emails, and permission modals.
- **`src/pages/admin/IntegrationManager.tsx`** – Bridges the UI with `n8n-analytics-manage`, `gohighlevel-manage`, and `hubspot-sync` endpoints to toggle integrations.
- **`src/pages/admin/LinkedInAgentConfig.tsx`** – Configuration interface for LinkedIn AI agent with provider routing settings, file upload to vector stores, on-demand execution, and run history telemetry display.

## Automation Flow Summary
1. **Data Ingestion:** External sources (HubSpot, GoHighLevel, n8n, ActiveCollab) push into respective edge functions which upsert normalized tables.
2. **AI Processing:** `run-ai-agent`, `generate-code`, and `analyze-codebase` orchestrate GPT/Gemini requests and persist outputs to `ai_agent_runs`, `code_analysis_results`, `team_daily_summaries`, and `videos`.
3. **Frontend Consumption:** React Query hooks and Supabase real-time listeners render dashboards, with admin tooling calling the same edge functions through `axiosPrivate`.
4. **Auditing:** All functions log structured events (see `console.log` entries) and update timestamp triggers, ensuring the admin panel documentation can trace data lineage end-to-end.
