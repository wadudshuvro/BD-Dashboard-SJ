-- AI Chat & Memory System: agent_conversations, agent_messages, agent_memories, user_agent_personalizations
-- and extra ai_agents columns for chat/memory

-- Optional: ensure pgvector is available for agent_memories
CREATE EXTENSION IF NOT EXISTS vector;

-- Add chat/memory columns to ai_agents (idempotent)
ALTER TABLE public.ai_agents
  ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS provider_config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS avatar VARCHAR(255),
  ADD COLUMN IF NOT EXISTS welcome_message TEXT,
  ADD COLUMN IF NOT EXISTS conversation_starters JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Ensure slug is unique for ai_agents (may already exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_agents_slug_unique ON public.ai_agents(slug) WHERE slug IS NOT NULL;

-- agent_conversations: one per user per agent thread
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  summary TEXT,
  is_archived BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_user ON public.agent_conversations(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_user ON public.agent_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversations_last_message ON public.agent_conversations(last_message_at DESC NULLS LAST);

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.agent_conversations;
CREATE POLICY "Users can view their own conversations" ON public.agent_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can create conversations" ON public.agent_conversations;
CREATE POLICY "Users can create conversations" ON public.agent_conversations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.agent_conversations;
CREATE POLICY "Users can update their own conversations" ON public.agent_conversations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.agent_conversations;
CREATE POLICY "Users can delete their own conversations" ON public.agent_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.agent_conversations;
CREATE POLICY "Admins can view all conversations" ON public.agent_conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- agent_messages: messages inside a conversation
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  model_used VARCHAR(100),
  provider_used VARCHAR(50),
  tokens_input INTEGER,
  tokens_output INTEGER,
  latency_ms INTEGER,
  tool_calls JSONB,
  tool_results JSONB,
  citations JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON public.agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON public.agent_messages(conversation_id, created_at);

ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.agent_messages;
CREATE POLICY "Users can view messages in their conversations" ON public.agent_messages FOR SELECT TO authenticated
  USING (conversation_id IN (SELECT id FROM public.agent_conversations WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON public.agent_messages;
CREATE POLICY "Users can create messages in their conversations" ON public.agent_messages FOR INSERT TO authenticated
  WITH CHECK (conversation_id IN (SELECT id FROM public.agent_conversations WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Admins can view all messages" ON public.agent_messages;
CREATE POLICY "Admins can view all messages" ON public.agent_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- Trigger: update conversation stats on new message
CREATE OR REPLACE FUNCTION public.update_conversation_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.agent_conversations
  SET message_count = message_count + 1, last_message_at = NEW.created_at, updated_at = now()
  WHERE id = NEW.conversation_id;
  UPDATE public.ai_agents
  SET usage_count = COALESCE(usage_count, 0) + 1
  WHERE id = (SELECT agent_id FROM public.agent_conversations WHERE id = NEW.conversation_id)
  AND NEW.role = 'user';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_conversation_stats_on_message ON public.agent_messages;
CREATE TRIGGER update_conversation_stats_on_message
  AFTER INSERT ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_stats();

-- Trigger: auto title from first user message
CREATE OR REPLACE FUNCTION public.generate_conversation_title()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'user' THEN
    UPDATE public.agent_conversations
    SET title = CASE
      WHEN title IS NULL OR title = '' THEN LEFT(NEW.content, 100) || CASE WHEN LENGTH(NEW.content) > 100 THEN '...' ELSE '' END
      ELSE title
    END
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_generate_conversation_title ON public.agent_messages;
CREATE TRIGGER auto_generate_conversation_title
  AFTER INSERT ON public.agent_messages
  FOR EACH ROW EXECUTE FUNCTION public.generate_conversation_title();

-- agent_memories: vector-backed per-user, per-agent memories
CREATE TABLE IF NOT EXISTS public.agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL DEFAULT 'short_term' CHECK (memory_type IN ('short_term', 'long_term', 'episodic', 'semantic')),
  memory_category TEXT CHECK (memory_category IN ('fact', 'preference', 'summary', 'decision', 'pattern')),
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(1536),
  source_type TEXT DEFAULT 'conversation',
  source_id UUID,
  importance_score FLOAT DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  consolidated BOOLEAN DEFAULT false,
  superseded_by UUID REFERENCES public.agent_memories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent_user ON public.agent_memories(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memories_active ON public.agent_memories(agent_id, user_id, is_active) WHERE is_active = true;

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memories" ON public.agent_memories;
CREATE POLICY "Users can view own memories" ON public.agent_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role can manage memories" ON public.agent_memories;
CREATE POLICY "Service role can manage memories" ON public.agent_memories FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- user_agent_personalizations: per-user extra prompt per agent
CREATE TABLE IF NOT EXISTS public.user_agent_personalizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  is_enabled BOOLEAN DEFAULT true,
  additional_prompt TEXT,
  attached_knowledge_files UUID[] DEFAULT '{}',
  use_all_knowledge BOOLEAN DEFAULT false,
  max_context_files INTEGER DEFAULT 5,
  relevance_threshold NUMERIC DEFAULT 0.7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, agent_id)
);

ALTER TABLE public.user_agent_personalizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own personalizations" ON public.user_agent_personalizations;
CREATE POLICY "Users can manage their own personalizations" ON public.user_agent_personalizations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins can manage all personalizations" ON public.user_agent_personalizations;
CREATE POLICY "Admins can manage all personalizations" ON public.user_agent_personalizations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER update_user_agent_personalizations_updated_at
  BEFORE UPDATE ON public.user_agent_personalizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RPC for memory retrieval (vector similarity) - used by retrieve-agent-memories
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
  p_agent_id UUID,
  p_user_id UUID,
  p_embedding vector(1536),
  p_limit INT DEFAULT 5,
  p_similarity_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  memory_category TEXT,
  importance_score FLOAT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.content,
    m.memory_category,
    m.importance_score,
    (1 - (m.embedding <=> p_embedding))::FLOAT AS similarity
  FROM public.agent_memories m
  WHERE m.agent_id = p_agent_id
    AND m.user_id = p_user_id
    AND m.is_active = true
    AND m.embedding IS NOT NULL
    AND (1 - (m.embedding <=> p_embedding)) >= p_similarity_threshold
  ORDER BY m.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$;

-- RPC to increment memory access stats
CREATE OR REPLACE FUNCTION public.increment_memory_access(memory_ids UUID[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.agent_memories
  SET access_count = access_count + 1, last_accessed_at = now()
  WHERE id = ANY(memory_ids);
END;
$$;
