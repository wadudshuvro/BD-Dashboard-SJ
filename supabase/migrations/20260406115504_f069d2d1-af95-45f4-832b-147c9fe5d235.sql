
ALTER TABLE public.ai_agents ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN DEFAULT false;

-- Create agent_conversations table
CREATE TABLE IF NOT EXISTS public.agent_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create agent_messages table
CREATE TABLE IF NOT EXISTS public.agent_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_conversations_agent_user ON public.agent_conversations(agent_id, user_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_conversation ON public.agent_messages(conversation_id);

-- Enable RLS
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for agent_conversations
CREATE POLICY "Users can view own conversations" ON public.agent_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.agent_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.agent_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.agent_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for agent_messages (via conversation ownership)
CREATE POLICY "Users can view own conversation messages" ON public.agent_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.agent_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert into own conversations" ON public.agent_messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.agent_conversations WHERE id = conversation_id AND user_id = auth.uid())
  );

-- Updated_at trigger for conversations
CREATE TRIGGER update_agent_conversations_updated_at
  BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
