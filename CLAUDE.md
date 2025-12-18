# CLAUDE.md - AI Assistant Guide for SJ BD Dashboard

**Last Updated**: December 18, 2025

This document provides comprehensive guidance for AI assistants (like Claude) working on the SJ BD Dashboard codebase. It covers the codebase structure, development workflows, key conventions, and critical information needed to effectively contribute to this project.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Codebase Structure](#codebase-structure)
4. [Key Conventions](#key-conventions)
5. [Development Workflow](#development-workflow)
6. [Database Schema](#database-schema)
7. [API & Integrations](#api--integrations)
8. [Common Tasks](#common-tasks)
9. [Testing](#testing)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

**SJ BD Dashboard** is a comprehensive Business Development and CRM platform designed for managing deals, campaigns, clients, and integrations with external services like HubSpot (via Control Tower), LinkedIn, and AI-powered automation tools.

### Key Features

- **Deal Pipeline Management**: Track deals across stages (Prospecting → Qualification → Proposal → Negotiation → Clients)
- **Campaign Management**: Create and manage outreach campaigns with email sequences and LinkedIn automation
- **AI-Powered Automation**: Research, lead evaluation, content generation, and intelligent suggestions
- **Client Intelligence**: AI-driven client research and relationship management
- **Email Sequences**: Automated email campaigns with tracking and analytics
- **Document Signing**: PandaDoc integration for proposals and contracts
- **Control Tower Sync**: Bi-directional sync with HubSpot CRM
- **Analytics & Reporting**: Comprehensive performance tracking and KPI management
- **Role-Based Access**: Hierarchical permissions (team_member → manager → admin → super_admin)

---

## Tech Stack

### Frontend
- **Framework**: React 18.3+ with TypeScript 5.8+
- **Build Tool**: Vite 5.4+ with SWC (fast compilation)
- **Routing**: React Router DOM v6.30+
- **State Management**: TanStack Query (React Query) v5.83+ for server state
- **UI Components**: Radix UI + shadcn/ui components
- **Styling**: Tailwind CSS 3.4+ with custom design tokens
- **Rich Text**: TipTap editor
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts

### Backend
- **Platform**: Supabase (PostgreSQL + Edge Functions)
- **Edge Functions**: Deno runtime
- **Authentication**: Supabase Auth with JWT
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage

### Integrations
- **Control Tower**: HubSpot CRM integration
- **AI Services**: OpenAI, Perplexity, Anthropic
- **Email**: SendGrid
- **Documents**: PandaDoc
- **Research**: Exa.js
- **Email Validation**: ZeroBounce
- **Marketing**: GoHighLevel
- **Social**: LinkedIn API

### Development Tools
- **Package Manager**: npm/bun
- **Testing**: Bun test runner
- **Linting**: ESLint 9+ with TypeScript plugin
- **Type Checking**: TypeScript with strict mode (partially)

---

## Codebase Structure

```
/home/user/sj-bd-dashboard/
├── src/
│   ├── Api/                    # API layer for business logic
│   │   ├── adminCampaigns.ts  # Campaign CRUD operations
│   │   ├── aiAgents.ts        # AI agent management
│   │   ├── sequences.ts       # Email sequence operations
│   │   └── sqlExecutor.ts     # Admin SQL execution
│   │
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn/ui components (48 components)
│   │   ├── admin/            # Admin-specific components
│   │   ├── ai/               # AI-related components
│   │   ├── bd/               # Business development components
│   │   │   ├── cells/        # Table cell components
│   │   │   └── sequences/    # Email sequence components
│   │   ├── contact/          # Contact management components
│   │   ├── dashboard/        # Dashboard components
│   │   ├── documentation/    # Documentation rendering
│   │   ├── notifications/    # In-app notifications
│   │   ├── proposals/        # Proposal management
│   │   ├── signing/          # Document signing
│   │   ├── tasks/            # Task management
│   │   └── ...
│   │
│   ├── features/             # Feature modules (domain-specific)
│   │   ├── ai/              # AI agent features
│   │   │   └── agents/      # Agent configuration & history
│   │   ├── campaign-detail/ # Campaign analytics & insights
│   │   ├── collabai/        # CollabAI integration
│   │   ├── feedback/        # User feedback system
│   │   └── pipeline/        # Pipeline-specific features
│   │
│   ├── hooks/               # Custom React hooks (90+ hooks)
│   │   ├── useAuth.tsx      # Authentication & authorization
│   │   ├── useBDCampaigns.tsx  # Campaign management
│   │   ├── useDeals.tsx     # Deal operations
│   │   ├── useControlTowerHealth.tsx  # Health monitoring
│   │   ├── useSequences.tsx # Email sequences
│   │   └── ...
│   │
│   ├── integrations/        # External service integrations
│   │   ├── supabase/        # Supabase client & types
│   │   │   ├── client.ts    # Supabase client config
│   │   │   └── types.ts     # Database types (5163 lines)
│   │   └── controlTower/    # Control Tower integration
│   │       ├── client.ts    # Dynamic client factory
│   │       └── restApiClient.ts  # REST API client
│   │
│   ├── pages/               # Page components
│   │   ├── admin/           # Admin panel pages
│   │   ├── analytics/       # Analytics pages
│   │   ├── bd/              # Business development pages
│   │   │   └── pipeline/    # Pipeline stage pages
│   │   ├── feedback/        # Feedback pages
│   │   └── my-agents/       # AI agent management
│   │
│   ├── lib/                 # Shared libraries
│   │   ├── utils.ts         # Utility functions (cn, etc.)
│   │   ├── axiosPrivate.ts  # Authenticated HTTP client
│   │   └── dealStages.ts    # Deal stage constants
│   │
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── data/                # Static data
│   ├── App.tsx              # Main app component with routing
│   └── main.tsx             # Entry point
│
├── supabase/
│   ├── functions/           # Edge Functions (60+ functions)
│   │   ├── admin-campaigns/ # Campaign operations
│   │   ├── run-ai-agent/   # AI agent execution
│   │   ├── send-campaign-email/  # Email sending
│   │   ├── sync-control-tower-full/  # HubSpot sync
│   │   ├── pandadoc-manage/  # Document signing
│   │   └── ...
│   └── migrations/          # Database migrations
│
├── tests/                   # Test files
│   ├── CampaignManagement.test.tsx
│   ├── useBDCampaigns.test.tsx
│   └── setup.ts
│
├── docs/                    # Documentation
│   └── migrations/          # Migration guides
│
├── public/                  # Public assets
│   └── adminpanel/documentation/  # In-app documentation
│
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind configuration
└── .env                     # Environment variables
```

### Key File Locations

| Purpose | Location |
|---------|----------|
| Main routing | `src/App.tsx` |
| Authentication | `src/hooks/useAuth.tsx` |
| Database types | `src/integrations/supabase/types.ts` |
| Supabase client | `src/integrations/supabase/client.ts` |
| HTTP client | `src/lib/axiosPrivate.ts` |
| UI components | `src/components/ui/` |
| Custom hooks | `src/hooks/` |
| Edge Functions | `supabase/functions/` |
| Tests | `tests/` |

---

## Key Conventions

### File Naming

- **Components**: PascalCase (e.g., `CampaignManagement.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useBDCampaigns.tsx`)
- **Utilities**: camelCase (e.g., `axiosPrivate.ts`)
- **Types**: PascalCase (e.g., `types.ts` with PascalCase exports)
- **Constants**: SCREAMING_SNAKE_CASE or camelCase

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **Imports**: Use `@/` alias for imports from `src/` (e.g., `import { Button } from "@/components/ui/button"`)
- **Components**: Functional components with hooks
- **Props**: Use TypeScript interfaces for props
- **Error Handling**: Use try-catch with toast notifications
- **Async/Await**: Prefer async/await over promises

### React Patterns

```typescript
// ✅ Good: Use custom hooks for data fetching
function MyComponent() {
  const { data, isLoading, error } = useBDCampaigns();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{/* Render data */}</div>;
}

// ✅ Good: Use TanStack Query for mutations
const mutation = useMutation({
  mutationFn: async (data) => {
    // API call
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    toast({ title: "Success!" });
  },
  onError: (error) => {
    toast({ title: "Error", description: error.message, variant: "destructive" });
  }
});

// ✅ Good: Use Zod for form validation
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email")
});
```

### Database Queries

```typescript
// ✅ Good: Use Supabase client with proper error handling
const { data, error } = await supabase
  .from('campaigns')
  .select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false });

if (error) throw error;

// ✅ Good: Use RPC for complex operations
const { data, error } = await supabase.rpc('calculate_campaign_roi', {
  campaign_id: campaignId
});
```

### API Calls

```typescript
// ✅ Good: Use axiosPrivate for authenticated requests
import { axiosPrivate } from '@/lib/axiosPrivate';

const response = await axiosPrivate.post('/api/admin/campaigns', data);

// ✅ Good: Use Supabase Edge Functions
const { data, error } = await supabase.functions.invoke('run-ai-agent', {
  body: { agentId, prompt }
});
```

### Component Organization

```typescript
// ✅ Good: Organize component structure
import React from 'react';
import { useQuery } from '@tanstack/react-query';
// ... other imports

interface MyComponentProps {
  id: string;
  onUpdate?: () => void;
}

export function MyComponent({ id, onUpdate }: MyComponentProps) {
  // 1. Hooks
  const { data } = useQuery({ /* ... */ });
  const [state, setState] = useState();

  // 2. Effects
  useEffect(() => {
    // ...
  }, []);

  // 3. Handlers
  const handleClick = () => {
    // ...
  };

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

---

## Development Workflow

### Setup

```bash
# Clone repository
git clone <repo-url>
cd sj-bd-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Server runs at http://localhost:8080
```

### Environment Variables

Required in `.env`:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
PERPLEXITY_API_KEY=your_perplexity_api_key
```

### Git Workflow

**CRITICAL**: Always work on feature branches with the `claude/` prefix matching the session ID.

```bash
# Current branch for this session
git checkout claude/add-claude-documentation-srOu1

# Make changes
git add .
git commit -m "feat: Add comprehensive CLAUDE.md documentation"

# Push to remote (MUST use -u flag and correct branch name)
git push -u origin claude/add-claude-documentation-srOu1

# Retry on network errors with exponential backoff
# If push fails: wait 2s, retry; wait 4s, retry; wait 8s, retry; wait 16s, retry
```

**Important Git Rules**:
- ✅ Branch names MUST start with `claude/` and end with session ID
- ✅ Always use `git push -u origin <branch-name>`
- ✅ Retry failed pushes up to 4 times with exponential backoff
- ✅ Fetch specific branches: `git fetch origin <branch-name>`
- ❌ Never push to `main` or `master` directly
- ❌ Never force push without explicit permission

### Commit Messages

Follow conventional commits:

```bash
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Refactor code
test: Add tests
chore: Update dependencies
```

### Creating Pull Requests

```bash
# 1. Check git status and diff
git status
git diff main...HEAD

# 2. Push to remote
git push -u origin <branch-name>

# 3. Create PR using GitHub CLI
gh pr create --title "feat: Description" --body "$(cat <<'EOF'
## Summary
- Bullet point 1
- Bullet point 2

## Test plan
- [ ] Test 1
- [ ] Test 2
EOF
)"
```

---

## Database Schema

### Core Tables (117 total)

#### User & Authentication
- `profiles` - User profile information
- `users` - Extended user data
- `user_roles` - Role assignments (team_member, manager, admin, super_admin)
- `user_permissions` - Fine-grained permissions
- `user_notifications` - In-app notifications

#### Business Development
- `bd_campaigns` - Marketing/outreach campaigns
- `campaign_contacts` - Contacts in campaigns
- `campaign_contact_status_history` - Status tracking
- `campaign_emails` - Email templates
- `campaign_sequences` - Email automation
- `sequence_steps` - Sequence step definitions
- `sequence_execution_log` - Execution tracking
- `contact_sequence_enrollments` - Enrollment status

#### Deal Management
- `deals` - Deal/opportunity records
- `deal_comments` - Discussion threads
- `deal_files` - Document attachments
- `deal_checklist_items` - Progression checklists
- `leads` - Lead records

#### Client Management
- `clients` - Client/company records
- `contacts` - Contact persons
- `employees` - Employee records

#### AI & Automation
- `ai_agents` - AI agent configurations
- `ai_agent_runs` - Execution history
- `ai_agent_templates` - Reusable templates
- `collabai_agents` - CollabAI integrations
- `collabai_conversations` - Chat history

#### Integrations
- `control_tower_sync_log` - Sync logs
- `control_tower_health_snapshots` - Health metrics
- `pandadoc_integrations` - Document signing
- `signing_documents` - Document tracking
- `gohighlevel_integrations` - GHL configs
- `zerobounce_config` - Email validation

### Key Relationships

```
campaigns (1) ──> (N) campaign_contacts
campaign_contacts (1) ──> (N) contact_sequence_enrollments
campaigns (1) ──> (N) campaign_sequences
campaign_sequences (1) ──> (N) sequence_steps
deals (1) ──> (N) deal_comments
deals (1) ──> (N) deal_files
deals (1) ──> (N) deal_checklist_items
clients (1) ──> (N) deals
users (1) ──> (N) deals (assignee)
```

### Database Access Patterns

```typescript
// ✅ Use TanStack Query for caching
const { data: campaigns } = useQuery({
  queryKey: ['campaigns'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('bd_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
});

// ✅ Use optimistic updates
const mutation = useMutation({
  mutationFn: updateCampaign,
  onMutate: async (newCampaign) => {
    await queryClient.cancelQueries({ queryKey: ['campaigns'] });
    const previous = queryClient.getQueryData(['campaigns']);
    queryClient.setQueryData(['campaigns'], (old) => [...old, newCampaign]);
    return { previous };
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['campaigns'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
  }
});
```

---

## API & Integrations

### Supabase Edge Functions

**Base URL**: `https://your-project.supabase.co/functions/v1/`

#### Key Functions

| Function | Purpose | Parameters |
|----------|---------|------------|
| `run-ai-agent` | Execute AI agents | `{ agentId, prompt, context }` |
| `admin-campaigns` | Campaign CRUD | `{ action, data }` |
| `send-campaign-email` | Send emails | `{ contactId, templateId }` |
| `sync-control-tower-full` | Full HubSpot sync | `{ force }` |
| `sync-control-tower-deals` | Sync deals | `{ dealIds }` |
| `pandadoc-manage` | Document operations | `{ action, documentId }` |
| `campaign-lead-import` | Import leads | `{ campaignId, leads }` |
| `generate-followup-suggestions` | AI suggestions | `{ dealId }` |

**Invocation Pattern**:

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { /* parameters */ }
});

if (error) throw error;
```

### Control Tower Integration

**Purpose**: Bi-directional sync with HubSpot CRM

**Key Operations**:
- Full sync: `sync-control-tower-full`
- Deal sync: `sync-control-tower-deals`
- Employee sync: `sync-control-tower-employees`
- Client sync: `sync-control-tower-clients-api`
- Health monitoring: `monitor-control-tower-health`

**REST API Client**: `src/integrations/controlTower/restApiClient.ts`

```typescript
import { controlTowerRestApiClient } from '@/integrations/controlTower/restApiClient';

// Fetch deals
const deals = await controlTowerRestApiClient.getDeals();

// Push deal to HubSpot
await controlTowerRestApiClient.pushDeal(dealData);
```

### AI Services

**OpenAI**: Used for research, content generation, embeddings
**Perplexity**: Used for advanced research queries
**Anthropic**: Used for complex reasoning tasks

**Provider Chain**: Edge Functions use a fallback chain (OpenAI → Perplexity → Anthropic)

---

## Common Tasks

### 1. Adding a New Page

```typescript
// 1. Create page component in src/pages/
// src/pages/MyNewPage.tsx
export default function MyNewPage() {
  return <div>My New Page</div>;
}

// 2. Add route in src/App.tsx
import MyNewPage from './pages/MyNewPage';

// In Routes:
<Route path="/my-new-page" element={
  <ProtectedRoute requiredMinimumRole="team_member">
    <Layout />
  </ProtectedRoute>
}>
  <Route index element={<MyNewPage />} />
</Route>
```

### 2. Creating a Custom Hook

```typescript
// src/hooks/useMyData.tsx
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('my_table')
        .select('*');
      if (error) throw error;
      return data;
    }
  });
}
```

### 3. Adding a Database Table

```sql
-- Create migration in supabase/migrations/
-- 20251218000000_add_my_table.sql

CREATE TABLE my_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON my_table FOR SELECT
  USING (auth.uid() = user_id);

-- Update types: supabase gen types typescript --local > src/integrations/supabase/types.ts
```

### 4. Adding an Edge Function

```bash
# Create function
supabase functions new my-function

# Edit supabase/functions/my-function/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { param } = await req.json();
    // Logic here
    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### 5. Adding UI Components

```typescript
// Use existing shadcn components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Or create custom component
// src/components/MyComponent.tsx
export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

---

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test
npm run test CampaignManagement.test.tsx
```

### Test Structure

```typescript
// tests/MyComponent.test.tsx
import { describe, it, expect } from 'bun:test';
import { render } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeDefined();
  });
});
```

### Key Test Files
- `tests/CampaignManagement.test.tsx` - Campaign page tests
- `tests/useBDCampaigns.test.tsx` - Hook behavior tests
- `tests/axiosPrivate.test.ts` - HTTP client tests

---

## Deployment

### Build

```bash
# Production build
npm run build

# Development build
npm run build:dev

# Preview build
npm run preview
```

### Deployment via Lovable

1. Open [Lovable Project](https://lovable.dev/projects/75f1f847-1a59-4bd3-9eb9-780955a7d4bf)
2. Click Share → Publish
3. Follow prompts

### Manual Deployment

```bash
# Build
npm run build

# Deploy dist/ folder to hosting provider
# (Vercel, Netlify, etc.)
```

### Supabase Functions Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name
```

---

## Troubleshooting

### Common Issues

#### 1. TypeScript Errors

```bash
# Regenerate database types
supabase gen types typescript --local > src/integrations/supabase/types.ts

# Clear TypeScript cache
rm -rf node_modules/.vite
npm run dev
```

#### 2. Supabase Connection Issues

- Check `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Verify network connectivity
- Check Supabase dashboard for service status

#### 3. Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 4. Authentication Issues

- Clear browser storage
- Check user roles in `user_roles` table
- Verify RLS policies in Supabase

#### 5. Control Tower Sync Issues

- Check health status: `/adminpanel/data-sync`
- Review sync logs in `control_tower_sync_log`
- Verify Control Tower API credentials

---

## Additional Resources

### Documentation Files
- `ARCHITECTURE.md` - Technical architecture details
- `DEVELOPMENT_GUIDE.md` - Development workflows
- `AGENTS.md` - AI agent development guide
- `docs/` - Feature-specific documentation
- `public/adminpanel/documentation/` - In-app documentation

### Related Files
- Many `.md` files in root with specific deployment and feature guides
- `docs/migrations/` - Database migration guides
- Test files for examples of component usage

### External Links
- [Lovable Project](https://lovable.dev/projects/75f1f847-1a59-4bd3-9eb9-780955a7d4bf)
- [Supabase Docs](https://supabase.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [shadcn/ui](https://ui.shadcn.com)

---

## Quick Reference

### Most Used Hooks
- `useAuth()` - Authentication
- `useBDCampaigns()` - Campaigns
- `useDeals()` - Deals
- `useSequences()` - Email sequences
- `useControlTowerHealth()` - Sync health

### Most Used Components
- `<Button />` - Buttons
- `<Card />` - Cards
- `<Dialog />` - Modals
- `<Table />` - Tables
- `<Form />` - Forms

### Most Used Utilities
- `cn()` - Tailwind class merging
- `axiosPrivate` - Authenticated HTTP
- `supabase` - Database client
- `toast()` - Notifications

---

**Remember**: Always read existing code before modifying. Use TypeScript. Test your changes. Follow git workflow. Ask for clarification when needed.

For AI assistants: This codebase is actively developed. Always check for recent changes and maintain consistency with existing patterns.
