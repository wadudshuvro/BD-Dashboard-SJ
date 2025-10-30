import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

import { corsHeaders } from "../_shared/cors.ts";
import {
  AgentConfig,
  ProviderConfig,
  ProviderName,
  buildProviderChain,
  invokeProvider,
  ProviderTelemetry,
} from "../_shared/providers.ts";

const AgentRunRequestSchema = z.object({
  agent_id: z.string().uuid().optional(),
  agent_type: z.string().optional(),
  target: z.enum(["deal", "client"]).optional(),
  client_id: z.string().uuid().optional(),
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
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
  current_question: z.string().optional(),
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

const StructuredOutputBaseSchema = z.object({
  industry: z.string().optional().nullable(),
  employee_count: z.union([z.string(), z.number()]).optional().nullable(),
  revenue: z.union([z.string(), z.number()]).optional().nullable(),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const StructuredOutputSchema = StructuredOutputBaseSchema.optional();

type StructuredOutput = z.infer<typeof StructuredOutputBaseSchema>;

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
  structured_output: z.record(z.any()).optional(),
}).passthrough();

type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Tool calling schema for BD lead analysis
const bdAnalysisToolSchema = {
  type: "function" as const,
  function: {
    name: "provide_lead_analysis",
    description: "Provide comprehensive BD lead analysis with all required fields",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "2-3 sentence executive summary of lead value and campaign fit"
        },
        findings: {
          type: "array",
          items: { type: "string" },
          description: "8-12 key insights in bullet format"
        },
        recommendations: {
          type: "array",
          items: { type: "string" },
          description: "3-7 strategic recommendations"
        },
        action_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["task", "research", "outreach"] },
              description: { type: "string" },
              priority: { type: "string", enum: ["high", "medium", "low"] },
              due_date: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 1 }
            },
            required: ["type", "description", "priority", "confidence"]
          }
        },
        metrics: {
          type: "object",
          properties: {
            total_items_analyzed: { type: "integer" },
            high_priority_issues: { type: "integer" },
            anomalies_found: { type: "integer" }
          },
          required: ["total_items_analyzed", "high_priority_issues", "anomalies_found"]
        },
        confidence_score: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Overall confidence based on data completeness"
        },
        insights: {
          type: "array",
          items: { type: "string" },
          description: "Context-specific insights, industry considerations, market timing"
        },
        risks: {
          type: "array",
          items: { type: "string" },
          description: "Potential challenges, objections, competitive threats"
        },
        structured_output: {
          type: "object",
          properties: {
            lead_quality_score: {
              type: "string",
              enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"],
              description: "Lead quality grade"
            },
            engagement_readiness: {
              type: "string",
              enum: ["hot", "warm", "cold"],
              description: "Engagement readiness assessment"
            },
            decision_maker_level: {
              type: "string",
              enum: ["C-suite", "VP", "Director", "Manager", "Individual Contributor"],
              description: "Decision-making authority level"
            },
            best_approach: {
              type: "string",
              enum: ["consultative", "educational", "solution-focused", "relationship-building"],
              description: "Recommended approach strategy"
            },
            estimated_deal_size: {
              type: "string",
              description: "Estimated deal size range or 'Not applicable'"
            },
            sales_cycle_estimate: {
              type: "string",
              description: "Estimated sales cycle duration"
            },
            recommended_next_step: {
              type: "string",
              description: "Specific recommended action"
            },
            recommended_timing: {
              type: "string",
              enum: ["now", "this week", "this month", "next quarter"],
              description: "Recommended timing for next action"
            },
            key_talking_points: {
              type: "array",
              items: { type: "string" },
              description: "3-5 key talking points for outreach"
            }
          },
          required: [
            "lead_quality_score",
            "engagement_readiness",
            "decision_maker_level",
            "best_approach",
            "recommended_next_step",
            "recommended_timing",
            "key_talking_points"
          ]
        }
      },
      required: [
        "summary",
        "findings",
        "recommendations",
        "action_items",
        "metrics",
        "confidence_score",
        "insights",
        "risks",
        "structured_output"
      ]
    }
  }
};

// Tool calling schema for LinkedIn message generation
const linkedInMessageToolSchema = {
  type: "function" as const,
  function: {
    name: "generate_linkedin_messages",
    description: "Generate personalized LinkedIn outreach messages with 3 variants",
    parameters: {
      type: "object",
      properties: {
        message_variants: {
          type: "array",
          description: "Exactly 3 message variants with different tones",
          items: {
            type: "object",
            properties: {
              variant_name: {
                type: "string",
                enum: ["Direct Professional", "Warm Conversational", "Value-Focused"],
                description: "Name of the variant"
              },
              message: {
                type: "string",
                description: "The complete LinkedIn message text"
              },
              character_count: {
                type: "integer",
                description: "Total character count of the message"
              },
              tone: {
                type: "string",
                enum: ["professional", "friendly", "consultative", "direct"],
                description: "Tone of the message"
              },
              key_hooks: {
                type: "array",
                items: { type: "string" },
                description: "2-3 key hooks used in the message"
              },
              personalization_elements: {
                type: "array",
                items: { type: "string" },
                description: "Specific personalization elements included"
              }
            },
            required: ["variant_name", "message", "character_count", "tone", "key_hooks", "personalization_elements"]
          },
          minItems: 3,
          maxItems: 3
        },
        recommended_variant: {
          type: "string",
          enum: ["Direct Professional", "Warm Conversational", "Value-Focused"],
          description: "Which variant is recommended based on the context"
        },
        reasoning: {
          type: "string",
          description: "Why the recommended variant is best for this contact"
        },
        send_timing_suggestion: {
          type: "string",
          enum: ["morning", "afternoon", "evening", "anytime"],
          description: "Best time to send based on contact's activity patterns"
        },
        follow_up_strategy: {
          type: "string",
          description: "Suggested follow-up approach if no response"
        }
      },
      required: [
        "message_variants",
        "recommended_variant",
        "reasoning",
        "send_timing_suggestion",
        "follow_up_strategy"
      ]
    }
  }
};

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

interface IntegrationRow {
  type: string;
  config: Record<string, unknown> | null;
}

interface ClientRow {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  notes?: string | null;
  employee_count?: number | null;
  revenue?: number | null;
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

function normalizeNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9.]/g, "");
    if (!sanitized) return null;
    const numeric = Number(sanitized);
    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

async function resolvePreferredIntegration(client: SupabaseClient): Promise<IntegrationRow | null> {
  const preferredProviders: ProviderName[] = ["perplexity", "openai"];

  for (const providerType of preferredProviders) {
    const { data, error } = await client
      .from("integrations")
      .select("type, config")
      .eq("type", providerType)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      return data as IntegrationRow;
    }
  }

  return null;
}

function assemblePrompt(
  agent: DatabaseAgent,
  businessContext: Record<string, unknown>,
  prompts: ConfigurationPayload["prompts"],
  executionContext: Record<string, unknown>,
  sharedResources: SharedResourceRow[],
  fileContents?: string,
  userContext?: string,
  agentType?: string,
  currentQuestion?: string,
) {
  let systemPrompt: string = agent.system_prompt;

  // Handle document_qa type with conversational prompt
  if (agentType === 'document_qa' && fileContents) {
    const userPrompt = `# Deal Documents

${fileContents}

---

# User Question

${currentQuestion || userContext || 'Summarize the key points from these documents.'}

**Instructions:**
- Answer based ONLY on the documents above
- Cite specific document names when referencing information using format [Document: filename.ext]
- If unsure or information not present, clearly state that
- Be concise but thorough`;

    return { systemPrompt, userPrompt };
  }

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
    confidence_score: 0.8,
    insights: ["Additional insight 1"],
    risks: ["Risk factor 1"],
    structured_output: {
      lead_quality_score: "A+",
      engagement_readiness: "hot|warm|cold",
      decision_maker_level: "C-suite|VP|Director|Manager",
      best_approach: "consultative|educational|solution-focused",
      recommended_next_step: "specific action",
      recommended_timing: "now|this week|this month",
      key_talking_points: ["point 1", "point 2", "point 3"]
    }
  }, null, 2);

  let userPrompt: string;
  
  // Check if this is a BD contact analysis
  const contactData = (executionContext.filters as any)?.contact_data;
  
  if (contactData && agent.category === 'research') {
    // Build comprehensive BD analysis prompt
    userPrompt = `# LEAD INTELLIGENCE ANALYSIS

## CAMPAIGN CONTEXT
Campaign: ${contactData.campaign_name || 'N/A'}
Type: ${contactData.campaign_type || 'N/A'}
Status: ${contactData.campaign_status || 'N/A'}
Target Regions: ${Array.isArray(contactData.campaign_target_regions) ? contactData.campaign_target_regions.join(", ") : 'N/A'}
Campaign Goals:
- Target Contacts: ${contactData.campaign_goals?.target_contacts_count || 0}
- Reached: ${contactData.campaign_goals?.actual_contacts_reached || 0}
- Responses: ${contactData.campaign_goals?.responses_received || 0}
- Meetings: ${contactData.campaign_goals?.meetings_booked || 0}
- Deals: ${contactData.campaign_goals?.deals_generated || 0}

## LEAD PROFILE

### Basic Information
Name: ${contactData.contact_name || 'N/A'}
Email: ${contactData.contact_email || 'Not available'}
Phone: ${contactData.contact_phone || 'Not available'}
LinkedIn: ${contactData.contact_linkedin_url || 'Not available'}

### Current Role
Title: ${contactData.current_position_title || 'Not available'}
Company: ${contactData.current_employer || 'Not available'}
Started: ${contactData.current_position_start_date || 'Unknown'}
Years in Role: ${contactData.years_in_current_role || 'Unknown'}

### Professional Background
Headline: ${contactData.linkedin_headline || 'N/A'}
Location: ${contactData.linkedin_location || 'N/A'}
Total Experience: ${contactData.total_years_experience || 'Unknown'} years
Industry Focus: ${contactData.industry_focus || 'Not specified'}
Previous Employers: ${Array.isArray(contactData.previous_employers) ? contactData.previous_employers.join(", ") : 'N/A'}

### Education
${contactData.education_summary || 'No education info'}
Highest Degree: ${contactData.highest_degree || 'Not specified'}

### Skills & Languages
Skills (${Array.isArray(contactData.linkedin_skills) ? contactData.linkedin_skills.length : 0}): ${Array.isArray(contactData.linkedin_skills) ? contactData.linkedin_skills.slice(0, 10).join(", ") : 'N/A'}
Languages: ${Array.isArray(contactData.languages) ? contactData.languages.join(", ") : 'N/A'}

### LinkedIn Profile Metrics
Followers: ${contactData.linkedin_follower_count ? contactData.linkedin_follower_count.toLocaleString() : 'N/A'}
Connections: ${contactData.linkedin_connection_count || 'N/A'}+
Profile Completeness: ${contactData.profile_completeness_score || 'Unknown'}%
Last Activity: ${contactData.last_linkedin_activity_date || 'Unknown'}

### About Section
${contactData.linkedin_about || 'No about section available'}

## EXISTING RESEARCH INSIGHTS
${contactData.research_summary || 'No research summary available - recommend running "Run Research" first'}
${contactData.research_generated_at ? `Generated: ${new Date(contactData.research_generated_at).toLocaleString()}` : ''}

## ENGAGEMENT HISTORY
Current Status: ${contactData.current_status || 'N/A'}
Last Enrichment: ${contactData.last_enriched_at ? new Date(contactData.last_enriched_at).toLocaleString() : 'N/A'}

---

# YOUR TASK

As a BD Research Analyst, analyze this lead comprehensively and provide actionable intelligence for outreach.

## Output Requirements (JSON format):

Provide the result as JSON matching this enhanced schema:
${responseTemplate}

**CRITICAL**: 
- Base analysis on ACTUAL DATA PROVIDED, not assumptions
- Highlight data gaps that need filling
- Prioritize campaign-specific relevance
- Provide BD-ready intelligence, not generic advice
- Reference specific details from the profile
- If research_summary is missing, note that running "Run Research" first would enhance analysis
- Include structured_output with lead_quality_score (A+ to F), engagement_readiness (hot/warm/cold), decision_maker_level, best_approach, key_talking_points, recommended_next_step, and recommended_timing
`;
  } else if (agent.prompt_template) {
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
    clientId?: string;
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
      client_id: payload.clientId,
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

    const {
      agent_id: payloadAgentId,
      agent_type: agentType,
      target: payloadTarget,
      client_id: clientId,
      execution_context: incomingExecutionContext,
      file_ids: fileIds,
      user_context: userContext,
    } = payload;

    const target = payloadTarget ?? "deal";
    let executionContext: Record<string, unknown> = { ...(incomingExecutionContext ?? {}) };
    executionContext.target = target;

    let agentId = payloadAgentId ?? null;
    let agent: DatabaseAgent | null = null;
    let clientProfile: ClientRow | null = null;
    let integrationOverride: IntegrationRow | null = null;
    let inputContext: Record<string, unknown> | null = null;

    if (target === "client") {
      if (!clientId) {
        throw new Error("client_id is required when target is 'client'");
      }

      const resolvedAgentType = agentType ?? "research";
      const { data: resolvedAgent, error: resolvedAgentError } = await client
        .from("ai_agents")
        .select("*, config, prompt_template")
        .eq("type", resolvedAgentType)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (resolvedAgentError) throw resolvedAgentError;
      if (!resolvedAgent) {
        throw new Error(`No active ${resolvedAgentType} agent configured for client enrichment`);
      }

      agent = resolvedAgent as unknown as DatabaseAgent;
      agentId = resolvedAgent.id;

      const { data: clientData, error: clientError } = await client
        .from("clients")
        .select("id, name, website, industry, notes, employee_count, revenue")
        .eq("id", clientId)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        throw new Error("Client not found");
      }

      clientProfile = clientData as ClientRow;
      integrationOverride = await resolvePreferredIntegration(client);

      inputContext = {
        client: {
          id: clientProfile.id,
          name: clientProfile.name,
          website: clientProfile.website ?? "",
          industry: clientProfile.industry ?? "",
          notes: clientProfile.notes ?? "",
        },
        enrichment_task:
          "Research and enrich the client's profile with updated industry, estimated employee count, revenue, and a concise summary for the business development team.",
      };

      executionContext = {
        ...executionContext,
        client_id: clientProfile.id,
        client_name: clientProfile.name,
        input_context: inputContext,
      };
    }

    if (!agent) {
      if (!agentId) {
        throw new Error("Agent ID is required for this request");
      }

      const { data: fetchedAgent, error: agentError } = await client
        .from("ai_agents")
        .select("*, config, prompt_template")
        .eq("id", agentId)
        .single();

      if (agentError || !fetchedAgent) {
        throw new Error("Agent not found or access denied");
      }

      agent = fetchedAgent as unknown as DatabaseAgent;
    }

    if (!agent || !agentId) {
      throw new Error("Agent resolution failed");
    }

    const configs = await fetchConfigurations(client);
    const sharedResources = await fetchSharedResources(client, agentId as string);

    const fileContents = fileIds ? await fetchFileContents(client, fileIds) : "";

    const agentConfig = ((agent as any).config ?? {}) as AgentConfig;
    const resolvedAgentConfig: AgentConfig = {
      ...agentConfig,
      providers: agentConfig.providers ? { ...agentConfig.providers } : undefined,
      features: agentConfig.features ? { ...agentConfig.features } : agentConfig.features,
    };

    const defaultModelFallback = configs.modelSettings?.default_model || "google/gemini-2.5-flash";
    let defaultModel = defaultModelFallback;

    if (integrationOverride) {
      const providerName = integrationOverride.type as ProviderName;
      if (providerName === "perplexity" || providerName === "openai") {
        const integrationModel = typeof integrationOverride.config?.model === "string"
          ? integrationOverride.config.model
          : undefined;

        const primaryProvider: ProviderConfig = {
          provider: providerName,
          model: integrationModel
            ?? (providerName === "perplexity" ? "pplx-70b-online" : defaultModelFallback),
        };

        resolvedAgentConfig.providers = {
          ...(resolvedAgentConfig.providers ?? {}),
          primary: primaryProvider,
        };

        if (providerName === "openai" && integrationModel) {
          defaultModel = integrationModel;
        }
      }
    }

    const { systemPrompt, userPrompt } = assemblePrompt(
      agent,
      configs.businessContext,
      configs.prompts,
      executionContext || {},
      sharedResources,
      fileContents,
      userContext,
      agentType,
      payload.current_question,
    );

    const userPromptContent = inputContext
      ? `${userPrompt}\n\nInput Context:\n${JSON.stringify(inputContext, null, 2)}`
      : userPrompt;

    const providerChain = buildProviderChain(resolvedAgentConfig, defaultModel);

    // Build messages array with conversation history for document_qa
    const messages = [];
    messages.push({ role: "system" as const, content: systemPrompt });
    
    if (agentType === 'document_qa' && payload.conversation_history) {
      // Add conversation history
      for (const msg of payload.conversation_history) {
        messages.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
      }
    }
    
    messages.push({ role: "user" as const, content: userPromptContent });

    const telemetry: ProviderTelemetry[] = [];
    const rawOutputs: unknown[] = [];
    let parsedResponse: AgentResponse | null = null;

    // Handle document_qa type with direct OpenAI call (no structured output needed)
    if (agentType === 'document_qa') {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (openaiKey) {
        const startTime = Date.now();
        try {
          const qaResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages,
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });

          const qaResult = await qaResponse.json();
          const latencyMs = Date.now() - startTime;
          
          telemetry.push({
            provider: 'openai',
            model: 'gpt-4o',
            latencyMs,
            tokenUsage: {
              promptTokens: qaResult.usage?.prompt_tokens,
              completionTokens: qaResult.usage?.completion_tokens,
              totalTokens: qaResult.usage?.total_tokens,
            },
          });
          rawOutputs.push(qaResult);

          const answer = qaResult.choices?.[0]?.message?.content;
          if (answer) {
            // For Q&A, return answer directly without persisting as run
            return new Response(
              JSON.stringify({
                success: true,
                answer,
                telemetry,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        } catch (qaError) {
          console.error('Document Q&A failed:', qaError);
          throw new Error('Failed to process document Q&A request');
        }
      }
    }

    // Check if this is BD contact analysis - use tool calling for structured output
    const contactData = (executionContext.filters as any)?.contact_data;
    const isBDAnalysis = contactData && agent.category === 'research';

    if (isBDAnalysis) {
      // Use OpenAI with tool calling for BD analysis
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (openaiKey) {
        const startTime = Date.now();
        try {
          const toolCallResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages,
              tools: [bdAnalysisToolSchema],
              tool_choice: { type: "function", function: { name: "provide_lead_analysis" } },
              temperature: 0.3,
            }),
          });

          const toolCallResult = await toolCallResponse.json();
          const latencyMs = Date.now() - startTime;
          
          telemetry.push({
            provider: 'openai',
            model: 'gpt-4o-mini',
            latencyMs,
            tokenUsage: {
              promptTokens: toolCallResult.usage?.prompt_tokens,
              completionTokens: toolCallResult.usage?.completion_tokens,
              totalTokens: toolCallResult.usage?.total_tokens,
            },
          });
          rawOutputs.push(toolCallResult);

          const toolCall = toolCallResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall && toolCall.function.name === "provide_lead_analysis") {
            const analysisData = JSON.parse(toolCall.function.arguments);
            
            // Ensure all required fields with defaults
            parsedResponse = {
              summary: analysisData.summary || "Analysis completed",
              findings: Array.isArray(analysisData.findings) ? analysisData.findings : [],
              recommendations: Array.isArray(analysisData.recommendations) ? analysisData.recommendations : [],
              action_items: Array.isArray(analysisData.action_items) ? analysisData.action_items : [],
              metrics: analysisData.metrics || {
                total_items_analyzed: 0,
                high_priority_issues: 0,
                anomalies_found: 0
              },
              confidence_score: analysisData.confidence_score ?? 0.5,
              insights: Array.isArray(analysisData.insights) ? analysisData.insights : ["No additional insights"],
              risks: Array.isArray(analysisData.risks) ? analysisData.risks : ["No risks identified"],
              structured_output: analysisData.structured_output || {
                lead_quality_score: "C",
                engagement_readiness: "warm",
                decision_maker_level: "Manager",
                best_approach: "consultative",
                estimated_deal_size: "Unknown",
                sales_cycle_estimate: "Unknown",
                recommended_next_step: "Conduct additional research",
                recommended_timing: "this week",
                key_talking_points: ["Initial contact recommended"]
              }
            };
            
            console.log('✅ BD Analysis completed with tool calling');
          } else {
            console.warn('⚠️ Tool call did not return expected format, falling back to standard flow');
          }
        } catch (toolError) {
          console.error('Tool calling failed, falling back to standard provider chain:', toolError);
          const latencyMs = Date.now() - startTime;
          telemetry.push({
            provider: 'openai',
            model: 'gpt-4o-mini',
            latencyMs,
            error: { message: toolError instanceof Error ? toolError.message : 'Tool calling failed' },
          });
        }
      }
    }

    // Check if this is LinkedIn message generation - use tool calling for structured output
    const isLinkedInMessage = (agent as any).slug === 'linkedin-message-generator' || agent.category === 'linkedin_outreach';

    if (isLinkedInMessage && !parsedResponse) {
      // Use OpenAI with tool calling for LinkedIn messages
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      
      if (openaiKey) {
        const startTime = Date.now();
        try {
          const toolCallResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages,
              tools: [linkedInMessageToolSchema],
              tool_choice: { type: "function", function: { name: "generate_linkedin_messages" } },
              temperature: 0.8,
            }),
          });

          const toolCallResult = await toolCallResponse.json();
          const latencyMs = Date.now() - startTime;
          
          telemetry.push({
            provider: 'openai',
            model: 'gpt-4o-mini',
            latencyMs,
            tokenUsage: {
              promptTokens: toolCallResult.usage?.prompt_tokens,
              completionTokens: toolCallResult.usage?.completion_tokens,
              totalTokens: toolCallResult.usage?.total_tokens,
            },
          });
          rawOutputs.push(toolCallResult);

          const toolCall = toolCallResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall && toolCall.function.name === "generate_linkedin_messages") {
            const linkedInData = JSON.parse(toolCall.function.arguments);
            
            // Return the structured LinkedIn message output
            parsedResponse = {
              summary: `Generated ${linkedInData.message_variants?.length || 0} LinkedIn message variants`,
              findings: [],
              recommendations: [],
              action_items: [],
              metrics: {
                total_items_analyzed: linkedInData.message_variants?.length || 0,
                high_priority_issues: 0,
                anomalies_found: 0
              },
              confidence_score: 0.9,
              structured_output: linkedInData
            };
            
            console.log('✅ LinkedIn message generation completed with tool calling');
          } else {
            console.warn('⚠️ LinkedIn tool call did not return expected format, falling back to standard flow');
          }
        } catch (toolError) {
          console.error('LinkedIn tool calling failed, falling back to standard provider chain:', toolError);
          const latencyMs = Date.now() - startTime;
          telemetry.push({
            provider: 'openai',
            model: 'gpt-4o-mini',
            latencyMs,
            error: { message: toolError instanceof Error ? toolError.message : 'Tool calling failed' },
          });
        }
      }
    }

    // Fallback to standard provider chain if tool calling wasn't used or failed
    if (!parsedResponse) {
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
    }

    if (!parsedResponse) {
      throw new Error("All providers failed to produce a valid response");
    }

    // Final validation: ensure all expected fields exist for BD analysis
    if (isBDAnalysis) {
      parsedResponse = {
        ...parsedResponse,
        insights: parsedResponse.insights || ["No additional insights available"],
        risks: parsedResponse.risks || ["No risks identified"],
        structured_output: parsedResponse.structured_output || {
          lead_quality_score: "C",
          engagement_readiness: "warm",
          decision_maker_level: "Manager",
          best_approach: "consultative",
          estimated_deal_size: "Unknown",
          sales_cycle_estimate: "Unknown",
          recommended_next_step: "Conduct additional research",
          recommended_timing: "this week",
          key_talking_points: ["Initial contact recommended"]
        }
      };
    }

    const structuredOutput = (parsedResponse as any).structured_output ?? parsedResponse;
    let enrichedClient: ClientRow | null = clientProfile;

    if (target === "client" && clientProfile) {
      const structuredData = typeof structuredOutput === "object" && structuredOutput
        ? structuredOutput as Record<string, unknown>
        : {};

      const updates: Record<string, unknown> = {};
      const nextIndustry = typeof structuredData.industry === "string" ? structuredData.industry.trim() : "";
      if (nextIndustry) {
        updates.industry = nextIndustry;
      }

      const nextEmployeeCount = normalizeNumericValue(structuredData.employee_count);
      if (nextEmployeeCount !== null) {
        updates.employee_count = nextEmployeeCount;
      }

      const nextRevenue = normalizeNumericValue(structuredData.revenue);
      if (nextRevenue !== null) {
        updates.revenue = nextRevenue;
      }

      const summaryNote = typeof structuredData.summary === "string"
        ? structuredData.summary.trim()
        : "";
      if (summaryNote) {
        updates.notes = summaryNote;
      }

      if (Object.keys(updates).length > 0) {
        try {
          const { data: updatedClient, error: updateError } = await client
            .from("clients")
            .update(updates)
            .eq("id", clientProfile.id)
            .select("id, name, website, industry, notes, employee_count, revenue")
            .maybeSingle();

          if (updateError) {
            throw updateError;
          }

          enrichedClient = (updatedClient as ClientRow | null) ?? { ...clientProfile, ...updates } as ClientRow;
        } catch (updateError) {
          console.error("Failed to update client with enriched data", updateError);
        }
      }
    }

    const runRecord = await persistRun(client, {
      agentId: agentId as string,
      userId,
      agentCategory: (agent as any).category ?? null,
      executionContext: executionContext,
      response: parsedResponse,
      providerTelemetry: telemetry,
      providerRawOutputs: rawOutputs,
      selectedFileIds: fileIds,
      userContext,
      structuredOutput,
    });

    const responsePayload: Record<string, unknown> = {
      success: true,
      run_id: (runRecord as any).id,
      summary: parsedResponse.summary,
      findings: parsedResponse.findings,
      recommendations: parsedResponse.recommendations,
      action_items: parsedResponse.action_items,
      structured_output: structuredOutput,
      telemetry,
    };

    if (target === "client" && enrichedClient) {
      responsePayload.enriched_client = {
        id: enrichedClient.id,
        name: enrichedClient.name,
        website: enrichedClient.website ?? null,
        industry: enrichedClient.industry ?? null,
        notes: enrichedClient.notes ?? null,
        employee_count: enrichedClient.employee_count ?? null,
        revenue: enrichedClient.revenue ?? null,
      };
      responsePayload.client_id = enrichedClient.id;
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
