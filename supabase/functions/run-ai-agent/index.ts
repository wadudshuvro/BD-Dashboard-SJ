import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRunRequest {
  agent_id: string;
  execution_context: {
    timeframe?: string;
    filters?: any;
    office_ids?: string[];
    user_id: string;
  };
}

interface AIAnalysisResponse {
  summary: string;
  key_findings: string[];
  recommendations: string[];
  action_items: Array<{
    type: 'task';
    description: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    due_date?: string;
    confidence: number;
  }>;
  metrics: {
    total_items_analyzed: number;
    anomalies_found: number;
    high_priority_issues: number;
  };
  confidence_score?: number;
}

async function getClient(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, serviceKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    auth: { persistSession: false },
  });
}

async function requireAuth(client: any): Promise<string | null> {
  const { data: { user } } = await client.auth.getUser();
  return user?.id || null;
}

async function fetchConfigurations(client: any) {
  const { data: configs, error } = await client
    .from('ai_configurations')
    .select('configuration_type, configuration_data');
  
  if (error) throw error;
  
  const configMap: Record<string, any> = {};
  configs?.forEach((config: any) => {
    configMap[config.configuration_type] = config.configuration_data;
  });
  
  return {
    businessContext: configMap.business_context || {},
    modelSettings: configMap.model_settings || { default_model: 'gpt-4o-mini' },
    prompts: configMap.prompts || {}
  };
}

function getModelParameters(modelSettings: any) {
  const model = modelSettings.default_model || 'gpt-4o-mini';
  const params: any = { model };
  
  // Newer models (GPT-5, O3, O4) use max_completion_tokens and don't support temperature
  if (model.includes('gpt-5') || model.includes('o3') || model.includes('o4')) {
    if (modelSettings.max_completion_tokens) {
      params.max_completion_tokens = modelSettings.max_completion_tokens;
    }
    // Don't set temperature for newer models
  } else {
    // Legacy models (GPT-4, GPT-4o) use max_tokens and support temperature
    if (modelSettings.max_tokens) {
      params.max_tokens = modelSettings.max_tokens;
    }
    if (modelSettings.temperature !== undefined) {
      params.temperature = modelSettings.temperature;
    }
  }
  
  return params;
}

function assemblePrompt(agent: any, businessContext: any, prompts: any, executionContext: any) {
  let systemPrompt = agent.system_prompt;
  
  // Replace business context variables
  if (businessContext.company_name) {
    systemPrompt = systemPrompt.replace(/\{company_name\}/g, businessContext.company_name);
  }
  if (businessContext.industry) {
    systemPrompt = systemPrompt.replace(/\{industry\}/g, businessContext.industry);
  }
  
  // Add seasonal context if available
  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const seasonalRule = businessContext.seasonal_rules?.[`Q${currentQuarter}`];
  if (seasonalRule) {
    systemPrompt += `\n\nSeasonal Context: ${seasonalRule}`;
  }
  
  // Add company policies
  if (businessContext.company_policies) {
    systemPrompt += `\n\nCompany Policies: ${businessContext.company_policies}`;
  }
  
  return systemPrompt;
}

function parseAIResponse(responseText: string): AIAnalysisResponse {
  try {
    // Try direct JSON parsing first
    return JSON.parse(responseText);
  } catch (e) {
    console.log('Direct JSON parse failed, trying cleanup approaches...');
    
    // Try to extract JSON from markdown code blocks
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]);
      } catch (e2) {
        console.log('Code block JSON parse failed');
      }
    }
    
    // Try to find JSON-like content
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e3) {
        console.log('JSON pattern match failed');
      }
    }
    
    // Fallback: create structured response from text
    return {
      summary: responseText.substring(0, 500),
      key_findings: ['Analysis completed but response format needs adjustment'],
      recommendations: ['Review AI response format configuration'],
      action_items: [],
      metrics: {
        total_items_analyzed: 0,
        anomalies_found: 0,
        high_priority_issues: 0
      },
      confidence_score: 0.5
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const client = await getClient(req);
  const userId = await requireAuth(client);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: corsHeaders 
    });
  }

  try {
    const body: AgentRunRequest = await req.json();
    const { agent_id, execution_context } = body;

    console.log('Running AI agent:', agent_id);

    // Fetch agent configuration
    const { data: agent, error: agentError } = await client
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .single();

    if (agentError || !agent) {
      throw new Error('Agent not found or access denied');
    }

    // Fetch system configurations
    const configs = await fetchConfigurations(client);
    
    // Assemble system prompt with business context
    const systemPrompt = assemblePrompt(agent, configs.businessContext, configs.prompts, execution_context);
    
    // Prepare model parameters
    const modelParams = getModelParameters(configs.modelSettings);
    
    // Simulate data fetching (replace with actual data queries based on agent.data_sources)
    const analysisData = {
      timeframe: execution_context.timeframe || 'current_month',
      category: agent.category,
      context: 'Sample data for analysis'
    };
    
    const userPrompt = `
Analyze the following data and provide a structured response in JSON format:

Data Context: ${JSON.stringify(analysisData)}
Analysis Category: ${agent.category}
Timeframe: ${execution_context.timeframe || 'current_month'}

Please provide your analysis in the following JSON structure:
{
  "summary": "Brief summary of findings",
  "key_findings": ["Finding 1", "Finding 2", "Finding 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "action_items": [
    {
      "type": "task",
      "description": "Action description",
      "priority": "high|medium|low",
      "confidence": 0.85
    }
  ],
  "metrics": {
    "total_items_analyzed": 100,
    "anomalies_found": 5,
    "high_priority_issues": 2
  },
  "confidence_score": 0.85
}
`;

    console.log('Calling OpenAI with model:', modelParams.model);

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...modelParams,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiResult = await openaiResponse.json();
    const aiResponseText = openaiResult.choices[0].message.content;
    
    console.log('Raw AI Response:', aiResponseText);
    
    // Parse AI response with enhanced error handling
    const parsedResponse = parseAIResponse(aiResponseText);
    
    // Create agent run record
    const { data: agentRun, error: runError } = await client
      .from('ai_agent_runs')
      .insert({
        agent_id,
        executed_by: userId,
        execution_context,
        ai_summary: parsedResponse,
        generated_tasks: parsedResponse.action_items || [],
        status: 'completed',
        title: `${agent.name} - ${new Date().toISOString().split('T')[0]}`,
        category: agent.category
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating agent run:', runError);
      throw runError;
    }

    console.log('Agent run completed successfully:', agentRun.id);

    return new Response(JSON.stringify({
      success: true,
      run_id: agentRun.id,
      summary: parsedResponse.summary,
      tasks_created: parsedResponse.action_items?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in run-ai-agent function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});