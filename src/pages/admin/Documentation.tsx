import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { documentationIndex, getDocByFile } from "@/lib/documentation";
import { DocumentationSearch } from "@/components/documentation/DocumentationSearch";
import { DocSidebar } from "@/components/documentation/DocSidebar";
import { MarkdownRenderer } from "@/components/documentation/MarkdownRenderer";
import { TableOfContents } from "@/components/documentation/TableOfContents";
import { FileText, Calendar, Tag } from "lucide-react";

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

  "api/edge-functions/admin-users": `# admin-users Edge Function

> **Last Updated**: 2025-01-09
> **Tags**: edge-functions, users, admin, supabase

## Summary

The **admin-users** edge function exposes full CRUD capabilities for managing Supabase auth users and their brand assignments. It is mounted at \`/functions/v1/admin-users\` and is restricted to **super_admin** and **manager** roles.

## Endpoint & Operations

| Method | Path | Description | Auth Requirement |
| ------ | ---- | ----------- | ---------------- |
| GET | \`/functions/v1/admin-users\` | Paginated list of users with brand + permission metadata | Bearer token (super_admin or manager) |
| GET | \`/functions/v1/admin-users/:id\` | Fetch a single user by UUID | Bearer token (super_admin or manager) |
| POST | \`/functions/v1/admin-users\` | Create a new auth + profile record | Bearer token (super_admin or manager) |
| PUT | \`/functions/v1/admin-users?userId=:id\` | Update an existing user and metadata | Bearer token (super_admin or manager) |
| DELETE | \`/functions/v1/admin-users?userId=:id\` | Delete a user (cascades to profile) | Bearer token (super_admin or manager) |

### Query Parameters

- \`page\` / \`limit\`: pagination (defaults 1 / 10)
- \`search\`: fuzzy match against first_name, last_name, email
- \`role\`, \`status\`, \`is_marketing\`: optional filters

## Authentication & Permission Model

- Clients must send \`Authorization: Bearer <JWT>\` obtained from Supabase auth.
- The function verifies the caller and ensures their role is **super_admin** or **manager** using a privileged service role client.
- Row Level Security continues to enforce policies via \`get_current_user_role()\` for any direct table access outside the function (see [RLS reference](../../architecture/security-policies#get_current_user_role)).

\`\`\`typescript
const { data: adminUser, error: adminError } = await supabaseClient
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (adminError || !adminUser || !['super_admin', 'manager'].includes(adminUser.role)) {
  return new Response(
    JSON.stringify({ error: 'Insufficient privileges' }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 403
    }
  );
}
\`\`\`

## Request Payloads

### Create User (POST)

\`\`\`json
{
  "email": "teammate@example.com",
  "password": "TempPass!2025",
  "firstName": "Taylor",
  "lastName": "Jones",
  "role": "pm",
  "status": "active",
  "title": "Project Manager",
  "department": "Campaigns",
  "isMarketing": true,
  "brandAssignments": [
    { "brand_id": "0d5d5b12-3af3-4dd5-b2a2-8f82d5020b1f", "access_level": "owner" },
    { "brand_id": "e45ad9b6-d788-44e2-9f20-3fa2126d2211", "access_level": "member" }
  ]
}
\`\`\`

### Update User (PUT)

\`\`\`json
{
  "firstName": "Taylor",
  "lastName": "Jones",
  "role": "manager",
  "status": "sabbatical",
  "brandAssignments": [
    { "brand_id": "0d5d5b12-3af3-4dd5-b2a2-8f82d5020b1f", "access_level": "owner" }
  ]
}
\`\`\`

## Response Examples

### 200 OK — Paginated List

\`\`\`json
{
  "users": [
    {
      "id": "9f2c4eb1-3f92-4f62-8e87-410a8f84137f",
      "email": "teammate@example.com",
      "first_name": "Taylor",
      "last_name": "Jones",
      "role": "manager",
      "status": "active",
      "is_marketing": true,
      "user_brands": [
        {
          "brand_id": "0d5d5b12-3af3-4dd5-b2a2-8f82d5020b1f",
          "brand_name": "Acme Fitness",
          "access_level": "owner",
          "can_manage_team": true
        }
      ],
      "permissions": []
    }
  ],
  "total": 24,
  "page": 1,
  "limit": 10
}
\`\`\`

### 201 Created — Single User

\`\`\`json
{
  "user": {
    "id": "9f2c4eb1-3f92-4f62-8e87-410a8f84137f",
    "email": "teammate@example.com",
    "role": "pm",
    "user_brands": [
      {
        "brand_id": "0d5d5b12-3af3-4dd5-b2a2-8f82d5020b1f",
        "brand_name": "Acme Fitness",
        "access_level": "owner",
        "can_manage_team": true
      }
    ],
    "permissions": []
  }
}
\`\`\`

## Operational Flow

1. Validate CORS / preflight via shared headers (\`Access-Control-Allow-Origin: *\`, full CRUD verbs).
2. Authenticate caller and enforce role guard.
3. Execute CRUD branch:
   - **GET** builds a dynamic query with pagination, filters, and includes \`user_brands\` + \`user_permissions\` joins.
   - **POST** provisions the Supabase auth user, upserts the profile in \`users\`, and syncs brand assignments via \`syncUserBrands()\`.
   - **PUT** maps camelCase request keys to DB columns, updates auth metadata, and resynchronizes brand assignments.
   - **DELETE** removes the auth user; database triggers clean related tables.
4. Transform raw rows through \`transformUser()\` before returning JSON.

### Brand Assignment Sync

\`\`\`typescript
const normalizedAssignments = brandAssignments
  .filter((assignment) => assignment?.brand_id)
  .map((assignment) => ({
    user_id: userId,
    brand_id: assignment.brand_id,
    access_level: assignment.access_level || 'member',
    can_view_analytics: true,
    can_manage_content: assignment.access_level !== 'viewer',
    can_manage_team: assignment.access_level === 'owner',
    can_manage_settings: assignment.access_level === 'owner'
  }));
\`\`\`

## Error Handling

| Status | Scenario | Body |
| ------ | -------- | ---- |
| 400 | Validation failures, Supabase insert/update errors | \`{ "error": "Failed to assign brands" }\` |
| 401 | Missing/invalid bearer token | \`{ "error": "Invalid authentication" }\` |
| 403 | Authenticated user lacks admin role | \`{ "error": "Insufficient privileges" }\` |
| 404 | Requested user not found (GET by id) | \`{ "error": "User not found" }\` |
| 405 | Unsupported method | \`{ "error": "Method not allowed" }\` |
| 500 | Uncaught errors | \`{ "error": "Internal server error" }\` |

## Related Tables

- \`users\`: canonical profile data synced with Supabase auth
- \`user_brands\`: ownership and team access levels per brand
- \`user_permissions\`: granular module permissions

> ℹ️ These tables enforce RLS with \`get_current_user_role()\`; the edge function bypasses RLS using the service role but still respects business rules described above.

## Testing with curl

\`\`\`bash
curl -X GET \
  "$SUPABASE_URL/functions/v1/admin-users?search=taylor&limit=5" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_TOKEN"

curl -X POST \
  "$SUPABASE_URL/functions/v1/admin-users" \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "email": "teammate@example.com",
        "password": "TempPass!2025",
        "firstName": "Taylor",
        "lastName": "Jones"
      }'
\`\`\`

## CORS Configuration

Inherits \`corsHeaders\` from \`supabase/functions/_shared/cors.ts\`, enabling \`GET,POST,PUT,PATCH,DELETE,OPTIONS\` with wildcard origin and support for auth + webhook headers.

## See Also

- [Brand Management API](./admin-brands)
- [Role-Based Access Control](../../architecture/security-policies#get_current_user_role)
- [User & Team Schema](../../architecture/database-schema#users)
`,

  "api/edge-functions/eod-data-sync": `# eod-data-sync Edge Function

> **Last Updated**: 2025-01-09
> **Tags**: edge-functions, eod, automation, n8n, activecollab

## Purpose

The **eod-data-sync** function acts as the webhook receiver for the N8n workflow that pulls End-of-Day (EOD) task activity from ActiveCollab. It normalizes task payloads, maps them to internal users/projects, and stores normalized data for downstream EOD summaries and timesheets.

## Webhook Endpoint

- **URL**: \`/functions/v1/eod-data-sync\`
- **Method**: \`POST\`
- **Headers**: \`Content-Type: application/json\`, \`x-webhook-secret\`
- **Auth**: No bearer token — the shared secret in \`x-webhook-secret\` is required. Set \`EOD_WEBHOOK_SECRET\` in the function environment.

### CORS

\`\`\`typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};
\`\`\`

## Request Schema

The N8n workflow delivers a JSON document that matches \`SyncPayload\`:

\`\`\`json
{
  "sync_date": "2025-01-08",
  "webhook_secret": "${EOD_WEBHOOK_SECRET}",
  "tasks": [
    {
      "external_task_id": "AC-12345",
      "task_name": "Build Q1 campaign report",
      "assignee_email": "teammate@example.com",
      "project_id": "AC-PROJECT-1",
      "status": "completed",
      "hours_logged": 4.5,
      "last_comment": "Uploaded final charts",
      "last_comment_date": "2025-01-08T21:30:00Z",
      "raw_data": { "activecollab": { "task": { "id": 12345 } } }
    }
  ]
}
\`\`\`

## Processing Steps

1. Validate the webhook secret header against \`EOD_WEBHOOK_SECRET\`.
2. Instantiate a Supabase service client (full RLS bypass for data ingestion).
3. Iterate through each task payload:
   - Resolve \`user_id\` from \`assignee_email\` (fallback to null).
   - Resolve \`project_id\` from \`external_project_id\`.
   - Upsert the task into \`activecollab_task_data\` keyed by \`external_task_id\` + \`sync_date\`.
   - When both project & user are present, update \`project_tasks.imported_hours\` for roll-up time tracking.
   - Increment success/failure counters and capture per-task error messages.
4. Return a JSON summary containing \`results.success\`, \`results.failed\`, and \`errors[]\` for observability.

\`\`\`typescript
const { error: upsertError } = await supabase
  .from('activecollab_task_data')
  .upsert({
    external_task_id: task.external_task_id,
    task_name: task.task_name,
    assignee_id: userId,
    project_id: projectId,
    status: task.status,
    last_comment: task.last_comment || null,
    last_comment_date: task.last_comment_date || null,
    hours_logged: task.hours_logged,
    sync_date: payload.sync_date,
    raw_data: task.raw_data || {},
    updated_at: new Date().toISOString()
  }, {
    onConflict: 'external_task_id'
  });
\`\`\`

## Response

\`\`\`json
{
  "message": "Sync completed",
  "sync_date": "2025-01-08",
  "results": {
    "success": 42,
    "failed": 3,
    "errors": [
      "Task AC-99881: Task not linked to known project"
    ]
  }
}
\`\`\`

## Error Handling

- **403**: Missing or invalid \`x-webhook-secret\`
- **500**: Unhandled exceptions (includes \`error\` + \`details\` fields)
- Per-task failures are aggregated in the response while the function continues processing remaining items.

## Related Tables

- \`activecollab_task_data\`: canonical sync storage for raw task metrics
- \`team_eod_submissions\` (a.k.a. \`eod_submissions\`): downstream nightly jobs read synced tasks to build user-facing submissions
- \`time_logs\`: reporting layer referencing \`project_tasks.imported_hours\`
- \`project_tasks\`: bridging table updated with imported hours

> 📌 Follow-up workflows use the normalized task data to populate \`team_eod_submissions\` entries and roll up hours into \`time_logs\`, ensuring ActiveCollab, N8n, and Supabase remain in sync.

## Integration Notes

- Designed to be called from the "SJ Marketing • ActiveCollab → Supabase" N8n workflow.
- Supports batching dozens of tasks per request; adjust N8n batch size if hitting Supabase rate limits.
- Include ActiveCollab task URLs inside \`raw_data\` for richer AI summaries.

## Testing Locally

\`\`\`bash
curl -X POST "http://localhost:54321/functions/v1/eod-data-sync" \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: $EOD_WEBHOOK_SECRET" \
  -d @sample-eod-payload.json
\`\`\`

## Downstream Consumers

- [generate-eod-summary](./generate-eod-summary) uses the synced tasks to build AI narratives.
- Manager dashboards query \`team_daily_summaries\` which reference \`team_eod_submissions\` populated from this pipeline.
`,

  "api/edge-functions/admin-brands": `# admin-brands Edge Function

> **Last Updated**: 2025-01-09
> **Tags**: edge-functions, brands, admin, api

## Summary

The **admin-brands** function centralizes CRUD operations for brands, including ownership assignments, co-owner coordination, and KPI metadata. All requests are authenticated and limited to users with **super_admin** or **manager** roles.

## Endpoint Matrix

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | \`/functions/v1/admin-brands\` | List all brands with owner/co-owner and KPI arrays |
| GET | \`/functions/v1/admin-brands?id=:uuid\` | Retrieve a single brand with expanded relations |
| POST | \`/functions/v1/admin-brands\` | Create a brand and assign ownership |
| PUT | \`/functions/v1/admin-brands?id=:uuid\` | Update brand profile, KPIs, and activation state |
| DELETE | \`/functions/v1/admin-brands?id=:uuid\` | Soft-delete brand metadata |

## Authentication & Role Check

- Requires \`Authorization: Bearer <JWT>\` from Supabase auth.
- Function queries the \`users\` table to confirm the caller's role is \`super_admin\` or \`manager\` before proceeding.
- Inherits shared \`corsHeaders\` enabling full CRUD verbs and wildcard origin.

\`\`\`typescript
const { data: userData, error: userError } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.user.id)
  .single();

if (userError || !userData || !['super_admin', 'manager'].includes(userData.role)) {
  return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
    status: 403,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
\`\`\`

## Request Examples

### Create Brand

\`\`\`json
{
  "name": "Acme Fitness",
  "description": "Full-service fitness marketing client",
  "type": "client",
  "owner_id": "8b91c1c0-9f3a-4e62-8f3f-552f76da6cc9",
  "co_owner_id": "b34502f4-8b96-42f3-9f81-138c2b792c02",
  "monthly_budget": 12000,
  "status": "active"
}
\`\`\`

### Update Brand

\`\`\`json
{
  "name": "Acme Fitness",
  "description": "Enterprise fitness marketing",
  "type": "client",
  "owner_id": "8b91c1c0-9f3a-4e62-8f3f-552f76da6cc9",
  "co_owner_id": null,
  "monthly_budget": 15000,
  "status": "active",
  "is_active": true
}
\`\`\`

## Response Payloads

### List Brands (200 OK)

\`\`\`json
[
  {
    "id": "1d137de4-975b-4d9d-9f01-96e2a9b9bf38",
    "name": "Acme Fitness",
    "description": "Enterprise fitness marketing",
    "owner_name": "Avery Quinn",
    "co_owner_name": "Jordan Lee",
    "status": "active",
    "kpis": [
      {
        "id": "7f9e9418-44f5-4d25-b74f-d4f1eebc5e0e",
        "metric": "MQLs",
        "target_value": 120
      }
    ]
  }
]
\`\`\`

## Brand Team Management

- Ownership metadata is enriched by joining \`users\` via foreign keys (\`brands_owner_id_fkey\`, \`brands_co_owner_id_fkey\`).
- After brand creation, managers assign execution teams through the [admin-users](./admin-users) interface which syncs \`user_brands\` records.
- KPI arrays (\`brand_kpis\`) are returned inline for dashboard rendering.

## Error Conditions

- **400**: Missing required fields (name, description, owner_id) or missing \`id\` on update/delete.
- **401**: Missing/invalid bearer token.
- **403**: Role is not \`super_admin\`/\`manager\`.
- **404**: Requested brand not found (GET with \`id\`).
- **500**: Database insert/update/delete failure.

## Related Tables

- \`brands\`: core brand metadata.
- \`user_brands\`: team assignments + access levels (managed via admin-users).
- \`brand_kpis\`: per-brand KPI configuration returned in GET responses.

## Sample curl

\`\`\`bash
curl -X GET "$SUPABASE_URL/functions/v1/admin-brands" \
  -H "Authorization: Bearer $MANAGER_TOKEN"

curl -X POST "$SUPABASE_URL/functions/v1/admin-brands" \
  -H "Authorization: Bearer $SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Acme Fitness",
        "description": "Enterprise fitness marketing",
        "owner_id": "8b91c1c0-9f3a-4e62-8f3f-552f76da6cc9"
      }'
\`\`\`

## Additional Notes

- Slugs are auto-generated from the name (lowercase, hyphenated).
- Deleting a brand only removes metadata; dependent tables should implement cascading cleanup where required.
- Combine with [hubspot-sync](./hubspot-sync) to import CRM clients before assigning to brands.
`,

  "api/edge-functions/hubspot-sync": `# hubspot-sync Edge Function

> **Last Updated**: 2025-01-09
> **Tags**: edge-functions, hubspot, crm, integration

## Overview

The **hubspot-sync** function bridges HubSpot CRM data with Supabase, supporting lookup, import, and synchronization workflows for clients, contacts, and deals. It expects a JSON payload describing the \`action\` to perform.

## Endpoint

- **URL**: \`/functions/v1/hubspot-sync\`
- **Methods**: \`POST\` (main), \`OPTIONS\` (CORS preflight)
- **Headers**: \`Authorization: Bearer <JWT>\` (Supabase auth), \`Content-Type: application/json\`

## Supported Actions

| Action | Description | HubSpot Scope | Database Impact |
| ------ | ----------- | ------------- | ---------------- |
| \`search_companies\` | Fuzzy search companies by name | CRM v3 search API | None (read-only) |
| \`fetch_company_by_id\` | Retrieve company + associated contacts (contact IDs auto-resolve) | CRM company + contacts APIs | None (read-only) |
| \`import_company\` | Upsert a HubSpot company and contacts into Supabase | Companies + contacts | Upserts \`clients\` & \`contacts\` |
| \`sync_client\` | Refresh an existing client record from HubSpot | Companies | Updates \`clients\` |
| \`link_client\` | Associate an existing client with a HubSpot object ID | None | Updates \`clients.hubspot_id\` |

## OAuth Token Management

- Uses the HubSpot private app access token stored in \`Hubspot_Access_token\` (environment variable).
- The function throws an error if the token is missing; automate token rotation via Supabase secrets or scheduled redeploys.
- For public OAuth apps, exchange refresh tokens externally and update the secret before invoking the function.

## Request Examples

### Search Companies

\`\`\`json
{
  "action": "search_companies",
  "searchTerm": "Acme"
}
\`\`\`

### Import Company + Contacts

\`\`\`json
{
  "action": "import_company",
  "company": {
    "id": "123456",
    "properties": {
      "name": "Acme Fitness",
      "domain": "acmefitness.com",
      "industry": "Wellness",
      "city": "Austin",
      "state": "TX",
      "phone": "+1-555-0100",
      "annualrevenue": "1200000",
      "numberofemployees": "48",
      "description": "Multi-location fitness franchise"
    }
  },
  "contacts": [
    {
      "id": "8801",
      "properties": {
        "firstname": "Avery",
        "lastname": "Quinn",
        "email": "avery@acmefitness.com",
        "jobtitle": "VP Marketing"
      }
    }
  ]
}
\`\`\`

## Data Mapping

| HubSpot Property | Supabase Column |
| ---------------- | --------------- |
| \`name\` | \`clients.name\`, \`clients.company\` |
| \`domain\` / \`website\` | \`clients.website\` |
| \`phone\` | \`clients.phone\` |
| \`annualrevenue\` | \`clients.company_revenue\` |
| \`numberofemployees\` | \`clients.team_size\` |
| \`description\` | \`clients.notes\` |
| Contact \`firstname/lastname\` | \`contacts.first_name\` / \`contacts.last_name\` |
| Contact \`email\` | \`contacts.email\` |
| Contact \`jobtitle\` | \`contacts.job_title\` |

Deals support can be layered by extending the payload and writing to the \`deals\` table in future iterations.

## Code Highlights

### Company Search

\`\`\`typescript
const response = await fetch(
  'https://api.hubapi.com/crm/v3/objects/companies/search',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hubspotToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'name',
          operator: 'CONTAINS_TOKEN',
          value: searchTerm
        }]
      }],
      properties: ['name', 'domain', 'industry', 'city', 'state', 'country'],
      limit: 20
    })
  }
);
\`\`\`

### Import Workflow

\`\`\`typescript
const { data: client, error: clientError } = await supabase
  .from('clients')
  .upsert(clientData, { onConflict: 'hubspot_id' })
  .select()
  .single();

if (contacts && contacts.length > 0) {
  const contactsData = contacts.map((contact: any) => ({
    client_id: client.id,
    hubspot_id: contact.id,
    first_name: contact.properties.firstname || null,
    last_name: contact.properties.lastname || null,
    email: contact.properties.email || null,
    job_title: contact.properties.jobtitle || null
  }));

  await supabase
    .from('contacts')
    .upsert(contactsData, { onConflict: 'hubspot_id' });
}
\`\`\`

## Error Handling & Retries

- HubSpot API errors bubble up with status and response body for easier debugging.
- The function returns **400** with \`{ "error": string, "details": string }\` for invalid actions or downstream failures.
- Wrap calls in an N8n retry strategy or queue worker to handle HubSpot rate limits (HTTP 429).

## Related Tables

- \`clients\`: CRM companies imported from HubSpot.
- \`contacts\`: People associated with clients.
- \`deals\`: Pipeline data (extend action handlers to populate).

## Usage Tips

- Execute \`search_companies\` to preview results before importing.
- After importing, link the Supabase client to a brand via [admin-brands](./admin-brands) and assign team members through [admin-users](./admin-users).
- Schedule periodic \`sync_client\` jobs for key accounts to refresh revenue and team size fields.
`,

  "api/edge-functions/generate-eod-summary": `# generate-eod-summary Edge Function

> **Last Updated**: 2025-01-09
> **Tags**: edge-functions, eod, ai, openai

## Purpose

The **generate-eod-summary** function produces manager-ready AI summaries of team activity by combining synced ActiveCollab tasks with EOD submissions. It leverages OpenAI's \`gpt-4o-mini\` model to output structured JSON summaries per user.

## Endpoint

- **URL**: \`/functions/v1/generate-eod-summary\`
- **Method**: \`POST\`
- **Headers**: \`Content-Type: application/json\`
- **Auth**: Typically invoked with a service role token via scheduled jobs (no per-user token required in current implementation).

## Request Body

\`\`\`json
{
  "date": "2025-01-08"
}
\`\`\`

If \`date\` is omitted, the function defaults to the current UTC date.

## Processing Pipeline

1. Fetch all \`team_eod_submissions\` for the target date and join \`users\` data (name, role, title).
2. Extract ActiveCollab task IDs from \`task_links\` (pattern \`AC-<ID>\`) and pull matching entries from \`activecollab_task_data\` synced by [eod-data-sync](./eod-data-sync).
3. Derive metrics: tasks completed, total hours logged, total task count.
4. Build a structured prompt with user metadata, task details, notes, and metrics.
5. Call OpenAI Chat Completions (\`gpt-4o-mini\`, \`temperature: 0.3\`, JSON response format) to generate the summary payload.
6. Upsert the result into \`team_daily_summaries\` keyed by \`user_id\` + \`summary_date\`.

\`\`\`typescript
const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${openaiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an assistant manager who analyzes team member work reports. Provide constructive feedback in JSON.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  }),
});
\`\`\`

## Response Example

\`\`\`json
{
  "message": "Summary generation completed",
  "date": "2025-01-08",
  "submissions_processed": 7,
  "summaries_generated": 6
}
\`\`\`

Individual summaries are stored in \`team_daily_summaries.ai_summary\` as JSON. Example structure:

\`\`\`json
{
  "overall_summary": "Taylor delivered campaign assets and coordinated cross-team reviews.",
  "key_accomplishments": [
    "Finalized Q1 campaign report",
    "Resolved analytics dashboard issues"
  ],
  "productivity_score": 86,
  "productivity_justification": "High output with timely completion of critical tasks.",
  "concerns": ["Pending client approval for revised assets"],
  "recommendations": ["Confirm next sprint backlog with PM"],
  "hours_analysis": "4.5 hours logged across 3 tracked tasks."
}
\`\`\`

## Error Handling

- Returns **200** with a "No submissions found" message when no EODs exist for the date.
- OpenAI API failures propagate as **500** with \`error\` + \`details\` fields.
- Per-user processing errors are logged but do not abort the entire run (loop continues).

## Related Tables

- \`team_eod_submissions\`: source EOD data entered by users.
- \`activecollab_task_data\`: task metrics used to enrich AI prompts.
- \`team_daily_summaries\`: destination for AI outputs and KPIs.

## Scheduling Guidance

- Trigger nightly after [eod-data-sync](./eod-data-sync) completes to ensure task data is available.
- Store \`OPENAI_KEY\`, \`SUPABASE_URL\`, \`SUPABASE_SERVICE_ROLE_KEY\` as function environment variables.
- Monitor Supabase function logs for OpenAI rate limit responses and consider batching by team.

## Extensibility

- Adjust the prompt template to include KPI targets or mood indicators.
- Persist additional metadata (e.g., \`summary_version\`, \`qa_status\`) alongside \`ai_summary\` in \`team_daily_summaries\`.
- Pipe summaries into Slack or email notifications once stored.
`

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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Developer Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive guides and API references for SJ Marketing AI platform
        </p>
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
