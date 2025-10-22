import { supabase } from "@/integrations/supabase/client";

export interface AgentConfigFeatures {
  enableResearch?: boolean;
  enableTelemetry?: boolean;
}

export interface AgentProviderConfig {
  provider: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AgentConfigurationEnvelope {
  providers?: {
    primary?: AgentProviderConfig;
    fallback?: AgentProviderConfig;
    research?: AgentProviderConfig;
  };
  features?: AgentConfigFeatures;
}

export interface AIAgent {
  id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  category?: string | null;
  type?: string | null;
  config: AgentConfigurationEnvelope;
  is_active?: boolean;
  is_enabled?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AgentRunPayload {
  agent_id: string;
  execution_context: {
    timeframe?: string;
    filters?: Record<string, unknown>;
    office_ids?: string[];
    user_id: string;
  };
}

export interface AgentRunResponse {
  success: boolean;
  run_id: string;
  summary: string;
  findings: string[];
  recommendations: string[];
  action_items: Array<Record<string, unknown>>;
  telemetry: Array<Record<string, unknown>>;
}

export interface AgentRunHistoryRow {
  id: string;
  created_at: string;
  status: string;
  output: any;
  ai_summary: any;
  agent_id: string | null;
}

function handleError<T>(error: { message?: string } | null, fallbackMessage: string): asserts error is null {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function listAgents(): Promise<AIAgent[]> {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("id, name, description, category, slug, config, is_enabled, created_by, created_at, updated_at")
    .order("name", { ascending: true });

  handleError(error, "Unable to fetch AI agents");
  return (data ?? []).map((agent) => ({
    ...agent,
    type: agent.type ?? agent.category ?? null,
    is_active: agent.is_active ?? agent.is_enabled ?? true,
    config: (agent.config as AgentConfigurationEnvelope) || {},
  }));
}

export async function updateAgentConfig(
  agentId: string,
  config: AgentConfigurationEnvelope,
): Promise<AIAgent> {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ config: config as any })
    .eq("id", agentId)
    .select("id, name, description, type, config, is_active, created_by, created_at, updated_at")
    .single();

  handleError(error, "Unable to update agent configuration");
  return {
    ...data!,
    config: (data?.config as AgentConfigurationEnvelope) || {},
  };
}

export async function triggerAgentRun(payload: AgentRunPayload): Promise<AgentRunResponse> {
  const { data, error } = await supabase.functions.invoke<AgentRunResponse>("run-ai-agent", {
    body: payload,
  });

  handleError(error, "Unable to execute AI agent");
  return data!;
}

export async function fetchAgentRunHistory(agentId: string, limit = 20): Promise<AgentRunHistoryRow[]> {
  const { data, error } = await supabase
    .from("ai_agent_runs")
    .select("id, created_at, status, output, ai_summary, agent_id")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  handleError(error, "Unable to fetch agent run history");
  return data ?? [];
}
