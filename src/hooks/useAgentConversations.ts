import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const AGENT_CHAT_KEYS = {
  conversations: (agentId: string) => ["ai", "chat", "conversations", agentId] as const,
  messages: (conversationId: string) => ["ai", "chat", "messages", conversationId] as const,
};

export interface AgentConversation {
  id: string;
  agent_id: string;
  user_id: string;
  title: string | null;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
}

export function useAgentConversations(agentId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: AGENT_CHAT_KEYS.conversations(agentId ?? ""),
    queryFn: async () => {
      if (!agentId || !user?.id) return [];
      const { data, error } = await supabase
        .from("agent_conversations")
        .select("*")
        .eq("agent_id", agentId)
        .eq("user_id", user.id)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as AgentConversation[];
    },
    enabled: !!agentId && !!user?.id,
  });
}

export function useAgentMessages(conversationId: string | null) {
  return useQuery({
    queryKey: AGENT_CHAT_KEYS.messages(conversationId ?? ""),
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("agent_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as AgentMessage[];
    },
    enabled: !!conversationId,
  });
}

export function useCreateAgentConversation(agentId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!agentId || !user?.id) throw new Error("Missing agent or user");
      const { data, error } = await supabase
        .from("agent_conversations")
        .insert({ agent_id: agentId, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as AgentConversation;
    },
    onSuccess: (_, __, context) => {
      if (context?.agentId) {
        queryClient.invalidateQueries({ queryKey: AGENT_CHAT_KEYS.conversations(context.agentId) });
      }
    },
  });
}

export function useSendAgentMessage(agentId: string, conversationId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user?.id) throw new Error("Not authenticated");
      let convId = conversationId;
      if (!convId) {
        const { data: conv, error: convErr } = await supabase
          .from("agent_conversations")
          .insert({ agent_id: agentId, user_id: user.id })
          .select()
          .single();
        if (convErr) throw convErr;
        convId = (conv as AgentConversation).id;
      }
      const { error: userMsgErr } = await supabase
        .from("agent_messages")
        .insert({ conversation_id: convId, role: "user", content });
      if (userMsgErr) throw userMsgErr;

      const { data, error } = await supabase.functions.invoke<{
        output?: string;
        error?: string;
      }>("run-ai-agent", {
        body: {
          target: "chat",
          agent_id: agentId,
          input: content,
          conversation_id: convId,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const output = data?.output ?? "";

      const { error: insertErr } = await supabase.from("agent_messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: output,
      });
      if (insertErr) throw insertErr;

      return { conversationId: convId, output };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: AGENT_CHAT_KEYS.conversations(agentId) });
      queryClient.invalidateQueries({ queryKey: AGENT_CHAT_KEYS.messages(result.conversationId) });
    },
  });
}
