

## Performance Analysis: `run-ai-agent` Chat Flow

### Root Causes Identified (in order of impact)

**1. Memory Retrieval — Calls `generate-embeddings` which makes an AI completion call (HIGH IMPACT)**

When `memory_enabled = true`, the chat flow calls `retrieve-agent-memories`, which in turn calls `generate-embeddings`. The `generate-embeddings` function asks an AI model to generate 1536 floating-point numbers as a chat completion — this is extremely slow and unreliable compared to a real embeddings API. This alone can add 5-15 seconds.

**2. Memory Extraction — Fire-and-forget but still heavy (MEDIUM IMPACT)**

After returning the response, the function calls `extract-agent-memories`, which fetches all messages, sends them to the AI for extraction, then calls `generate-embeddings` again for each extracted memory. While fire-and-forget, this creates background load that can slow subsequent requests.

**3. Sequential Database Operations in Frontend (MEDIUM IMPACT)**

The `useSendAgentMessage` hook performs 4 sequential operations:
1. Create conversation (if new) — DB roundtrip
2. Insert user message — DB roundtrip
3. Invoke `run-ai-agent` — the main slow call
4. Insert assistant message — DB roundtrip

Steps 1-2 and step 4 add latency around the already slow edge function call.

**4. Conversation History Fetch Inside Edge Function (LOW-MEDIUM)**

The edge function fetches up to 20 historical messages from `agent_messages`. Combined with the agent config fetch and auth check, this adds 2-3 DB roundtrips before the AI call even starts.

**5. `ai_agent_runs` Insert After Response (LOW)**

After getting the AI response, the function inserts a run record into `ai_agent_runs`. This is unnecessary for simple chat and adds latency before the response reaches the user.

---

### Proposed Optimizations

**Step 1: Replace fake embeddings with a lightweight model or disable semantic memory retrieval**

The `generate-embeddings` function currently asks an LLM to output 1536 numbers — this is the single biggest bottleneck. Two options:
- **Option A (Recommended):** Skip semantic search in `retrieve-agent-memories` and rely only on recency-based memory retrieval (removing the embedding call entirely). This eliminates the slowest part of the pipeline.
- **Option B:** Use a proper embeddings endpoint if one becomes available.

**Step 2: Parallelize pre-AI-call operations**

Currently the chat path does: fetch agent → fetch memory → fetch history → call AI. Instead, fetch memory and history in parallel using `Promise.all`.

**Step 3: Skip `ai_agent_runs` insert for chat messages**

Chat messages are already stored in `agent_messages`. The extra `ai_agent_runs` insert is redundant for the chat target and adds a DB roundtrip before returning. Remove it or make it fire-and-forget.

**Step 4: Conditionally skip memory for short conversations**

If a conversation has fewer than 3 messages, skip memory retrieval entirely — there's not enough context for memories to be meaningful yet.

**Step 5: Use a faster model for memory extraction**

Switch `extract-agent-memories` to use `google/gemini-2.5-flash-lite` instead of the default model, since extraction is a background task where speed matters more than quality.

---

### Expected Impact

| Optimization | Time Saved |
|---|---|
| Remove embedding-based memory search | 5-15 seconds |
| Parallelize DB queries | 1-2 seconds |
| Skip ai_agent_runs insert | 0.5-1 second |
| Total estimated improvement | **7-18 seconds faster** |

### Technical Changes

- **`supabase/functions/run-ai-agent/index.ts`** — Parallelize agent config + memory + history fetches; remove `ai_agent_runs` insert (or make fire-and-forget); add conversation length check before memory retrieval
- **`supabase/functions/retrieve-agent-memories/index.ts`** — Skip semantic search (embedding call); rely on recency-based retrieval only; or add a timeout/circuit-breaker around the embedding call
- **`supabase/functions/extract-agent-memories/index.ts`** — Switch to `gemini-2.5-flash-lite` model
- **`supabase/functions/generate-embeddings/index.ts`** — Add a fast timeout; improve fallback to always use hash-based embedding (skip the LLM call)

