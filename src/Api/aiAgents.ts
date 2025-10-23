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

export type AgentOutputAction = Record<string, unknown> & {
  type?: string;
  label?: string;
};

export type AgentOutputActions = AgentOutputAction[];

export type AgentDataSourceConfig = Record<string, unknown>;

export type AgentScheduleConfig = {
  frequency?: string;
  next_run_at?: string | null;
  [key: string]: unknown;
};

export interface AIAgent {
  id: string;
  name: string;
  description?: string | null;
  slug?: string | null;
  category?: string | null;
  type?: string | null;
  system_prompt?: string | null;
  config: AgentConfigurationEnvelope;
  output_actions: AgentOutputActions;
  data_source_config?: AgentDataSourceConfig | null;
  schedule_config?: AgentScheduleConfig | null;
  last_run_at?: string | null;
  success_rate?: number | null;
  is_active?: boolean;
  is_enabled?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
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
      [
        "id",
        "name",
        "description",
        "slug",
        "category",
        "type",
        "config",
        "system_prompt",
        "output_actions",
        "data_source_config",
        "schedule_config",
        "last_run_at",
        "success_rate",
        "is_active",
        "is_enabled",
        "created_by",
        "created_at",
        "updated_at",
      ].join(", "),
    )
    .order("name", { ascending: true });

  handleError(error, "Unable to fetch AI agents");
  return (data ?? []).map((agent) => ({
    ...agent,
    config: (agent.config as AgentConfigurationEnvelope) || {},
    output_actions: (agent.output_actions as AgentOutputActions) || [],
    data_source_config: (agent.data_source_config as AgentDataSourceConfig) || null,
    schedule_config: (agent.schedule_config as AgentScheduleConfig) || null,
  }));
}

export async function updateAgentConfig(
  agentId: string,
  config: AgentConfigurationEnvelope,
): Promise<AIAgent> {
  const { data, error } = await supabase
    .from("ai_agents")
    .update({ config: config as unknown as Record<string, unknown> })
    .eq("id", agentId)
    .select(
      "id, name, description, slug, category, type, config, system_prompt, output_actions, data_source_config, schedule_config, last_run_at, success_rate, is_active, is_enabled, created_by, created_at, updated_at",
    )
    .single();

  handleError(error, "Unable to update agent configuration");
  return {
    ...data!,
    config: (data?.config as AgentConfigurationEnvelope) || {},
    output_actions: (data?.output_actions as AgentOutputActions) || [],
    data_source_config: (data?.data_source_config as AgentDataSourceConfig) || null,
    schedule_config: (data?.schedule_config as AgentScheduleConfig) || null,
  };
}

export async function fetchAgentDashboardMetrics(agentId: string): Promise<AgentDashboardMetrics> {
  const { data, error } = await supabase
    .from("ai_agent_runs")
    .select("status, created_at")
    .eq("agent_id", agentId)
    .order("created_at", { ascending: false });

  handleError(error, "Unable to fetch agent metrics");
  const runs = data ?? [];
  const successfulStatuses = new Set(["completed", "success", "succeeded"]);
  const failedStatuses = new Set(["failed", "error"]);

  return {
    agentId,
    totalRuns: runs.length,
    successfulRuns: runs.filter((run) => (run.status ? successfulStatuses.has(run.status) : false)).length,
    failedRuns: runs.filter((run) => (run.status ? failedStatuses.has(run.status) : false)).length,
    lastRunAt: runs.length > 0 ? runs[0].created_at : null,
  };
}

export interface AgentTemplate {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  provider: string;
  model?: string | null;
  template_config: Record<string, unknown>;
  is_public?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function listAgentTemplates(): Promise<AgentTemplate[]> {
  const { data, error } = await supabase
    .from("ai_agent_templates")
    .select(
      "id, name, description, category, provider, model, template_config, is_public, created_by, created_at, updated_at",
    )
    .order("name", { ascending: true });

  handleError(error, "Unable to fetch agent templates");
  return (data ?? []).map((template) => ({
    ...template,
    template_config: (template.template_config as Record<string, unknown>) || {},
  }));
}

export interface BusinessContext {
  id: string;
  name: string;
  description?: string | null;
  context_type: string;
  data: Record<string, unknown>;
  is_active?: boolean | null;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export async function listBusinessContexts(): Promise<BusinessContext[]> {
  const { data, error } = await supabase
    .from("ai_business_context")
    .select("id, name, description, context_type, data, is_active, created_by, created_at, updated_at")
    .order("name", { ascending: true });

  handleError(error, "Unable to fetch business contexts");
  return (data ?? []).map((context) => ({
    ...context,
    data: (context.data as Record<string, unknown>) || {},
  }));
}

export interface CreateAgentPayload {
  name: string;
  type: string;
  description?: string | null;
  slug?: string | null;
  category?: string | null;
  system_prompt?: string | null;
  config?: AgentConfigurationEnvelope;
  output_actions?: AgentOutputActions;
  data_source_config?: AgentDataSourceConfig | null;
  schedule_config?: AgentScheduleConfig | null;
  last_run_at?: string | null;
  success_rate?: number | null;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
  created_by?: string | null;
}

export async function createAgent(payload: CreateAgentPayload): Promise<AIAgent> {
  const { data, error } = await supabase
    .from("ai_agents")
    .insert({
      name: payload.name,
      type: payload.type,
      description: payload.description ?? null,
      slug: payload.slug ?? null,
      category: payload.category ?? null,
      system_prompt: payload.system_prompt ?? null,
      config: (payload.config ?? {}) as Record<string, unknown>,
      output_actions: payload.output_actions ?? [],
      data_source_config: payload.data_source_config ?? null,
      schedule_config: payload.schedule_config ?? null,
      last_run_at: payload.last_run_at ?? null,
      success_rate: payload.success_rate ?? null,
      is_active: payload.is_active ?? null,
      is_enabled: payload.is_enabled ?? null,
      created_by: payload.created_by ?? null,
    })
    .select(
      "id, name, description, slug, category, type, config, system_prompt, output_actions, data_source_config, schedule_config, last_run_at, success_rate, is_active, is_enabled, created_by, created_at, updated_at",
    )
    .single();

  handleError(error, "Unable to create agent");
  return {
    ...data!,
    config: (data?.config as AgentConfigurationEnvelope) || {},
    output_actions: (data?.output_actions as AgentOutputActions) || [],
    data_source_config: (data?.data_source_config as AgentDataSourceConfig) || null,
    schedule_config: (data?.schedule_config as AgentScheduleConfig) || null,
  };
}

export interface UpdateAgentDetailsPayload {
  name?: string;
  type?: string;
  description?: string | null;
  slug?: string | null;
  category?: string | null;
  system_prompt?: string | null;
  output_actions?: AgentOutputActions;
  data_source_config?: AgentDataSourceConfig | null;
  schedule_config?: AgentScheduleConfig | null;
  last_run_at?: string | null;
  success_rate?: number | null;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
}

export async function updateAgentDetails(
  agentId: string,
  payload: UpdateAgentDetailsPayload,
): Promise<AIAgent> {
  const updates: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    updates.name = payload.name;
  }
  if (payload.type !== undefined) {
    updates.type = payload.type;
  }
  if (payload.description !== undefined) {
    updates.description = payload.description ?? null;
  }
  if (payload.slug !== undefined) {
    updates.slug = payload.slug ?? null;
  }
  if (payload.category !== undefined) {
    updates.category = payload.category ?? null;
  }
  if (payload.system_prompt !== undefined) {
    updates.system_prompt = payload.system_prompt ?? null;
  }
  if (payload.output_actions !== undefined) {
    updates.output_actions = payload.output_actions ?? [];
  }
  if (payload.data_source_config !== undefined) {
    updates.data_source_config = payload.data_source_config ?? null;
  }
  if (payload.schedule_config !== undefined) {
    updates.schedule_config = payload.schedule_config ?? null;
  }
  if (payload.last_run_at !== undefined) {
    updates.last_run_at = payload.last_run_at ?? null;
  }
  if (payload.success_rate !== undefined) {
    updates.success_rate = payload.success_rate ?? null;
  }
  if (payload.is_active !== undefined) {
    updates.is_active = payload.is_active;
  }
  if (payload.is_enabled !== undefined) {
    updates.is_enabled = payload.is_enabled;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  const { data, error } = await supabase
    .from("ai_agents")
    .update(updates)
    .eq("id", agentId)
    .select(
      "id, name, description, slug, category, type, config, system_prompt, output_actions, data_source_config, schedule_config, last_run_at, success_rate, is_active, is_enabled, created_by, created_at, updated_at",
    )
    .single();

  handleError(error, "Unable to update agent details");
  return {
    ...data!,
    config: (data?.config as AgentConfigurationEnvelope) || {},
    output_actions: (data?.output_actions as AgentOutputActions) || [],
    data_source_config: (data?.data_source_config as AgentDataSourceConfig) || null,
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
