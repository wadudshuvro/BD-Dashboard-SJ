import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { corsHeaders } from "../_shared/cors.ts";
import {
  AgentConfig,
  buildProviderChain,
  invokeProvider,
  ProviderTelemetry,
} from "../_shared/providers.ts";

const AgentRunRequestSchema = z.object({
  agent_id: z.string().uuid(),
  execution_context: z.object({
    timeframe: z.string().optional(),
    filters: z.record(z.any()).optional(),
    office_ids: z.array(z.string()).optional(),
    user_id: z.string().uuid().optional(),
    deal_id: z.string().uuid().optional(),
    deal_title: z.string().optional(),
    client_name: z.string().optional(),
    deal_stage: z.string().optional(),
  }).optional(),
  file_ids: z.array(z.string().uuid()).optional(),
  user_context: z.string().optional(),
});

const MetricsSchema = z.object({
  total_items_analyzed: z.number().nonnegative().default(0),
  anomalies_found: z.number().nonnegative().default(0),
  high_priority_issues: z.number().nonnegative().default(0),
});

const ActionItemSchema = z.object({
  type: z.enum(["task", "note"]).default("task"),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  assignee: z.string().optional(),
  due_date: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

const AgentResponseSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  action_items: z.array(ActionItemSchema).default([]),
  metrics: MetricsSchema.default({
    total_items_analyzed: 0,
    anomalies_found: 0,
    high_priority_issues: 0,
  }),
  confidence_score: z.number().min(0).max(1).optional(),
  insights: z.array(z.string()).optional(),
  risks: z.array(z.string()).optional(),
});

type AgentResponse = z.infer<typeof AgentResponseSchema>;

type SupabaseClient = ReturnType<typeof createClient>;

interface DatabaseAgent {
  id: string;
  name: string;
  category: string;
  system_prompt: string;
  config?: AgentConfig;
  prompt_template?: string;
}

interface SharedResourceRow {
  resource_type: string;
  resource_identifier: string;
  metadata?: Record<string, unknown>;
}

interface ConfigurationRow {
  configuration_type: string;
  configuration_data: Record<string, unknown>;
}

interface ConfigurationPayload {
  businessContext: Record<string, unknown>;
  modelSettings: { default_model?: string };
  prompts: {
    analysis_prompts?: Record<string, string>;
  };
}

async function getClient(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    auth: { persistSession: false },
  });
}

async function requireAuth(client: SupabaseClient): Promise<string | null> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

async function fetchConfigurations(client: SupabaseClient): Promise<ConfigurationPayload> {
  const { data, error } = await client
    .from("ai_configurations")
    .select("configuration_type, configuration_data");

  if (error) throw error;

  const configMap: Record<string, Record<string, unknown>> = {};
  (data as ConfigurationRow[] | null)?.forEach((config) => {
    configMap[config.configuration_type] = config.configuration_data;
  });

  return {
    businessContext: (configMap.business_context as Record<string, unknown>) || {},
    modelSettings: (configMap.model_settings as { default_model?: string }) || { default_model: "gpt-4o-mini" },
    prompts: (configMap.prompts as ConfigurationPayload["prompts"]) || {},
  };
}

async function fetchSharedResources(client: SupabaseClient, agentId: string): Promise<SharedResourceRow[]> {
  // TODO: Implement shared resources when ai_shared_resources table is created
  // For now, return empty array to allow BD agents to work with deal files
  return [];
}

async function fetchFileContents(client: SupabaseClient, fileIds: string[]): Promise<string> {
  if (!fileIds || fileIds.length === 0) return "";

  const { data: files, error } = await client
    .from("deal_files")
    .select("id, drive_file_name, drive_file_type, storage_bucket_path, json_snapshot_path")
    .in("id", fileIds);

  if (error || !files || files.length === 0) return "";

  const fileContents: string[] = [];
  for (const file of files) {
    const fileName = (file as any).drive_file_name || "Untitled Document";
    const fileType = (file as any).drive_file_type || "unknown";
    
    fileContents.push(`\n### Document: ${fileName} (${fileType})\n`);
    
    const jsonPath = (file as any).json_snapshot_path;
    if (jsonPath) {
      try {
        const { data: content } = await client.storage
          .from("deal-files")
          .download(jsonPath);
        
        if (content) {
          const text = await content.text();
          fileContents.push(text.substring(0, 10000)); // Limit to 10k chars per file
        }
      } catch (err) {
        fileContents.push("[Could not retrieve file content]");
      }
    } else {
      fileContents.push("[File preview not available]");
    }
  }

  return fileContents.join("\n\n");
}

function assemblePrompt(
  agent: DatabaseAgent,
  businessContext: Record<string, unknown>,
  prompts: ConfigurationPayload["prompts"],
  executionContext: Record<string, unknown>,
  sharedResources: SharedResourceRow[],
  fileContents?: string,
  userContext?: string,
) {
  let systemPrompt: string = agent.system_prompt;

  const companyName = typeof businessContext["company_name"] === "string"
    ? businessContext["company_name"] as string
    : undefined;
  const industry = typeof businessContext["industry"] === "string"
    ? businessContext["industry"] as string
    : undefined;
  const companyPolicies = typeof businessContext["company_policies"] === "string"
    ? businessContext["company_policies"] as string
    : undefined;
  const seasonalRules = businessContext["seasonal_rules"] as Record<string, string> | undefined;

  if (companyName) {
    systemPrompt = systemPrompt.replace(/\{company_name\}/g, companyName);
  }
  if (industry) {
    systemPrompt = systemPrompt.replace(/\{industry\}/g, industry);
  }

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const seasonalRule = seasonalRules?.[`Q${currentQuarter}`];
  if (seasonalRule) {
    systemPrompt += `\n\nSeasonal Context: ${seasonalRule}`;
  }

  if (companyPolicies) {
    systemPrompt += `\n\nCompany Policies: ${companyPolicies}`;
  }

  if (sharedResources.length) {
    systemPrompt += `\n\nShared Knowledge Bases:`;
    sharedResources.forEach((resource) => {
      const metadata = resource.metadata as Record<string, unknown> | undefined;
      const description = typeof metadata?.description === "string" ? metadata.description : undefined;
      const label = description ?? resource.resource_identifier;
      systemPrompt += `\n- ${resource.resource_type}: ${label}`;
    });
  }

  const defaultPrompt = prompts.analysis_prompts?.[agent.category] || "Provide an actionable analysis.";
  const serializedContext = JSON.stringify(executionContext ?? {});
  const responseTemplate = JSON.stringify({
    summary: "Brief summary of findings",
    findings: ["Finding 1"],
    recommendations: ["Recommendation 1"],
    action_items: [{
      type: "task",
      description: "Action description",
      priority: "high|medium|low",
      assignee: "Optional assignee",
      due_date: "Optional ISO string",
      confidence: 0.8
    }],
    metrics: {
      total_items_analyzed: 0,
      anomalies_found: 0,
      high_priority_issues: 0
    },
    confidence_score: 0.8
  }, null, 2);

  let userPrompt: string;
  
  if (agent.prompt_template) {
    userPrompt = agent.prompt_template
      .replace(/\{\{deal_title\}\}/g, executionContext.deal_title as string || "N/A")
      .replace(/\{\{deal_stage\}\}/g, executionContext.deal_stage as string || "N/A")
      .replace(/\{\{client_name\}\}/g, executionContext.client_name as string || "N/A")
      .replace(/\{\{file_contents\}\}/g, fileContents || "[No documents provided]")
      .replace(/\{\{user_context\}\}/g, userContext || "[No additional context]");
  } else {
    userPrompt = `You are executing the ${agent.name} agent.\n\n` +
      `Contextual Filters: ${serializedContext}\n` +
      `Primary Objective: ${defaultPrompt}\n\n` +
      `Provide the result as JSON matching this schema:\n${responseTemplate}\n` +
      `Only return valid JSON.`;
  }

  return {
    systemPrompt,
    userPrompt,
  };
}

function tryParseJson(content: string): AgentResponse {
  try {
    const parsed = JSON.parse(content);
    return AgentResponseSchema.parse(parsed);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        return AgentResponseSchema.parse(parsed);
      } catch (_error) {
        // continue to fallback
      }
    }
    const bracesMatch = content.match(/\{[\s\S]*\}/);
    if (bracesMatch) {
      try {
        const parsed = JSON.parse(bracesMatch[0]);
        return AgentResponseSchema.parse(parsed);
      } catch (_error) {
        // continue to fallback
      }
    }

    return AgentResponseSchema.parse({
      summary: content.substring(0, 280),
      findings: ["Unable to parse provider response as JSON."],
      recommendations: ["Review provider output formatting."],
      action_items: [],
      metrics: { total_items_analyzed: 0, anomalies_found: 0, high_priority_issues: 0 },
      confidence_score: 0.2,
    });
  }
}

function buildProviderTelemetry(result: any): any {
  return result.telemetry;
}

async function persistRun(
  client: any,
  payload: {
    agentId: string;
    userId: string;
    agentCategory: string | null;
    executionContext: Record<string, unknown>;
    response: AgentResponse;
    providerTelemetry: ProviderTelemetry[];
    providerRawOutputs: unknown[];
    selectedFileIds?: string[];
    userContext?: string;
    structuredOutput?: any;
  },
) {
  const { data, error } = await (client as any)
    .from("ai_agent_runs")
    .insert({
      agent_id: payload.agentId,
      executed_by: payload.userId,
      execution_context: payload.executionContext,
      ai_summary: payload.response,
      generated_tasks: payload.response.action_items,
      status: "completed",
      title: `${new Date().toISOString()} - ${payload.response.summary.substring(0, 60)}`,
      category: payload.agentCategory,
      output: {
        response: payload.response,
        telemetry: payload.providerTelemetry,
        rawOutputs: payload.providerRawOutputs,
      },
      provider_chain: payload.providerTelemetry,
      selected_file_ids: payload.selectedFileIds || [],
      user_context: payload.userContext,
      structured_output: payload.structuredOutput || payload.response,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let client: any = null;

  try {
    client = await getClient(req);
    const userId = await requireAuth(client);

    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await req.json();
    const payload = AgentRunRequestSchema.parse(json);

    const { agent_id: agentId, execution_context: executionContext, file_ids: fileIds, user_context: userContext } = payload;

    const { data: agent, error: agentError } = await client
      .from("ai_agents")
      .select("*, config, prompt_template")
      .eq("id", agentId)
      .single();

    if (agentError || !agent) {
      throw new Error("Agent not found or access denied");
    }

    const configs = await fetchConfigurations(client);
    const sharedResources = await fetchSharedResources(client, agentId);
    
    const fileContents = fileIds ? await fetchFileContents(client, fileIds) : "";
    
    const { systemPrompt, userPrompt } = assemblePrompt(
      agent,
      configs.businessContext,
      configs.prompts,
      executionContext || {},
      sharedResources,
      fileContents,
      userContext,
    );

    const providerChain = buildProviderChain((agent.config as any) || {}, configs.modelSettings?.default_model || "google/gemini-2.5-flash");

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    const telemetry: ProviderTelemetry[] = [];
    const rawOutputs: unknown[] = [];
    let parsedResponse: AgentResponse | null = null;

    for (const providerConfig of providerChain) {
      const result = await invokeProvider(providerConfig, messages);
      const telemetryEntry = buildProviderTelemetry(result);
      telemetry.push(telemetryEntry);
      rawOutputs.push(result.rawResponse);

      if (!result.content) {
        console.error(`Provider ${providerConfig.provider}/${providerConfig.model} failed:`, {
          error: telemetryEntry.error,
          rawResponse: result.rawResponse,
        });
        continue;
      }

      try {
        parsedResponse = tryParseJson(result.content);
        break;
      } catch (error) {
        telemetry[telemetry.length - 1] = {
          ...telemetry[telemetry.length - 1],
          error: {
            message: error instanceof Error ? error.message : "Unable to parse provider output",
          },
        };
      }
    }

    if (!parsedResponse) {
      throw new Error("All providers failed to produce a valid response");
    }

    const runRecord = await persistRun(client, {
      agentId,
      userId,
      agentCategory: (agent as any).category ?? null,
      executionContext: executionContext || {},
      response: parsedResponse,
      providerTelemetry: telemetry,
      providerRawOutputs: rawOutputs,
      selectedFileIds: fileIds,
      userContext,
      structuredOutput: parsedResponse,
    });

    return new Response(
      JSON.stringify({
        success: true,
        run_id: (runRecord as any).id,
        summary: parsedResponse.summary,
        findings: parsedResponse.findings,
        recommendations: parsedResponse.recommendations,
        action_items: parsedResponse.action_items,
        structured_output: parsedResponse,
        telemetry,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in run-ai-agent function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
