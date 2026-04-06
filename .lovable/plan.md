

## Problem

Two issues are causing build errors and runtime failures:

1. **Missing `memory_enabled` column** on the `ai_agents` table — the `useAdminAIAgents` hook and the create-agent flow reference this column, but it does not exist in the database. This is the direct cause of the PGRST204 error when creating an agent.

2. **Missing `agent_conversations` and `agent_messages` tables** — the `useAgentConversations.ts` hook queries these tables, but they do not exist. This causes all the TypeScript errors about table names not being assignable.

## Plan

### Step 1: Add `memory_enabled` column to `ai_agents`

Run a database migration:
```sql
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN DEFAULT false;
```

This will immediately fix the PGRST204 error and allow agent creation from the management page.

### Step 2: Create `agent_conversations` and `agent_messages` tables

Run a migration to create the two missing tables that the chat system depends on:

- **`agent_conversations`** — stores per-user, per-agent conversation sessions (columns: id, agent_id, user_id, title, message_count, last_message_at, created_at, updated_at)
- **`agent_messages`** — stores individual messages within conversations (columns: id, conversation_id, role, content, created_at)

Both tables will have RLS enabled with policies allowing authenticated users to manage their own conversations and messages.

### Step 3: Fix TypeScript type alignment in `useAdminAIAgents.ts`

Make `memory_enabled` optional in the `AdminAIAgent` interface (use `?`) so the type cast doesn't conflict with the generated Supabase types. This resolves the four TS2352 errors.

### Step 4: Fix type casts in `useAgentConversations.ts`

Once the tables exist and types regenerate, the "excessively deep" and "table not assignable" errors will resolve automatically. If any remain, add explicit `as unknown as X` casts for safety.

### Step 5: Deploy edge functions

Redeploy `admin-users` and `run-ai-agent` to ensure the backend is aligned with the schema changes.

## Impact

- Fixes the agent creation error on `/adminpanel/ai/agent-management`
- Resolves all listed build errors
- No changes to existing data or frontend UI logic

