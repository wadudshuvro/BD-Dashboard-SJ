
-- Create agent_memories table
CREATE TABLE public.agent_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memory_type TEXT NOT NULL DEFAULT 'short_term',
  memory_category TEXT NOT NULL DEFAULT 'fact',
  content TEXT NOT NULL,
  summary TEXT,
  embedding extensions.vector(1536),
  source_type TEXT DEFAULT 'conversation',
  source_id UUID,
  importance_score FLOAT DEFAULT 0.5,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  consolidated BOOLEAN DEFAULT false,
  superseded_by UUID REFERENCES public.agent_memories(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_agent_memories_agent_user ON public.agent_memories(agent_id, user_id);
CREATE INDEX idx_agent_memories_active ON public.agent_memories(is_active) WHERE is_active = true;

-- Add missing columns to agent_conversations
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE public.agent_conversations ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add missing columns to agent_messages
ALTER TABLE public.agent_messages ADD COLUMN IF NOT EXISTS model_used TEXT;
ALTER TABLE public.agent_messages ADD COLUMN IF NOT EXISTS tokens_input INTEGER;
ALTER TABLE public.agent_messages ADD COLUMN IF NOT EXISTS tokens_output INTEGER;
ALTER TABLE public.agent_messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER;

-- Enable RLS
ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memories" ON public.agent_memories
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own memories" ON public.agent_memories
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own memories" ON public.agent_memories
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Service role full access memories" ON public.agent_memories
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Function: get_relevant_memories
CREATE OR REPLACE FUNCTION public.get_relevant_memories(
  p_agent_id UUID, p_user_id UUID, p_embedding extensions.vector,
  p_match_count INTEGER DEFAULT 5, p_match_threshold FLOAT DEFAULT 0.5
)
RETURNS TABLE(id UUID, content TEXT, memory_category TEXT, memory_type TEXT, importance_score FLOAT, similarity FLOAT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'public, extensions'
AS $$
BEGIN
  RETURN QUERY
  SELECT am.id, am.content, am.memory_category, am.memory_type, am.importance_score,
    (1 - (am.embedding OPERATOR(extensions.<=>) p_embedding))::FLOAT AS similarity
  FROM public.agent_memories am
  WHERE am.agent_id = p_agent_id AND am.user_id = p_user_id AND am.is_active = true AND am.embedding IS NOT NULL
    AND (1 - (am.embedding OPERATOR(extensions.<=>) p_embedding)) > p_match_threshold
  ORDER BY am.embedding OPERATOR(extensions.<=>) p_embedding
  LIMIT p_match_count;
END;
$$;

-- Function: increment_memory_access
CREATE OR REPLACE FUNCTION public.increment_memory_access(p_memory_ids UUID[])
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.agent_memories SET access_count = access_count + 1, last_accessed_at = now() WHERE id = ANY(p_memory_ids);
END;
$$;

-- Function: consolidate short_term to long_term
CREATE OR REPLACE FUNCTION public.consolidate_short_term_memories(p_agent_id UUID, p_user_id UUID, p_days_old INTEGER DEFAULT 7)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.agent_memories SET memory_type = 'long_term', consolidated = true, updated_at = now()
  WHERE agent_id = p_agent_id AND user_id = p_user_id AND memory_type = 'short_term' AND is_active = true
    AND access_count > 0 AND importance_score >= 0.3 AND created_at < now() - (p_days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Function: prune stale memories
CREATE OR REPLACE FUNCTION public.prune_short_term_memories(p_agent_id UUID, p_user_id UUID, p_days_old INTEGER DEFAULT 30, p_importance_threshold FLOAT DEFAULT 0.2)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_count INTEGER;
BEGIN
  UPDATE public.agent_memories SET is_active = false, updated_at = now()
  WHERE agent_id = p_agent_id AND user_id = p_user_id AND memory_type = 'short_term' AND is_active = true
    AND access_count = 0 AND importance_score < p_importance_threshold AND created_at < now() - (p_days_old || ' days')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Trigger: update conversation stats on new message
CREATE OR REPLACE FUNCTION public.update_conversation_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.agent_conversations
  SET message_count = (SELECT COUNT(*) FROM public.agent_messages WHERE conversation_id = NEW.conversation_id),
      last_message_at = now(), updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_conversation_stats ON public.agent_messages;
CREATE TRIGGER trg_update_conversation_stats AFTER INSERT ON public.agent_messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_stats();

-- Trigger: auto-set conversation title from first user message
CREATE OR REPLACE FUNCTION public.auto_set_conversation_title()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE v_existing_title TEXT;
BEGIN
  IF NEW.role = 'user' THEN
    SELECT title INTO v_existing_title FROM public.agent_conversations WHERE id = NEW.conversation_id;
    IF v_existing_title IS NULL THEN
      UPDATE public.agent_conversations SET title = LEFT(NEW.content, 80) WHERE id = NEW.conversation_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_set_conversation_title ON public.agent_messages;
CREATE TRIGGER trg_auto_set_conversation_title AFTER INSERT ON public.agent_messages FOR EACH ROW EXECUTE FUNCTION public.auto_set_conversation_title();

-- Updated_at trigger for agent_memories
DROP TRIGGER IF EXISTS trg_update_agent_memories_updated_at ON public.agent_memories;
CREATE TRIGGER trg_update_agent_memories_updated_at BEFORE UPDATE ON public.agent_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
