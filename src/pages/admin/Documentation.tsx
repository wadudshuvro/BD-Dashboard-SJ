import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { documentationIndex, getDocByFile } from "@/lib/documentation";
import { DocumentationSearch } from "@/components/documentation/DocumentationSearch";
import { DocSidebar } from "@/components/documentation/DocSidebar";
import { MarkdownRenderer } from "@/components/documentation/MarkdownRenderer";
import { TableOfContents } from "@/components/documentation/TableOfContents";
import { FileText, Calendar, Tag, Download } from "lucide-react";

// Documentation content will be loaded dynamically
const documentationContent: Record<string, string> = {
  "getting-started/overview": `# Project Overview

> **Last Updated**: 2025-01-09
> **Tags**: overview, introduction, architecture

## Introduction

The **SJ Marketing AI Platform** is a comprehensive project management and analytics system designed for marketing teams. It integrates multiple data sources, AI-powered insights, and team collaboration tools.

## Core Features

### 1. User & Brand Management
- Multi-role user system (Super Admin, Manager, PM, Team Member)
- Brand ownership and team assignment
- Granular permission system
- User accountability charts

### 2. Project & Task Management
- Client and project tracking
- Task assignment and time logging
- Integration with ActiveCollab
- Progress monitoring and reporting

### 3. EOD (End-of-Day) Reporting
- Daily task submissions
- Automated data sync from ActiveCollab
- AI-powered summaries
- Manager dashboards for team oversight

### 4. Analytics & KPIs
- Brand analytics integrations (Google Analytics, N8n)
- Custom KPI configuration
- Real-time metrics dashboard
- Historical data tracking

### 5. AI Features
- AI Agent system for automated workflows
- Code analysis and generation
- CollabAI integration
- Video generation (Gemini Veo, Sora)

### 6. Third-Party Integrations
- **HubSpot**: CRM sync for clients, contacts, and deals
- **N8n**: Workflow automation for analytics and EOD data
- **ActiveCollab**: Task and time tracking
- **GoHighLevel**: Marketing automation
- **CollabAI**: AI agent collaboration

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **TanStack Query** for state management

### Backend
- **Supabase** (PostgreSQL database)
- **Edge Functions** (Deno runtime)
- **Row Level Security** for data access control
- **Real-time subscriptions**

### Integrations
- OpenAI for AI features
- Google Gemini for video generation
- Multiple third-party APIs

## Architecture Highlights

\`\`\`mermaid
graph TD
    A[React Frontend] --> B[Supabase Client]
    B --> C[PostgreSQL Database]
    B --> D[Edge Functions]
    D --> E[External APIs]
    D --> F[AI Services]
    C --> G[RLS Policies]
\`\`\`

## Key Concepts

### Role-Based Access Control
Users are assigned roles that determine their permissions:
- **Super Admin**: Full system access
- **Manager**: Team oversight, brand management
- **PM (Project Manager)**: Project and task management
- **Team Member**: Task execution, EOD submissions

### Brand-Centric Model
The platform is organized around brands, with each brand having:
- Owner and co-owner
- Team members
- Projects and KPIs
- Analytics integrations

### Data Flow
1. Users submit EODs or tasks update in ActiveCollab
2. N8n workflows sync data to Supabase
3. Edge functions process and transform data
4. Frontend displays real-time updates via React Query

## Getting Started

To begin development, see:
- [Development Setup](./setup) for local environment configuration
- [Tech Stack Details](./tech-stack) for in-depth technology information
- [Database Schema](../architecture/database-schema) for data structure
`,

  "getting-started/tech-stack": `# Tech Stack Deep Dive

> **Last Updated**: 2025-01-09
> **Tags**: stack, architecture, dependencies, tooling

## Overview

The SJ Marketing AI Platform combines a modern React frontend with Supabase-backed services. This page inventories every layer of the stack, the rationale for each tool, and how the pieces interoperate during development and deployment.

## Technology Map

| Layer | Tools & Versions | Purpose |
| --- | --- | --- |
| Frontend Framework | React 18.3.1, React DOM 18.3.1 | Component rendering, concurrent features |
| Language & Types | TypeScript 5.8.3 | Static typing, build-time safety |
| Bundler / Dev Server | Vite 5.4.19 | Fast HMR, optimized builds |
| Styling | Tailwind CSS 3.4.17, tailwind-merge 2.6.0, tailwindcss-animate 1.0.7 | Utility-first styling, class consolidation, animation presets |
| Component Libraries | shadcn/ui components (Radix UI primitives 1.x), lucide-react 0.462.0 | Accessible UI primitives, iconography |
| Routing | React Router DOM 6.30.1 | Client-side navigation |
| Data Fetching & State | @tanstack/react-query 5.83.0 | Query caching, mutation orchestration |
| Forms & Validation | react-hook-form 7.61.1, @hookform/resolvers 3.10.0, zod 3.25.76 | Declarative form handling, schema validation |
| Markdown Rendering | react-markdown 9.1.0, remark-gfm 4.0.1, rehype-raw 7.0.0 | Rich text documentation |
| Charts & Visuals | recharts 2.15.4, embla-carousel-react 8.6.0 | KPI charts, carousels |
| Backend SDK | @supabase/supabase-js 2.57.4 | Database, auth, storage interactions |
| Edge Runtime | Supabase Edge Functions (Deno) | Server-side logic, API proxying |
| Quality Tooling | ESLint 9.32.0, @eslint/js 9.32.0, typescript-eslint 8.38.0 | Linting and type-aware rules |
| Build Tooling | TypeScript compiler, Vite build, @vitejs/plugin-react-swc 3.11.0 | Production builds, SWC-powered transforms |
| Post-processing | PostCSS 8.5.6, autoprefixer 10.4.21 | CSS compatibility |

> 📌 **Reference**: Full dependency manifest lives in \`package.json\`.

## Frontend Composition

The frontend layers React 18 with TypeScript for fully typed components. TanStack Query drives state management by caching Supabase data and coordinating background revalidation. Tailwind CSS and shadcn/ui provide a composable design system, while Radix primitives guarantee accessibility.

### Component Dependency Graph

\`\`\`mermaid
graph TD
    A[Vite Dev Server] --> B[React 18 App]
    B --> C[TanStack Query Client]
    C --> D[Supabase SDK]
    B --> E[React Router DOM]
    B --> F[shadcn/ui + Radix]
    F --> G[Tailwind Tokens]
    B --> H[react-hook-form + zod]
\`\`\`

### Vite & TypeScript Configuration

Vite is tuned through \`vite.config.ts\` to apply the React SWC plugin for lightning-fast transforms:

\`\`\`ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
\`\`\`

TypeScript paths mirror Vite aliases via \`tsconfig.*\` files, ensuring editors and builds share the same module resolution.

## Backend & Data Layer

- **Supabase PostgreSQL** powers persistent storage with row level security and real-time subscriptions.
- **Edge Functions** written in Deno encapsulate privileged operations, invoked from \`supabase/functions/*\`.
- **Row Level Security (RLS)** policies enforce tenant isolation and role-based access.

### Supabase Interaction Flow

\`\`\`mermaid
sequenceDiagram
    participant UI as React Component
    participant RQ as TanStack Query
    participant SB as Supabase JS Client
    participant DB as Postgres (RLS)
    UI->>RQ: useQuery(fetchBrands)
    RQ->>SB: supabase.from('brands').select()
    SB->>DB: Execute with row level policies
    DB-->>SB: Filtered rows
    SB-->>RQ: Response payload
    RQ-->>UI: Cached data + revalidation hooks
\`\`\`

## State Management Patterns

TanStack Query is the canonical state layer. Hooks such as \`useAdminUsers\` and \`useBrandKPIs\` leverage query caching, background refetching, and mutation lifecycle callbacks. For local component state, React hooks (\`useState\`, \`useReducer\`) remain lightweight alternatives.

## Form Handling

\`react-hook-form\` pairs with \`zod\` via \`@hookform/resolvers\` for schema-first validation. Example pattern:

\`\`\`tsx
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({ email: z.string().email() });

const form = useForm({ resolver: zodResolver(schema) });
\`\`\`

## Quality & Developer Experience

- **ESLint** enforces repository conventions (\`eslint.config.js\`).
- **TypeScript compiler** (\`tsc --noEmit\`) ensures type safety.
- **Preconfigured scripts**: \`npm run dev\`, \`npm run build\`, \`npm run lint\`, \`npm run preview\`.

## Cross-References

- [Project Overview](./overview)
- [Development Setup](./setup)
- [Supabase Architecture](../architecture/database-schema)
- [RLS Policies](../database/rls-policies)
`,

  "getting-started/setup": `# Development Setup

> **Last Updated**: 2025-01-09
> **Tags**: setup, installation, local, development

## Prerequisites

Before setting up the project locally, ensure you have:

- **Node.js**: v18 or higher
- **npm** or **bun**: Latest version
- **Git**: For version control
- **Supabase Account**: For backend services
- **Code Editor**: VS Code recommended

## Installation Steps

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd sj-marketing-ai
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
bun install
\`\`\`

### 3. Environment Configuration

Create a \`.env\` file in the project root:

\`\`\`env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

> ⚠️ **Warning**: Never commit the \`.env\` file to version control!

### 4. Supabase Setup

#### Local Supabase (Recommended for Development)

\`\`\`bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase
supabase init

# Start local Supabase
supabase start
\`\`\`

#### Remote Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Add to \`.env\` file

### 5. Database Migrations

Run all migrations to set up the database schema:

\`\`\`bash
supabase db push
\`\`\`

### 6. Start Development Server

\`\`\`bash
npm run dev
# or
bun dev
\`\`\`

The application will be available at \`http://localhost:8080\`.

## Project Structure

\`\`\`
sj-marketing-ai/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions
│   ├── integrations/    # Supabase client
│   └── main.tsx         # Application entry
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Database migrations
├── docs/                # Documentation
└── public/              # Static assets
\`\`\`

## Development Workflow

### Running Edge Functions Locally

\`\`\`bash
supabase functions serve
\`\`\`

### Database Migrations

Create a new migration:

\`\`\`bash
supabase migration new migration_name
\`\`\`

Apply migrations:

\`\`\`bash
supabase db push
\`\`\`

### Testing

\`\`\`bash
npm run test
\`\`\`

## Common Issues

### Port Already in Use

If port 8080 is already in use:

\`\`\`bash
# Change port in vite.config.ts
server: {
  port: 3000
}
\`\`\`

### Supabase Connection Issues

Ensure Supabase is running:

\`\`\`bash
supabase status
\`\`\`

### Build Errors

Clear cache and reinstall:

\`\`\`bash
rm -rf node_modules
npm install
\`\`\`

## Next Steps

- Review [Tech Stack](./tech-stack) to understand the technologies
- Explore [Database Schema](../architecture/database-schema)
- Read [Authentication Guide](../architecture/auth-flow)
`,

  "features/eod-system": `# EOD Submission System

> **Last Updated**: 2025-01-09
> **Tags**: eod, submissions, workflow, activecollab

## Overview

The End-of-Day (EOD) Submission System allows team members to report their daily work, which is then synced with ActiveCollab and summarized using AI.

## User Flow

### 1. Team Member Submission

Users submit their EOD through the **Submit EOD** page:

\`\`\`typescript
// Navigate to: /dashboard/eod-submission
- Enter task links from ActiveCollab
- Add notes about the day's work
- Submit the form
\`\`\`

### 2. Data Storage

Submissions are stored in the \`team_eod_submissions\` table:

\`\`\`sql
CREATE TABLE team_eod_submissions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  submission_date DATE NOT NULL,
  task_links TEXT[],
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

### 3. ActiveCollab Sync

N8n workflow syncs task data from ActiveCollab:

\`\`\`
Daily at 6:00 PM:
1. Fetch tasks updated today
2. Fetch time records
3. Transform data
4. Send to eod-data-sync Edge Function
\`\`\`

### 4. AI Summary Generation

The \`generate-eod-summary\` Edge Function:

\`\`\`typescript
// Triggered by eod-data-sync
- Analyzes task completion
- Calculates hours logged
- Identifies concerns
- Generates key accomplishments
- Stores in team_daily_summaries
\`\`\`

## Database Tables

### team_eod_submissions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Submitting user |
| submission_date | DATE | Date of submission |
| task_links | TEXT[] | Array of ActiveCollab task URLs |
| notes | TEXT | User notes |
| created_at | TIMESTAMP | Submission timestamp |

### team_daily_summaries

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User being summarized |
| summary_date | DATE | Date of summary |
| hours_logged | NUMERIC | Total hours |
| tasks_completed | INTEGER | Number of tasks |
| key_accomplishments | TEXT[] | AI-identified accomplishments |
| concerns | TEXT[] | Potential issues |
| ai_summary | JSONB | Full AI analysis |
| productivity_score | NUMERIC | Calculated score |

### activecollab_task_data

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| external_task_id | TEXT | ActiveCollab task ID |
| task_name | TEXT | Task title |
| assignee_id | UUID | Assigned user |
| project_id | UUID | Associated project |
| status | TEXT | Task status |
| hours_logged | NUMERIC | Time logged |
| sync_date | DATE | Last sync date |
| raw_data | JSONB | Full ActiveCollab data |

## Edge Functions

### eod-data-sync

**Endpoint**: \`POST /functions/v1/eod-data-sync\`

**Purpose**: Receives EOD data from N8n workflows

**Request Body**:
\`\`\`json
{
  "user_email": "john@example.com",
  "submission_date": "2025-01-09",
  "tasks": [
    {
      "task_id": "12345",
      "task_name": "Complete feature X",
      "hours": 4.5,
      "status": "completed",
      "project_id": "project-123"
    }
  ],
  "webhook_secret": "your-secret"
}
\`\`\`

**Response**:
\`\`\`json
{
  "success": true,
  "records_created": 5,
  "summary_generated": true
}
\`\`\`

### generate-eod-summary

**Endpoint**: \`POST /functions/v1/generate-eod-summary\`

**Purpose**: Generates AI summaries from EOD data

**Request Body**:
\`\`\`json
{
  "user_id": "user-uuid",
  "date": "2025-01-09"
}
\`\`\`

## Manager Dashboard

Managers can view team summaries at \`/dashboard/manager\`:

- Daily summaries for all team members
- Productivity trends
- Hours logged vs. expected
- Flagged concerns
- Team insights

## Integration Setup

See [N8n EOD Workflow Guide](../integrations/n8n-eod-workflow) for:
- N8n workflow configuration
- ActiveCollab API setup
- Webhook credentials
- Testing procedures

## RLS Policies

\`\`\`sql
-- Users can view their own submissions
CREATE POLICY "Users can view own EOD"
ON team_eod_submissions FOR SELECT
USING (auth.uid() = user_id);

-- Managers can view all summaries
CREATE POLICY "Managers can view all summaries"
ON team_daily_summaries FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'manager', 'pm')
  )
);
\`\`\`

## Related Documentation

- [N8n EOD Workflow Setup](../integrations/n8n-eod-workflow)
- [ActiveCollab Integration](../integrations/activecollab)
- [Manager Dashboard](./manager-dashboard)
- [AI Summaries](./ai-features)
`,

  "api/edge-functions/overview": `# Edge Functions Overview

> **Last Updated**: 2025-01-09
> **Tags**: api, edge-functions, supabase, deno

## What are Edge Functions?

Edge Functions are server-side TypeScript functions that run on Supabase's global edge network. They provide:

- ✅ Server-side logic execution
- ✅ Secure API integrations
- ✅ Data transformation and validation
- ✅ Authentication and authorization
- ✅ Webhook handling

## Available Edge Functions

### Admin & Management

- **admin-users**: User CRUD operations
- **admin-brands**: Brand management

### AI & Code

- **run-ai-agent**: Execute AI agent workflows
- **analyze-codebase**: Code analysis
- **generate-code**: AI code generation

### Data Sync

- **eod-data-sync**: EOD data ingestion
- **generate-eod-summary**: AI summary generation
- **import-hours**: Time tracking import
- **hubspot-sync**: CRM synchronization

### Integrations

- **collabai-manage**: CollabAI agent management
- **gohighlevel-manage**: GoHighLevel integration
- **n8n-analytics-manage**: N8n analytics webhooks

### Video

- **gemini-veo-manager**: Gemini video generation
- **sora-video-manager**: OpenAI Sora videos

### Auth

- **auth**: Custom authentication flows

## Function Structure

Standard Edge Function structure:

\`\`\`typescript
// supabase/functions/function-name/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const body = await req.json();

    // Your logic here
    const result = await processRequest(body);

    // Return response
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
\`\`\`

## Authentication

Most functions require authentication:

\`\`\`typescript
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  throw new Error('Missing authorization header');
}

const token = authHeader.replace('Bearer ', '');
const { data: { user } } = await supabaseClient.auth.getUser(token);

if (!user) {
  throw new Error('Invalid token');
}
\`\`\`

## Environment Variables

Access secrets using \`Deno.env.get()\`:

\`\`\`typescript
const openaiKey = Deno.env.get('OPENAI_KEY');
const hubspotToken = Deno.env.get('Hubspot_Access_token');
\`\`\`

## Deployment

Functions are deployed automatically via Supabase:

\`\`\`bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name

# View logs
supabase functions logs function-name
\`\`\`

## Testing

Test locally using Supabase CLI:

\`\`\`bash
# Serve all functions
supabase functions serve

# Serve specific function
supabase functions serve function-name --env-file .env.local

# Test with curl
curl -i --location --request POST 'http://localhost:54321/functions/v1/function-name' \\
  --header 'Authorization: Bearer YOUR_TOKEN' \\
  --header 'Content-Type: application/json' \\
  --data '{"key":"value"}'
\`\`\`

## Error Handling

Consistent error responses:

\`\`\`typescript
interface ErrorResponse {
  error: string;
  details?: any;
  code?: string;
}

// Example
return new Response(
  JSON.stringify({ 
    error: 'Validation failed',
    details: { field: 'email', message: 'Invalid format' },
    code: 'VALIDATION_ERROR'
  }),
  { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 422 
  }
);
\`\`\`

## Rate Limiting

Implement rate limiting for webhook endpoints:

\`\`\`typescript
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(identifier: string, limit: number = 100): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  const requests = rateLimitMap.get(identifier) || [];
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= limit) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  return true;
}
\`\`\`

## Related Documentation

- [admin-users Function](./admin-users)
- [eod-data-sync Function](./eod-data-sync)
- [Authentication Flow](../../architecture/auth-flow)
- [Deployment Guide](../../deployment/edge-functions)
`,

  "architecture/database-schema": `# Database Schema

> **Last Updated**: 2025-01-09
> **Tags**: database, schema, architecture, ERD

## Overview

The SJ Marketing AI Platform uses **PostgreSQL** (via Supabase) as its primary database. The schema is designed to support multi-tenant operations, role-based access control, and comprehensive project management workflows.

### Key Statistics

- **Total Tables**: 29
- **Core Domains**: 7 (Users, Brands, Projects, Clients, AI, Integrations, Analytics)
- **Security Model**: Row-Level Security (RLS) on all tables
- **Foreign Keys**: Extensive referential integrity
- **Indexes**: Optimized for common query patterns

## Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    users ||--o{ user_brands : "has access to"
    users ||--o{ user_permissions : "has"
    users ||--o{ user_accountability_chart : "owns"
    users ||--o{ projects : "manages"
    users ||--o{ project_tasks : "assigned to"
    users ||--o{ team_eod_submissions : "submits"
    users ||--o{ team_daily_summaries : "has"
    
    brands ||--o{ user_brands : "assigned to users"
    brands ||--o{ brand_kpis : "tracks"
    brands ||--o{ brand_analytics_integrations : "integrates with"
    brands ||--o{ brand_analytics_data : "collects"
    
    clients ||--o{ projects : "owns"
    clients ||--o{ contacts : "has"
    clients ||--o{ deals : "negotiates"
    clients ||--o{ activities : "has"
    clients ||--o{ client_communications : "exchanges"
    
    projects ||--o{ project_tasks : "contains"
    
    ai_agents ||--o{ ai_agent_runs : "executes"
    ai_agent_runs ||--o{ team_daily_summaries : "generates"
    ai_agent_runs ||--o{ code_analysis_results : "produces"
    
    collabai_integrations ||--o{ collabai_agents : "provides"
    gohighlevel_integrations ||--o{ gohighlevel_contacts : "syncs"
    
    users ||--o{ gemini_videos : "creates"
    users ||--o{ code_repositories : "owns"
    users ||--o{ collabai_integrations : "configures"
\`\`\`

## Domain Breakdown

### 1. User Management Domain

Core tables for authentication, authorization, and user profiles.

#### \`users\` (Primary)
The central user table storing authentication and profile data.

**Key Columns:**
- \`id\` (uuid, PK): Matches auth.users for Supabase Auth
- \`email\` (citext): Case-insensitive unique email
- \`role\` (app_role): Enum of super_admin, manager, pm, user
- \`status\` (text): active, inactive, pending
- \`first_name\`, \`last_name\` (varchar)
- \`title\`, \`department\` (varchar)
- \`is_marketing\` (boolean): Special marketing team flag
- \`password_hash\` (text): For custom auth
- \`refresh_token\`, \`refresh_token_expires_at\`: JWT token management

**RLS Policies:**
- Users can view/update their own profile
- Super admins can view/update all users
- Managers can view manager-level and below

#### \`user_permissions\` (Granular Access)
Fine-grained module-level permissions for users.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`module_name\` (text): e.g., "clients", "projects", "brands"
- \`can_view\`, \`can_create\`, \`can_edit\`, \`can_delete\` (boolean)

**Use Cases:**
- Restrict access to specific features
- Override role-based defaults
- Audit permission changes

#### \`user_brands\` (Brand Access)
Maps users to brands with specific access levels.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`brand_id\` (uuid, FK → brands)
- \`access_level\` (text): viewer, editor, admin
- \`can_view_analytics\`, \`can_manage_content\`, \`can_manage_team\`, \`can_manage_settings\` (boolean)

**Pattern:**
- Users can be assigned to multiple brands
- Each assignment has granular permissions
- Used by \`user_has_brand_access()\` function

#### \`user_accountability_chart\`
Defines roles, responsibilities, and work types for users.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`serial_number\` (integer): Order/priority
- \`type_of_work\` (text): Category of work
- \`responsibilities\` (text): Detailed description

---

### 2. Brand Management Domain

Multi-brand support with ownership and team collaboration.

#### \`brands\`
Core brand/client entity with ownership model.

**Key Columns:**
- \`id\` (uuid, PK)
- \`name\` (text): Brand name
- \`slug\` (text, unique): URL-friendly identifier
- \`type\` (text): internal, external
- \`status\` (text): active, inactive, archived
- \`owner_id\` (uuid, FK → users): Primary owner
- \`co_owner_id\` (uuid, FK → users): Secondary owner
- \`team_members\` (uuid[]): Array of team member IDs
- \`monthly_budget\` (numeric)
- \`active_integrations\` (text[]): e.g., ["google_analytics", "n8n"]
- \`website_url\`, \`logo_url\`, \`description\`

**Access Control:**
Uses \`user_has_brand_access()\` function for RLS

#### \`brand_kpis\`
Configurable key performance indicators per brand.

**Key Columns:**
- \`brand_id\` (uuid, FK → brands)
- \`name\` (text): KPI name
- \`type\` (text): revenue, engagement, conversions, traffic, etc.
- \`source\` (text): manual, google_analytics, n8n
- \`current_value\`, \`target_value\` (numeric)
- \`display_order\` (integer)

#### \`brand_analytics_integrations\`
Configuration for analytics data sources per brand.

**Key Columns:**
- \`brand_id\` (uuid, FK → brands)
- \`integration_type\` (text): n8n_analytics, google_analytics
- \`webhook_url\`, \`webhook_secret\` (text)
- \`n8n_workflow_id\` (text)
- \`data_sources\` (jsonb): \`{"google_analytics": true}\`
- \`sync_frequency\` (text): daily, hourly, manual
- \`is_active\` (boolean)
- \`last_sync_at\` (timestamptz)

#### \`brand_analytics_data\`
Stores time-series analytics data received from integrations.

**Key Columns:**
- \`brand_id\` (uuid, FK → brands)
- \`integration_id\` (uuid, FK → brand_analytics_integrations)
- \`data_type\` (text): traffic, engagement, conversions, etc.
- \`date_range_start\`, \`date_range_end\` (date)
- \`metrics\` (jsonb): Flexible metric storage
- \`dimensions\` (jsonb): Breakdown dimensions
- \`raw_data\` (jsonb): Original response
- \`received_at\` (timestamptz)

---

### 3. Client & CRM Domain

Comprehensive client relationship management with HubSpot sync.

#### \`clients\`
Primary client/company records.

**Key Columns:**
- \`id\` (uuid, PK)
- \`name\` (text): Client/company name
- \`company\` (text): Official company name
- \`status\` (text): active, inactive, prospect, archived
- \`source\` (text): manual, hubspot, import
- \`email\`, \`phone\`, \`website\` (text)
- \`address\`, \`city\`, \`state\`, \`country\` (text)
- \`industry\` (text)
- \`assigned_manager\` (uuid, FK → users)
- \`satisfaction_score\` (integer): 1-10
- \`total_revenue\`, \`monthly_billing\`, \`company_revenue\` (numeric)
- \`team_size\`, \`founded_year\` (integer)
- \`hubspot_id\`, \`hubspot_sync_status\`, \`hubspot_last_sync\` (HubSpot integration)
- \`data_completeness_score\` (numeric): Data quality metric

#### \`contacts\`
Individual contacts within client companies.

**Key Columns:**
- \`client_id\` (uuid, FK → clients)
- \`first_name\`, \`last_name\` (text)
- \`email\`, \`phone\` (text)
- \`job_title\`, \`title\` (text)
- \`is_primary\` (boolean): Primary contact flag
- \`lifecycle_stage\` (text): subscriber, lead, opportunity, customer
- \`lead_status\` (text)
- \`hubspot_id\`, \`hubspot_sync_status\`, \`hubspot_last_sync\`

#### \`deals\`
Sales pipeline and deal tracking.

**Key Columns:**
- \`client_id\` (uuid, FK → clients)
- \`name\` (text): Deal name
- \`amount\` (numeric): Deal value
- \`stage\` (text): qualification, proposal, negotiation, closed_won, closed_lost
- \`pipeline\` (text): sales, marketing, partnerships
- \`deal_type\` (text)
- \`probability\` (numeric): Win probability %
- \`close_date\` (date)
- \`hubspot_id\`, \`hubspot_created_at\`, \`hubspot_updated_at\`

#### \`activities\`
CRM activities and interactions.

**Key Columns:**
- \`client_id\` (uuid, FK → clients)
- \`deal_id\` (uuid, FK → deals)
- \`activity_type\` (text): call, email, meeting, note, task
- \`subject\`, \`body\` (text)
- \`activity_date\` (timestamptz)
- \`duration_minutes\` (integer)
- \`outcome\` (text)
- \`hubspot_id\`

#### \`client_communications\`
Communication history with clients.

**Key Columns:**
- \`client_id\` (uuid, FK → clients)
- \`project_id\` (uuid, FK → projects)
- \`created_by\` (uuid, FK → users)
- \`type\` (text): email, phone, meeting, chat
- \`direction\` (text): inbound, outbound
- \`subject\`, \`content\` (text)

---

### 4. Project Management Domain

Project and task tracking with ActiveCollab integration.

#### \`projects\`
Core project entity.

**Key Columns:**
- \`id\` (uuid, PK)
- \`client_id\` (uuid, FK → clients)
- \`name\`, \`description\` (text)
- \`status\` (text): planning, active, on_hold, completed, cancelled
- \`priority\` (text): low, medium, high, urgent
- \`progress\` (integer): 0-100%
- \`budget\`, \`actual_cost\` (numeric)
- \`start_date\`, \`end_date\`, \`deadline\` (date)
- \`project_manager\` (uuid, FK → users)
- \`assigned_team\` (uuid[]): Array of user IDs
- \`tags\` (text[])
- \`external_project_id\` (text): ActiveCollab project ID
- \`total_logged_hours\`, \`last_hours_import\` (numeric, timestamptz)

#### \`project_tasks\`
Individual tasks within projects.

**Key Columns:**
- \`project_id\` (uuid, FK → projects)
- \`title\`, \`description\` (text)
- \`status\` (text): todo, in_progress, review, completed, cancelled
- \`priority\` (text): low, medium, high, urgent
- \`assigned_to\` (uuid, FK → users)
- \`estimated_hours\`, \`actual_hours\`, \`imported_hours\` (numeric)
- \`due_date\`, \`completed_at\` (date, timestamptz)
- \`external_task_id\` (text): ActiveCollab task ID
- \`last_hours_import\` (timestamptz)

#### \`activecollab_task_data\`
Raw ActiveCollab task data for EOD system.

**Key Columns:**
- \`external_task_id\` (text): ActiveCollab task ID
- \`project_id\` (uuid, FK → projects)
- \`assignee_id\` (uuid, FK → users)
- \`task_name\`, \`status\` (text)
- \`hours_logged\` (numeric)
- \`last_comment\`, \`last_comment_date\` (text, timestamptz)
- \`sync_date\` (date)
- \`raw_data\` (jsonb): Full ActiveCollab response

---

### 5. EOD (End-of-Day) Domain

Daily submission and AI summary system.

#### \`team_eod_submissions\`
User-submitted end-of-day reports.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`submission_date\` (date)
- \`task_links\` (text[]): Array of ActiveCollab task URLs
- \`notes\` (text): Additional context

**RLS:**
- Users can CRUD their own submissions
- Managers can view all submissions

#### \`team_daily_summaries\`
AI-generated summaries from EOD data.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`eod_submission_id\` (uuid, FK → team_eod_submissions)
- \`agent_run_id\` (uuid, FK → ai_agent_runs)
- \`summary_date\` (date)
- \`ai_summary\` (jsonb): Structured AI output
- \`key_accomplishments\` (text[])
- \`concerns\` (text[])
- \`hours_logged\`, \`tasks_completed\` (numeric, integer)
- \`productivity_score\` (numeric): 0-100

---

### 6. AI Agent Domain

AI-powered automation and analysis system.

#### \`ai_agents\`
Configured AI agents for various tasks.

**Key Columns:**
- \`id\` (uuid, PK)
- \`name\`, \`slug\` (text)
- \`description\` (text)
- \`category\` (text): eod_analysis, code_review, analytics, reporting
- \`system_prompt\` (text): AI instructions
- \`data_sources\` (jsonb): Data access configuration
- \`output_actions\` (jsonb): Post-processing actions
- \`schedule_config\` (jsonb): Cron schedule
- \`required_role\` (app_role): Minimum role to execute
- \`is_enabled\` (boolean)
- \`created_by\` (uuid, FK → users)

#### \`ai_agent_runs\`
Execution history and results of AI agents.

**Key Columns:**
- \`agent_id\` (uuid, FK → ai_agents)
- \`executed_by\` (uuid, FK → users)
- \`title\`, \`category\` (text)
- \`execution_context\` (jsonb): Input parameters
- \`ai_summary\` (jsonb): Structured AI response
- \`generated_tasks\` (jsonb): Auto-generated tasks
- \`business_context\` (text)
- \`tags\` (jsonb)
- \`status\` (text): completed, failed, processing
- \`approval_status\` (text): pending, approved, rejected
- \`approved_by\`, \`approved_at\` (uuid, timestamptz)
- \`error_message\` (text)

#### \`ai_configurations\`
System-wide AI configuration (business context, model settings, prompts).

**Key Columns:**
- \`configuration_type\` (text): business_context, model_settings, system_prompts
- \`configuration_data\` (jsonb): Flexible JSON storage
- \`created_by\`, \`updated_by\` (uuid, FK → users)

---

### 7. Code Management Domain

Code analysis and generation features.

#### \`code_repositories\`
Registered code repositories for analysis.

**Key Columns:**
- \`name\`, \`description\` (text)
- \`repository_url\` (text): Git URL
- \`branch\` (text): Target branch
- \`language\`, \`framework\` (text)
- \`created_by\` (uuid, FK → users)
- \`analysis_status\` (text): pending, analyzing, completed, failed
- \`last_analyzed_at\` (timestamptz)
- \`metadata\` (jsonb)

#### \`code_analysis_results\`
AI-generated code analysis findings.

**Key Columns:**
- \`repository_id\` (uuid, FK → code_repositories)
- \`agent_run_id\` (uuid, FK → ai_agent_runs)
- \`analysis_type\` (text): security, performance, quality, architecture
- \`severity\` (text): critical, high, medium, low, info
- \`file_path\` (text)
- \`findings\` (jsonb): Structured findings
- \`status\` (text): active, resolved, false_positive

#### \`code_generation_templates\`
Reusable code generation templates.

**Key Columns:**
- \`name\`, \`description\` (text)
- \`category\` (text): component, hook, utility, api, test
- \`language\`, \`framework\` (text)
- \`template_content\` (text): Template source
- \`variables\` (jsonb): Template variables
- \`usage_count\` (integer)
- \`is_active\` (boolean)
- \`created_by\` (uuid, FK → users)

---

### 8. Video Generation Domain

AI video creation with Gemini Veo.

#### \`gemini_videos\`
Generated video tracking.

**Key Columns:**
- \`id\` (text, PK): Gemini operation ID
- \`user_id\` (uuid, FK → users)
- \`operation_name\` (text): Gemini operation name
- \`prompt\`, \`negative_prompt\` (text)
- \`aspect_ratio\` (text): 16:9, 9:16, 1:1
- \`resolution\` (text): 720p, 1080p
- \`duration\` (integer): Seconds
- \`has_audio\` (boolean)
- \`status\` (text): processing, completed, failed
- \`video_url\`, \`thumbnail_url\` (text)
- \`metadata\`, \`error\` (jsonb)
- \`completed_at\` (timestamptz)

**RLS:**
Users can only access their own videos

---

### 9. Integration Domain

Third-party integration configurations.

#### \`collabai_integrations\`
CollabAI platform integration.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`base_url\` (text): CollabAI instance URL
- \`api_key_encrypted\` (text): Encrypted API key
- \`agents_count\` (integer)
- \`is_active\` (boolean)
- \`last_sync_at\` (timestamptz)

#### \`collabai_agents\`
Synced agents from CollabAI.

**Key Columns:**
- \`integration_id\` (uuid, FK → collabai_integrations)
- \`agent_id\` (text): External agent ID
- \`name\`, \`description\` (text)
- \`agent_type\` (text)
- \`sample_questions\` (jsonb)
- \`is_active\` (boolean)
- \`last_synced_at\` (timestamptz)
- \`metadata\` (jsonb)

#### \`gohighlevel_integrations\`
GoHighLevel CRM integration.

**Key Columns:**
- \`user_id\` (uuid, FK → users)
- \`api_key_encrypted\` (text)
- \`location_id\` (text): GHL location
- \`is_active\` (boolean)

#### \`gohighlevel_contacts\`
Synced contacts from GoHighLevel.

**Key Columns:**
- \`integration_id\` (uuid, FK → gohighlevel_integrations)
- \`contact_id\` (text): External contact ID
- \`name\`, \`email\`, \`phone\` (text)
- \`status\` (text)

---

## Security Model

### Row-Level Security (RLS)

**Every table has RLS enabled** with policies based on:

1. **User ID matching** - Users access their own data
2. **Role-based access** - Super admins, managers, PMs have elevated access
3. **Security definer functions** - \`user_has_brand_access()\`, \`user_is_marketing_or_manager()\`
4. **Service role bypass** - Edge functions use service role

### Common RLS Patterns

\`\`\`sql
-- Pattern 1: Own data only
CREATE POLICY "users_view_own" ON table_name
  FOR SELECT USING (user_id = auth.uid());

-- Pattern 2: Role-based access
CREATE POLICY "managers_view_all" ON table_name
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('super_admin', 'manager')
    )
  );

-- Pattern 3: Security definer function
CREATE POLICY "brand_access" ON brand_kpis
  FOR SELECT USING (
    user_has_brand_access(auth.uid(), brand_id)
  );
\`\`\`

## Key Database Functions

### \`user_has_brand_access(_user_id uuid, _brand_id uuid)\`
Checks if user has access to a brand via ownership or team membership.

\`\`\`sql
CREATE FUNCTION user_has_brand_access(_user_id uuid, _brand_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM brands
    WHERE id = _brand_id
    AND (
      owner_id = _user_id
      OR co_owner_id = _user_id
      OR _user_id = ANY(team_members)
    )
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
\`\`\`

### \`user_is_marketing_or_manager(_user_id uuid)\`
Checks if user is marketing team or manager role.

\`\`\`sql
CREATE FUNCTION user_is_marketing_or_manager(_user_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = _user_id
    AND (role IN ('super_admin', 'manager') OR is_marketing = true)
  )
$$ LANGUAGE sql STABLE SECURITY DEFINER;
\`\`\`

### \`get_current_user_role()\`
Returns the role of the currently authenticated user.

\`\`\`sql
CREATE FUNCTION get_current_user_role()
RETURNS text AS $$
  SELECT role::text FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;
\`\`\`

### \`update_updated_at_column()\`
Trigger function to automatically update \`updated_at\` timestamps.

\`\`\`sql
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
\`\`\`

## Data Types

### Custom Enums

\`\`\`sql
-- User roles
CREATE TYPE app_role AS ENUM ('super_admin', 'manager', 'pm', 'user');

-- Used throughout the system for role-based access control
\`\`\`

### JSONB Fields

Heavy use of JSONB for flexible, schema-less data:

- **\`ai_summary\`**: Structured AI responses
- **\`metadata\`**: Integration-specific data
- **\`configuration_data\`**: Dynamic configuration
- **\`raw_data\`**: Original API responses
- **\`metrics\`, \`dimensions\`**: Analytics data

Benefits:
- Flexible schema evolution
- No migrations for new fields
- Efficient indexing with GIN indexes
- JSON operators for querying

## Migration Strategy

### Naming Convention

\`\`\`
YYYYMMDDHHMMSS_descriptive_name.sql
\`\`\`

### Migration Template

\`\`\`sql
-- Create table
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- other columns
);

-- Enable RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "policy_name" ON public.new_table
  FOR SELECT USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_new_table_user_id ON public.new_table(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_new_table_updated_at
  BEFORE UPDATE ON public.new_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
\`\`\`

## Performance Optimizations

### Indexes

- **Primary keys**: All UUIDs with default index
- **Foreign keys**: Indexed for join performance
- **Lookup fields**: email, slug, external_id
- **Date ranges**: For time-series queries
- **GIN indexes**: For JSONB and array columns

### Query Patterns

\`\`\`sql
-- Efficient date range query
SELECT * FROM brand_analytics_data
WHERE brand_id = $1
  AND date_range_start >= $2
  AND date_range_end <= $3
ORDER BY date_range_start DESC;

-- JSONB querying
SELECT * FROM ai_agent_runs
WHERE ai_summary->>'status' = 'completed'
  AND (ai_summary->'metrics'->>'score')::numeric > 80;

-- Array membership
SELECT * FROM brands
WHERE $1 = ANY(team_members);
\`\`\`

## Common Queries

### Get user's accessible brands

\`\`\`sql
SELECT b.* FROM brands b
WHERE owner_id = auth.uid()
   OR co_owner_id = auth.uid()
   OR auth.uid() = ANY(b.team_members)
ORDER BY b.name;
\`\`\`

### Get project with tasks and team

\`\`\`sql
SELECT 
  p.*,
  json_agg(DISTINCT jsonb_build_object(
    'id', t.id,
    'title', t.title,
    'status', t.status
  )) as tasks,
  json_agg(DISTINCT jsonb_build_object(
    'id', u.id,
    'name', u.first_name || ' ' || u.last_name
  )) as team
FROM projects p
LEFT JOIN project_tasks t ON t.project_id = p.id
LEFT JOIN users u ON u.id = ANY(p.assigned_team)
WHERE p.id = $1
GROUP BY p.id;
\`\`\`

### Get EOD summary with tasks

\`\`\`sql
SELECT 
  eod.*,
  ds.ai_summary,
  ds.productivity_score,
  u.first_name,
  u.last_name
FROM team_eod_submissions eod
LEFT JOIN team_daily_summaries ds ON ds.eod_submission_id = eod.id
LEFT JOIN users u ON u.id = eod.user_id
WHERE eod.submission_date = $1
ORDER BY u.first_name;
\`\`\`

## Best Practices

### 1. Always Use RLS
Never bypass RLS in application code - rely on policies.

### 2. Use Prepared Statements
Prevent SQL injection with parameterized queries.

### 3. Limit JSONB Depth
Keep JSONB structures shallow for better performance.

### 4. Index Foreign Keys
Always index foreign key columns.

### 5. Use Transactions
Wrap multi-table operations in transactions.

### 6. Validate Before Insert
Use CHECK constraints or triggers for data validation.

### 7. Archive, Don't Delete
Use \`status\` fields instead of hard deletes.

## Related Documentation

- [Authentication Flow](../auth-flow)
- [RLS Policies Guide](../../database/rls-policies)
- [Users Table](../../database/tables/users)
- [Brands Table](../../database/tables/brands)
- [Database Migrations](../../deployment/database-migrations)
`,

  "architecture/auth-flow": `# Authentication & Authorization

> **Last Updated**: 2025-01-09
> **Tags**: architecture, authentication, authorization, security, rls, roles

## Overview

The application implements a comprehensive authentication and authorization system using Supabase Auth with a custom role-based access control (RBAC) system. This system ensures secure access to resources while maintaining flexibility for different user types.

---

## Authentication System

### Authentication Provider

**Supabase Auth** handles all authentication operations:
- User registration
- Login/logout
- Password reset
- Session management
- JWT token generation and validation

### Authentication Flow

\`\`\`mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase Auth
    participant Database
    participant Edge Function

    User->>Frontend: Enter credentials
    Frontend->>Supabase Auth: POST /auth/v1/token
    Supabase Auth->>Database: Validate credentials
    Database-->>Supabase Auth: User validated
    Supabase Auth->>Supabase Auth: Generate JWT token
    Supabase Auth-->>Frontend: Return access_token & refresh_token
    Frontend->>Frontend: Store tokens in memory
    Frontend->>Edge Function: API request with JWT
    Edge Function->>Supabase Auth: Validate JWT
    Supabase Auth-->>Edge Function: Token valid
    Edge Function->>Database: Query with auth.uid()
    Database->>Database: Apply RLS policies
    Database-->>Edge Function: Return filtered data
    Edge Function-->>Frontend: Return response
\`\`\`

### JWT Token Structure

The JWT token contains:
- **sub**: User ID (UUID)
- **email**: User's email address
- **role**: Supabase role (authenticated/anon)
- **exp**: Token expiration timestamp
- **iat**: Token issued at timestamp

---

## Authorization System

### Role Hierarchy

The system uses a 4-tier role hierarchy defined in the \`app_role\` enum:

\`\`\`sql
CREATE TYPE app_role AS ENUM (
  'super_admin',  -- Full system access
  'manager',      -- Department/team management
  'pm',           -- Project management
  'user'          -- Basic team member
);
\`\`\`

#### Role Capabilities

**🔴 super_admin** (Highest privilege)
- Full access to all data and operations
- User management (create, update, delete users)
- Brand management (all brands)
- Permission assignment
- System configuration
- Access to admin panel

**🟡 manager**
- View and manage department/team data
- Brand management (assigned brands)
- User management (view users)
- Project oversight
- KPI configuration
- EOD submission review

**🟢 pm** (Project Manager)
- Project management (assigned projects)
- Task management
- Client communication
- View assigned team members
- Submit EOD reports

**⚪ user** (Team Member)
- View assigned projects
- Manage assigned tasks
- Submit EOD reports
- Update own profile
- View own dashboard

### Marketing Team Flag

In addition to roles, users can have an \`is_marketing\` flag:

\`\`\`sql
users.is_marketing = true
\`\`\`

This grants special permissions for:
- Brand analytics access
- Marketing integrations (N8n Analytics)
- Campaign data

---

## Row-Level Security (RLS)

### RLS Policy Architecture

Every table in the database has RLS enabled and policies that filter data based on:
1. User ID (\`auth.uid()\`)
2. User role (from \`users.role\`)
3. Relationships (brand membership, project assignment)

### Common RLS Patterns

#### Pattern 1: User-Owned Data

\`\`\`sql
-- Users can only access their own data
CREATE POLICY "Users can view their own records"
ON table_name FOR SELECT
USING (user_id = auth.uid());
\`\`\`

#### Pattern 2: Role-Based Access

\`\`\`sql
-- Super admins can access everything
CREATE POLICY "Super admins can manage all records"
ON table_name FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);
\`\`\`

#### Pattern 3: Relationship-Based Access

\`\`\`sql
-- Users can access data through relationships
CREATE POLICY "Users can view assigned projects"
ON projects FOR SELECT
USING (
  project_manager = auth.uid()
  OR auth.uid() = ANY(assigned_team)
  OR EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('super_admin', 'manager', 'pm')
  )
);
\`\`\`

#### Pattern 4: Marketing Team Access

\`\`\`sql
-- Marketing team can access brand analytics
CREATE POLICY "Marketing team can view brand analytics"
ON brand_analytics_data FOR SELECT
USING (
  user_is_marketing_or_manager(auth.uid())
  OR user_has_brand_access(auth.uid(), brand_id)
);
\`\`\`

### Helper Functions

Security definer functions prevent RLS recursion:

\`\`\`sql
-- Check if user is marketing or manager
CREATE FUNCTION user_is_marketing_or_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = _user_id
    AND (role IN ('super_admin', 'manager') OR is_marketing = true)
  )
$$;

-- Check if user has brand access
CREATE FUNCTION user_has_brand_access(_user_id uuid, _brand_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM brands
    WHERE id = _brand_id
    AND (
      owner_id = _user_id
      OR co_owner_id = _user_id
      OR _user_id = ANY(team_members)
    )
  )
$$;

-- Get current user's role
CREATE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role::text FROM users WHERE id = auth.uid()
$$;
\`\`\`

---

## Permission System

### Granular Permissions

The \`user_permissions\` table provides module-level permissions:

\`\`\`typescript
interface UserPermission {
  user_id: UUID;
  module_name: string;  // e.g., 'projects', 'clients', 'brands'
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}
\`\`\`

### Brand-Level Permissions

The \`user_brands\` table provides brand-specific permissions:

\`\`\`typescript
interface UserBrand {
  user_id: UUID;
  brand_id: UUID;
  access_level: 'viewer' | 'editor' | 'admin';
  can_view_analytics: boolean;
  can_manage_content: boolean;
  can_manage_team: boolean;
  can_manage_settings: boolean;
}
\`\`\`

---

## Frontend Protection

### Protected Routes

The \`ProtectedRoute\` component enforces authentication:

\`\`\`typescript
// src/components/ProtectedRoute.tsx
function ProtectedRoute({ 
  children, 
  requiredRole 
}: ProtectedRouteProps) {
  const { user, session, role } = useAuth();
  
  if (!session) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && !hasRequiredRole(role, requiredRole)) {
    return <Navigate to="/unauthorized" />;
  }
  
  return <>{children}</>;
}
\`\`\`

### Usage Example

\`\`\`typescript
// App.tsx
<Route
  path="/adminpanel"
  element={
    <ProtectedRoute requiredRole="super_admin">
      <AdminPanel />
    </ProtectedRoute>
  }
/>
\`\`\`

### useAuth Hook

Custom hook for accessing auth state:

\`\`\`typescript
const { 
  user,           // Supabase user object
  session,        // Current session
  role,           // User's app_role
  isMarketing,    // is_marketing flag
  loading,        // Loading state
  signIn,         // Login function
  signOut         // Logout function
} = useAuth();
\`\`\`

---

## Edge Function Authentication

### Validating Requests

Edge functions automatically validate JWT tokens:

\`\`\`typescript
// Supabase client in edge function
import { createClient } from '@supabase/supabase-js';

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
  {
    global: {
      headers: { 
        Authorization: req.headers.get('Authorization')! 
      },
    },
  }
);

// Get authenticated user
const { data: { user }, error } = await supabaseClient.auth.getUser();

if (error || !user) {
  return new Response('Unauthorized', { status: 401 });
}
\`\`\`

### Role Checking

\`\`\`typescript
// Check user role in edge function
const { data: userData, error: userError } = await supabaseClient
  .from('users')
  .select('role, is_marketing')
  .eq('id', user.id)
  .single();

if (userData.role !== 'super_admin') {
  return new Response('Forbidden', { status: 403 });
}
\`\`\`

---

## Login Flow

### Step-by-Step Process

1. **User enters credentials**
   - Email and password on login page

2. **Frontend submits to Supabase**
   \`\`\`typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: email,
     password: password
   });
   \`\`\`

3. **Supabase validates and returns tokens**
   - Access token (JWT)
   - Refresh token

4. **Frontend fetches user details**
   \`\`\`typescript
   const { data: userData } = await supabase
     .from('users')
     .select('*')
     .eq('id', user.id)
     .single();
   \`\`\`

5. **Store auth state**
   - Supabase client handles token storage
   - User data stored in React state

6. **Redirect to dashboard**
   - Based on user role

---

## Logout Flow

\`\`\`typescript
// Sign out and clear session
await supabase.auth.signOut();

// Redirect to login
navigate('/login');
\`\`\`

---

## Password Reset Flow

1. **User requests reset**
   \`\`\`typescript
   await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: 'https://app.example.com/reset-password'
   });
   \`\`\`

2. **User receives email**
   - Contains reset link with token

3. **User submits new password**
   \`\`\`typescript
   await supabase.auth.updateUser({
     password: newPassword
   });
   \`\`\`

---

## Security Best Practices

### ✅ DO

- Always validate on the server (RLS + Edge Functions)
- Use SECURITY DEFINER functions to prevent RLS recursion
- Implement proper role checks in edge functions
- Use parameterized queries
- Validate JWT tokens in all API endpoints
- Implement rate limiting on auth endpoints
- Use strong password requirements
- Enable MFA for admin accounts

### ❌ DON'T

- Never check admin status client-side only
- Don't store sensitive data in JWT
- Don't use hardcoded credentials
- Don't bypass RLS with service role key client-side
- Don't trust client-sent role information
- Don't expose service role keys

---

## Common Auth Patterns

### Check if User is Admin

\`\`\`typescript
// Frontend
const { role } = useAuth();
const isAdmin = role === 'super_admin';

// Edge Function
const { data: userData } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (userData.role !== 'super_admin') {
  throw new Error('Unauthorized');
}
\`\`\`

### Check Brand Access

\`\`\`typescript
const { data: hasAccess } = await supabase
  .rpc('user_has_brand_access', {
    _user_id: user.id,
    _brand_id: brandId
  });
\`\`\`

### Conditional UI Rendering

\`\`\`typescript
{role === 'super_admin' && (
  <Button onClick={handleDelete}>Delete User</Button>
)}

{['super_admin', 'manager'].includes(role) && (
  <AdminPanel />
)}
\`\`\`

---

## Troubleshooting

### "New row violates RLS policy"

**Cause**: INSERT policy requires user_id but not provided
**Solution**: Ensure user_id is set to auth.uid() in insert

\`\`\`typescript
await supabase.from('table').insert({
  ...data,
  user_id: user.id  // Add this!
});
\`\`\`

### "Infinite recursion detected"

**Cause**: RLS policy queries same table
**Solution**: Use SECURITY DEFINER function

### "JWT expired"

**Cause**: Access token expired (1 hour default)
**Solution**: Supabase client auto-refreshes with refresh token

---

## Related Documentation

- [Database Schema](/adminpanel/documentation?page=architecture/database-schema) - Table structure and relationships
- [RLS Policies](/adminpanel/documentation?page=database/rls-policies) - Detailed policy documentation
- [Users Table](/adminpanel/documentation?page=database/tables/users) - User table schema

---

**Last Updated**: 2025-01-09
**Tags**: #architecture #authentication #authorization #security #rls #roles
`,

  "database/tables/users": `# Users Table Reference

> **Last Updated**: 2025-01-09
> **Tags**: database, users, auth, rls, relationships

## Table Summary

The \`users\` table extends Supabase auth identities with application-specific metadata and role assignments. Profiles are synchronized via the \`handle_new_auth_user()\` trigger to ensure that every authenticated account has a matching row.

## Schema

| Column | Type | Notes |
| --- | --- | --- |
| \`id\` | uuid (PK, FK → auth.users) | Primary identifier; matches Supabase auth UID |
| \`email\` | citext | Unique, case-insensitive email |
| \`full_name\` | text | Display name composed of first/last name |
| \`role\` | app_role enum | One of \`super_admin\`, \`manager\`, \`pm\`, \`brand_manager\`, \`user\` |
| \`is_marketing\` | boolean | Flags marketing team eligibility |
| \`status\` | text | \`active\`, \`inactive\`, \`invited\`, etc. |
| \`avatar_url\` | text | Public storage URL |
| \`created_at\` | timestamptz | Defaults to \`now()\` |
| \`updated_at\` | timestamptz | Managed by trigger \`set_updated_at\` |

## Relationships

- **user_brands**: maps users to brand access levels (owner/member/viewer).
- **user_permissions**: module-level access flags.
- **projects**: \`projects.project_manager\` references \`users.id\`.
- **eod_submissions**: each submission is owned by \`user_id\`.
- **ai_agent_runs**: \`executed_by\` ties execution history back to a user.

### Entity Diagram

\`\`\`mermaid
erDiagram
  users ||--o{ user_brands : membership
  users ||--o{ user_permissions : scoped_access
  users ||--o{ projects : manages
  users ||--o{ eod_submissions : submits
  users ||--o{ ai_agent_runs : executes
\`\`\`

## RLS Policies

1. **Self-access policy** — allows users to view/update their own record.

   \`\`\`sql
   create policy "Users can manage themselves"
   on public.users
   for select using (id = auth.uid())
   with check (id = auth.uid());
   \`\`\`

2. **Manager/Admin policy** — grants elevated roles access to all profiles.

   \`\`\`sql
   create policy "Managers view all users"
   on public.users
   for select using (
     exists (
       select 1 from public.users u
       where u.id = auth.uid()
         and u.role in ('super_admin', 'manager')
     )
   );
   \`\`\`

## Security Automation

The \`handle_new_auth_user()\` function provisions profile rows when a new account is created.

\`\`\`sql
create function handle_new_auth_user()
returns trigger
language plpgsql security definer
set search_path = public as $$
begin
  insert into public.users (id, email, status)
  values (new.id, new.email, 'invited')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure handle_new_auth_user();
\`\`\`

## Common Queries

- **Fetch own profile**

  \`\`\`sql
  select id, email, full_name, role, status
  from public.users
  where id = auth.uid();
  \`\`\`

- **List all marketing-enabled managers**

  \`\`\`sql
  select id, full_name
  from public.users
  where is_marketing
    and role in ('manager', 'super_admin')
  order by full_name;
  \`\`\`

- **Assign role**

  \`\`\`sql
  update public.users
  set role = 'manager', updated_at = now()
  where id = :user_id;
  \`\`\`

## Code Usage

### \`useAuth\` Profile Loading

\`\`\`tsx
// src/hooks/useAuth.tsx
const { data: userProfile, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', authUser.id)
  .maybeSingle();
\`\`\`

### \`useAdminUsers\` Admin Fetching

\`\`\`tsx
// src/hooks/useAdminUsers.tsx
const { data } = await axiosPrivate.get<UsersResponse>('/admin-users', {
  params,
});
setUsers(data.users);
\`\`\`

These hooks rely on RLS to scope data and on edge functions (\`admin-users\`) to handle privileged mutations.

## Cross-References

- [Authentication Architecture](../../architecture/authentication)
- [RLS Policies Guide](../../database/rls-policies)
- [Brands Table](../tables/brands)
`,

  "database/tables/brands": `# Brands Table Reference

> **Last Updated**: 2025-01-09
> **Tags**: database, brands, ownership, rls, analytics

## Table Summary

Brands anchor client workstreams, analytics connections, and KPI tracking. Ownership metadata and team member lists dictate access patterns across dashboards.

## Schema

| Column | Type | Notes |
| --- | --- | --- |
| \`id\` | uuid (PK) | Generated via \`gen_random_uuid()\` |
| \`name\` | text | Human-friendly brand name |
| \`owner_id\` | uuid (FK → users) | Primary brand owner |
| \`co_owner_id\` | uuid (FK → users) | Optional secondary owner |
| \`team_members\` | uuid[] | Array of users with access |
| \`logo_url\` | text | Storage reference |
| \`description\` | text | Markdown-friendly summary |
| \`status\` | text | \`active\`, \`paused\`, \`archived\` |
| \`created_at\` | timestamptz | Defaults to \`now()\` |
| \`updated_at\` | timestamptz | Managed by \`set_updated_at\` trigger |

## Relationships

- **user_brands**: join table for granular permissions (viewer/member/owner).
- **brand_kpis**: KPI definitions scoped per brand.
- **brand_analytics_integrations**: OAuth/API configuration per platform.
- **projects**: projects reference \`brand_id\` for reporting.

### Relationship Diagram

\`\`\`mermaid
erDiagram
  brands ||--o{ user_brands : access
  brands ||--o{ brand_kpis : metrics
  brands ||--o{ brand_analytics_integrations : integrations
  brands ||--o{ projects : initiatives
  users ||--o{ user_brands : membership
\`\`\`

## RLS Policies

Policies rely on the \`user_has_brand_access()\` helper:

\`\`\`sql
create policy "Brand access"
on public.brands
for select using (
  user_has_brand_access(auth.uid(), id)
  or exists (
    select 1 from public.users u
    where u.id = auth.uid()
      and u.role in ('super_admin', 'manager')
  )
);
\`\`\`

Mutations require ownership checks:

\`\`\`sql
create policy "Brand owners manage brand"
on public.brands
for all using (
  auth.uid() = owner_id
  or auth.uid() = co_owner_id
  or user_has_brand_access(auth.uid(), id)
);
\`\`\`

## Team Member Management

1. Owners assign collaborators by updating \`team_members[]\` or via \`user_brands\` rows.
2. Edge functions validate permissions using \`user_has_brand_access()\` before persisting changes.
3. Hooks such as \`useAdminBrands\` and \`useBrandKPIs\` refresh TanStack Query caches after mutations to keep UI in sync.

### Example Access Workflow

\`\`\`mermaid
sequenceDiagram
    participant Admin
    participant UI as Admin UI
    participant EF as Edge Function (admin-brands)
    participant DB as brands
    Admin->>UI: Add team member
    UI->>EF: PUT /admin-brands?id=:brandId
    EF->>DB: update brands set team_members = array_append(...)
    DB-->>EF: Row updated (RLS enforced)
    EF-->>UI: Success payload
    UI-->>UI: refetch via useAdminBrands()
\`\`\`

## Example Queries

- **List accessible brands for current user**

  \`\`\`sql
  select b.*
  from public.brands b
  where user_has_brand_access(auth.uid(), b.id);
  \`\`\`

- **Attach analytics integration**

  \`\`\`sql
  insert into public.brand_analytics_integrations (brand_id, provider, credentials)
  values (:brand_id, 'google_analytics', :encrypted_payload);
  \`\`\`

- **Promote co-owner**

  \`\`\`sql
  update public.brands
  set co_owner_id = :user_id
  where id = :brand_id;
  \`\`\`

## Code Usage

### \`useAdminBrands\` Edge Function Invocation

\`\`\`tsx
// src/hooks/useAdminBrands.tsx
const response = await supabase.functions.invoke('admin-brands', {
  method: 'GET',
  headers: {
    Authorization: \`Bearer \${session.session.access_token}\`,
  },
});
setBrands(response.data || []);
\`\`\`

### \`useBrandKPIs\` Brand-Scoped KPIs

\`\`\`tsx
// src/hooks/useBrandKPIs.tsx
const { data, error } = await supabase
  .from('brand_kpis')
  .select('*')
  .order('display_order');
setKpis(data || []);
\`\`\`

## Cross-References

- [Users Table](../tables/users)
- [KPI Architecture](../../analytics/kpi-architecture)
- [Integrations Overview](../../integrations/overview)
`,
};

export default function Documentation() {
  const [selectedDoc, setSelectedDoc] = useState<string>("getting-started/overview");
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    // Load documentation content
    const docContent = documentationContent[selectedDoc] || "# Documentation Not Found\n\nThis documentation page is under construction.";
    setContent(docContent);
  }, [selectedDoc]);

  const currentDocInfo = getDocByFile(selectedDoc);

  const handleDownloadAll = () => {
    // Combine all documentation content
    let allContent = "SJ MARKETING AI PLATFORM - COMPLETE DOCUMENTATION\n";
    allContent += "=".repeat(60) + "\n\n";
    
    documentationIndex.forEach((category) => {
      allContent += `\n${"=".repeat(60)}\n`;
      allContent += `CATEGORY: ${category.title.toUpperCase()}\n`;
      allContent += `${"=".repeat(60)}\n\n`;
      
      category.items.forEach((item) => {
        const itemContent = documentationContent[item.file] || "# Documentation Not Found";
        allContent += `\n${"-".repeat(60)}\n`;
        allContent += `Document: ${item.title}\n`;
        allContent += `File: ${item.file}\n`;
        allContent += `${"-".repeat(60)}\n\n`;
        allContent += itemContent + "\n\n";
      });
    });

    // Create blob and download
    const blob = new Blob([allContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sj-marketing-ai-documentation.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Developer Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive guides and API references for SJ Marketing AI platform
          </p>
        </div>
        <Button onClick={handleDownloadAll} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download All
        </Button>
      </div>

      {/* Search */}
      <DocumentationSearch onSelectDoc={setSelectedDoc} currentDoc={selectedDoc} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contents</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DocSidebar
                categories={documentationIndex}
                currentDoc={selectedDoc}
                onSelectDoc={setSelectedDoc}
              />
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="lg:col-span-7">
          <Card>
            <CardHeader>
              <div className="space-y-2">
                <CardTitle className="text-2xl">{currentDocInfo?.title || "Documentation"}</CardTitle>
                <CardDescription>{currentDocInfo?.description}</CardDescription>
                
                {/* Metadata */}
                <div className="flex flex-wrap gap-3 pt-2">
                  {currentDocInfo?.lastUpdated && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      Updated: {currentDocInfo.lastUpdated}
                    </div>
                  )}
                  {currentDocInfo?.tags && currentDocInfo.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-muted-foreground" />
                      {currentDocInfo.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <MarkdownRenderer content={content} />
            </CardContent>
          </Card>
        </main>

        {/* Table of Contents */}
        <aside className="lg:col-span-2 hidden xl:block">
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  On This Page
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TableOfContents content={content} />
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}
