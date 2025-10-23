import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

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

export interface AgentDataSourceConfig {
  tables?: string[];
  documents?: string[];
  [key: string]: unknown;
}

export interface AgentOutputActions {
  create_tasks?: boolean;
  send_alerts?: boolean;
  [key: string]: unknown;
}

export interface AgentScheduleConfig {
  schedule?: string;
  frequency?: string;
  run_at?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface AgentDetailsPayload {
  name: string;
  description?: string | null;
  slug?: string | null;
  category?: string | null;
  type: string;
  config: AgentConfigurationEnvelope;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
  system_prompt?: string | null;
  prompt_template?: string | null;
  data_source_config?: AgentDataSourceConfig | null;
  output_actions?: AgentOutputActions | null;
  schedule_config?: AgentScheduleConfig | null;
}

export interface AIAgent {
  id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  category?: string | null;
  type?: string | null;
  system_prompt?: string | null;
  config: AgentConfigurationEnvelope;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
  system_prompt?: string | null;
  prompt_template?: string | null;
  data_source_config?: AgentDataSourceConfig | null;
  output_actions?: AgentOutputActions | null;
  schedule_config?: AgentScheduleConfig | null;
}

export interface AgentDashboardMetrics {
  agentId: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  lastRunAt: string | null;
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
    .select(
      "id, name, description, slug, category, type, config, is_active, is_enabled, created_by, created_at, updated_at, system_prompt, prompt_template, data_source_config, output_actions, schedule_config",
    )
    .order("name", { ascending: true });

  handleError(error, "Unable to fetch AI agents");
  return (data ?? []).map((agent: any) => ({
    ...agent,
    config: (agent.config as AgentConfigurationEnvelope) || {},
    data_source_config: (agent.data_source_config as AgentDataSourceConfig) || null,
    output_actions: (agent.output_actions as AgentOutputActions) || null,
    schedule_config: (agent.schedule_config as AgentScheduleConfig) || null,
  }));
}

export async function createAgent(payload: AgentDetailsPayload): Promise<AIAgent> {
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      name: payload.name,
      description: payload.description ?? null,
      slug: payload.slug ?? null,
      category: payload.category ?? null,
      type: payload.type,
      config: (payload.config || {}) as Json,
      is_active: payload.is_active ?? null,
      is_enabled: payload.is_enabled ?? null,
      system_prompt: payload.system_prompt ?? null,
      prompt_template: payload.prompt_template ?? null,
      data_source_config: (payload.data_source_config ?? null) as Json,
      output_actions: (payload.output_actions ?? null) as Json,
      schedule_config: (payload.schedule_config ?? null) as Json,
    })
    .select(
      "id, name, description, slug, category, type, config, is_active, is_enabled, created_by, created_at, updated_at, system_prompt, prompt_template, data_source_config, output_actions, schedule_config",
    )
    .single();

  handleError(error, "Unable to create agent");
  return {
    ...data!,
    config: (data?.config as AgentConfigurationEnvelope) || {},
    data_source_config: (data?.data_source_config as AgentDataSourceConfig) || null,
    output_actions: (data?.output_actions as AgentOutputActions) || null,
    schedule_config: (data?.schedule_config as AgentScheduleConfig) || null,
  };
}

export async function updateAgentDetails(agentId: string, payload: Partial<AgentDetailsPayload>): Promise<AIAgent> {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({
      name: payload.name,
      description: payload.description,
      slug: payload.slug,
      category: payload.category,
      type: payload.type,
      config: (payload.config || {}) as Json,
      is_active: payload.is_active,
      is_enabled: payload.is_enabled,
      system_prompt: payload.system_prompt,
      prompt_template: payload.prompt_template,
      data_source_config: payload.data_source_config as Json | null | undefined,
      output_actions: payload.output_actions as Json | null | undefined,
      schedule_config: payload.schedule_config as Json | null | undefined,
    })
    .eq("id", agentId)
    .select(
      "id, name, description, slug, category, type, config, is_active, is_enabled, created_by, created_at, updated_at, system_prompt, prompt_template, data_source_config, output_actions, schedule_config",
    )
    .single();

  handleError(error, "Unable to update agent");
  return {
    ...data!,
    config: (data?.config as AgentConfigurationEnvelope) || {},
    data_source_config: (data?.data_source_config as AgentDataSourceConfig) || null,
    output_actions: (data?.output_actions as AgentOutputActions) || null,
    schedule_config: (data?.schedule_config as AgentScheduleConfig) || null,
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
