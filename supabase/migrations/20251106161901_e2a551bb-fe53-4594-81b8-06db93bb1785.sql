-- Create conversations table
CREATE TABLE collabai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  integration_id UUID NOT NULL REFERENCES collabai_integrations(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE collabai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES collabai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_user ON collabai_conversations(user_id);
CREATE INDEX idx_conversations_agent ON collabai_conversations(agent_id);
CREATE INDEX idx_messages_conversation ON collabai_messages(conversation_id);

-- Enable RLS
ALTER TABLE collabai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE collabai_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can manage their conversations" 
ON collabai_conversations
FOR ALL 
USING (auth.uid() = user_id);

-- RLS Policies for messages
CREATE POLICY "Users can manage their messages" 
ON collabai_messages
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM collabai_conversations
    WHERE id = conversation_id AND user_id = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_collabai_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_collabai_conversations_updated_at
BEFORE UPDATE ON collabai_conversations
FOR EACH ROW
EXECUTE FUNCTION update_collabai_conversations_updated_at();