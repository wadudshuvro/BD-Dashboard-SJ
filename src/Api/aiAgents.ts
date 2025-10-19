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
  slug: string;
  description?: string;
  category: string;
  config: AgentConfigurationEnvelope;
  is_enabled: boolean;
  required_role: string;
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
  approval_status: string | null;
  output: Record<string, unknown>;
  ai_summary: Record<string, unknown>;
  provider_chain: Array<Record<string, unknown>>;
}

function handleError<T>(error: { message?: string } | null, fallbackMessage: string): asserts error is null {
  if (error) {
    throw new Error(error.message || fallbackMessage);
  }
}

export async function listAgents(): Promise<AIAgent[]> {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("id, name, slug, description, category, config, is_enabled, required_role, updated_at")
    .order("name", { ascending: true });

  handleError(error, "Unable to fetch AI agents");
  return (data ?? []).map((agent) => ({
    ...agent,
    config: (agent.config as AgentConfigurationEnvelope) || {},
  }));
}

export async function updateAgentConfig(
  agentId: string,
  config: AgentConfigurationEnvelope,
): Promise<AIAgent> {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ config })
    .eq("id", agentId)
    .select("id, name, slug, description, category, config, is_enabled, required_role, updated_at")
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
    .select("id, created_at, status, approval_status, output, ai_summary, provider_chain")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false })
    .limit(limit);

  handleError(error, "Unable to fetch agent run history");
  return data ?? [];
}
