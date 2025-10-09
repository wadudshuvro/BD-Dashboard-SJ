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
