import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const AI_QUERY_KEYS = {
  agents: ["ai", "admin", "agents"] as const,
  agent: (id: string) => ["ai", "admin", "agent", id] as const,
  runs: (agentId?: string) => ["ai", "admin", "runs", agentId ?? "all"] as const,
};

export interface AdminAIAgent {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string | null;
  system_prompt: string | null;
  prompt_template: string | null;
  config: Record<string, unknown> | null;
  is_active: boolean | null;
  is_enabled: boolean | null;
  memory_enabled?: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentRunRow {
  id: string;
  agent_id: string | null;
  executed_by: string | null;
  status: string | null;
  input: unknown;
  output: unknown;
  created_at: string;
  provider_chain?: { latency_ms?: number; token_usage?: Record<string, number> };
}

export function useAdminAIAgents() {
  return useQuery({
    queryKey: AI_QUERY_KEYS.agents,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AdminAIAgent[];
    },
  });
}

export function useAgentRunsForUser(agentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: AI_QUERY_KEYS.runs(agentId),
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase
        .from("ai_agent_runs")
        .select("*")
        .eq("executed_by", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (agentId) q = q.eq("agent_id", agentId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as AgentRunRow[];
    },
    enabled: !!user?.id,
  });
}

export function useRunAgentChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ agentId, input }: { agentId: string; input: string }) => {
      const { data, error } = await supabase.functions.invoke<{
        run_id?: string;
        status?: string;
        output?: string;
        token_usage?: Record<string, number>;
        latency_ms?: number;
        error?: string;
      }>("run-ai-agent", {
        body: { target: "chat", agent_id: agentId, input: input.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai", "admin", "runs"] });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agents });
    },
  });
}

export function useCreateAdminAgent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      slug?: string | null;
      description?: string | null;
      category?: string | null;
      system_prompt: string;
      is_enabled?: boolean;
      memory_enabled?: boolean;
    }) => {
      const slug = payload.slug ?? payload.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { data, error } = await supabase
        .from("ai_agents")
        .insert({
          name: payload.name,
          slug,
          description: payload.description ?? null,
          category: payload.category ?? "general",
          system_prompt: payload.system_prompt,
          prompt_template: payload.system_prompt,
          is_active: payload.is_enabled ?? true,
          is_enabled: payload.is_enabled ?? true,
          memory_enabled: payload.memory_enabled ?? false,
          created_by: user?.id ?? null,
          type: "general",
          config: {},
        })
        .select()
        .single();
      if (error) throw error;
      return data as AdminAIAgent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agents });
    },
  });
}

export function useUpdateAdminAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      system_prompt,
      ...rest
    }: Partial<AdminAIAgent> & { id: string }) => {
      const payload: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
      if (system_prompt !== undefined) {
        payload.system_prompt = system_prompt;
        payload.prompt_template = system_prompt;
      }
      const { data, error } = await supabase
        .from("ai_agents")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AdminAIAgent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agent(variables.id) });
    },
  });
}

export function useToggleAdminAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { data, error } = await supabase
        .from("ai_agents")
        .update({ is_enabled, is_active: is_enabled })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as AdminAIAgent;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agents });
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agent(variables.id) });
    },
  });
}

export function useDeleteAdminAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ai_agents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_QUERY_KEYS.agents });
    },
  });
}
