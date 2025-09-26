import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CodebaseAnalysisRequest {
  repository_id: string;
  analysis_type: 'architecture' | 'quality' | 'security' | 'performance' | 'documentation';
  files?: string[];
  context?: any;
}

interface CodeAnalysis {
  type: string;
  findings: any[];
  severity: 'info' | 'warning' | 'error' | 'critical';
  file_path?: string;
  recommendations: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { repository_id, analysis_type, files, context }: CodebaseAnalysisRequest = await req.json();

    console.log(`Starting ${analysis_type} analysis for repository ${repository_id}`);

    // Get repository information
    const { data: repository, error: repoError } = await supabaseClient
      .from('code_repositories')
      .select('*')
      .eq('id', repository_id)
      .single();

    if (repoError || !repository) {
      return new Response(JSON.stringify({ error: 'Repository not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update repository status
    await supabaseClient
      .from('code_repositories')
      .update({ analysis_status: 'analyzing', last_analyzed_at: new Date().toISOString() })
      .eq('id', repository_id);

    // Get AI configurations for code analysis
    const { data: configurations } = await supabaseClient
      .from('ai_configurations')
      .select('*')
      .in('configuration_type', ['code_analysis_prompts', 'development_context']);

    const analysisPrompts = configurations?.find(c => c.configuration_type === 'code_analysis_prompts')?.configuration_data || {};
    const devContext = configurations?.find(c => c.configuration_type === 'development_context')?.configuration_data || {};

    // Prepare analysis prompt based on type
    let systemPrompt = '';
    let analysisPrompt = '';

    switch (analysis_type) {
      case 'architecture':
        systemPrompt = 'You are a senior software architect. Analyze the codebase architecture and provide detailed insights.';
        analysisPrompt = analysisPrompts.architecture_analysis || 'Analyze the codebase architecture and identify main patterns, component structure, data flow, scalability concerns, and improvement opportunities.';
        break;
      case 'quality':
        systemPrompt = 'You are a code quality expert. Review the code for best practices, bugs, and improvements.';
        analysisPrompt = analysisPrompts.quality_review || 'Review this code for best practices adherence, potential bugs, security vulnerabilities, performance issues, and maintainability concerns.';
        break;
      case 'security':
        systemPrompt = 'You are a security expert. Analyze the code for security vulnerabilities and risks.';
        analysisPrompt = 'Analyze this code for security vulnerabilities, authentication issues, data validation problems, and potential attack vectors.';
        break;
      case 'performance':
        systemPrompt = 'You are a performance optimization expert. Identify performance bottlenecks and optimization opportunities.';
        analysisPrompt = 'Analyze this code for performance issues, bottlenecks, inefficient algorithms, and optimization opportunities.';
        break;
      case 'documentation':
        systemPrompt = 'You are a technical documentation specialist. Generate comprehensive documentation.';
        analysisPrompt = analysisPrompts.documentation_generation || 'Generate comprehensive documentation including API references, component guides, setup instructions, and architectural overview.';
        break;
    }

    // Prepare context for OpenAI
    const contextData = {
      repository: repository.name,
      framework: repository.framework || 'Unknown',
      language: repository.language || 'TypeScript',
      development_context: devContext,
      files_analyzed: files || [],
      additional_context: context || {}
    };

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${analysisPrompt}\n\nContext: ${JSON.stringify(contextData, null, 2)}` }
        ],
        max_completion_tokens: 4000,
      }),
    });

    const aiResponse = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiResponse);
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const analysisResult = aiResponse.choices[0].message.content;
    console.log('AI Analysis completed');

    // Parse the analysis result into structured findings
    let findings: CodeAnalysis[] = [];
    let overallSeverity: 'info' | 'warning' | 'error' | 'critical' = 'info';

    try {
      // Try to parse structured response
      const parsedResult = JSON.parse(analysisResult);
      findings = Array.isArray(parsedResult) ? parsedResult : [parsedResult];
    } catch {
      // If not JSON, create a single finding with the full analysis
      findings = [{
        type: analysis_type,
        findings: [{ content: analysisResult }],
        severity: 'info',
        recommendations: []
      }];
    }

    // Determine overall severity
    const severityLevels = { 'info': 1, 'warning': 2, 'error': 3, 'critical': 4 };
    findings.forEach(finding => {
      if (severityLevels[finding.severity] > severityLevels[overallSeverity]) {
        overallSeverity = finding.severity;
      }
    });

    // Save analysis results to database
    const analysisResults = findings.map(finding => ({
      repository_id,
      analysis_type,
      file_path: finding.file_path,
      findings: finding,
      severity: finding.severity,
      status: 'active'
    }));

    const { error: insertError } = await supabaseClient
      .from('code_analysis_results')
      .insert(analysisResults);

    if (insertError) {
      console.error('Error saving analysis results:', insertError);
    }

    // Update repository status to completed
    await supabaseClient
      .from('code_repositories')
      .update({ 
        analysis_status: 'completed',
        metadata: { 
          ...repository.metadata,
          last_analysis: {
            type: analysis_type,
            severity: overallSeverity,
            findings_count: findings.length,
            timestamp: new Date().toISOString()
          }
        }
      })
      .eq('id', repository_id);

    return new Response(JSON.stringify({
      success: true,
      repository_id,
      analysis_type,
      findings_count: findings.length,
      overall_severity: overallSeverity,
      analysis_summary: analysisResult.substring(0, 500) + '...'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-codebase function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});