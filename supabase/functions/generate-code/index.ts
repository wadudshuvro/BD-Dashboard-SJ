import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CodeGenerationRequest {
  template_id?: string;
  component_type: 'component' | 'hook' | 'api' | 'test' | 'utility' | 'page';
  name: string;
  description?: string;
  requirements?: string[];
  context?: {
    existing_patterns?: string[];
    framework?: string;
    styling_approach?: string;
    data_sources?: string[];
  };
  variables?: Record<string, any>;
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

    const request: CodeGenerationRequest = await req.json();
    const { template_id, component_type, name, description, requirements, context, variables } = request;

    console.log(`Generating ${component_type}: ${name}`);

    // Get template if specified
    let template = null;
    if (template_id) {
      const { data: templateData } = await supabaseClient
        .from('code_generation_templates')
        .select('*')
        .eq('id', template_id)
        .single();
      template = templateData;
    } else {
      // Get default template for component type
      const { data: templateData } = await supabaseClient
        .from('code_generation_templates')
        .select('*')
        .eq('category', component_type)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      template = templateData;
    }

    // Get AI configurations
    const { data: configurations } = await supabaseClient
      .from('ai_configurations')
      .select('*')
      .in('configuration_type', ['development_context', 'code_generation_rules']);

    const devContext = configurations?.find(c => c.configuration_type === 'development_context')?.configuration_data || {};
    const codeRules = configurations?.find(c => c.configuration_type === 'code_generation_rules')?.configuration_data || {};

    // Prepare generation prompt
    const systemPrompt = `You are an expert code generator specializing in ${context?.framework || 'React/TypeScript'} applications. Generate high-quality, production-ready code that follows established patterns and best practices.

Key Requirements:
- Follow the project's existing patterns and conventions
- Use TypeScript with proper type definitions
- Include proper error handling and validation
- Follow the established file structure and naming conventions
- Include relevant imports and exports
- Add helpful comments for complex logic
- Ensure the code is maintainable and scalable

Project Context:
${JSON.stringify(devContext, null, 2)}

Code Generation Rules:
${JSON.stringify(codeRules, null, 2)}`;

    const userPrompt = `Generate a ${component_type} named "${name}".

${description ? `Description: ${description}` : ''}

${requirements?.length ? `Requirements:\n${requirements.map(req => `- ${req}`).join('\n')}` : ''}

${context ? `Additional Context:\n${JSON.stringify(context, null, 2)}` : ''}

${template ? `Base Template:\n\`\`\`\n${template.template_content}\n\`\`\`` : ''}

${variables ? `Template Variables:\n${JSON.stringify(variables, null, 2)}` : ''}

Please generate the complete code with:
1. Proper TypeScript interfaces and types
2. Error handling and loading states
3. Responsive design (if UI component)
4. Proper imports and exports
5. Inline documentation for complex parts

Return the generated code in a structured format with:
- filename: suggested file path
- content: the complete code
- imports: list of required dependencies
- usage_example: how to use this component/function
- tests: basic test structure if applicable`;

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
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 4000,
      }),
    });

    const aiResponse = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiResponse);
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const generatedCode = aiResponse.choices[0].message.content;
    console.log('Code generation completed');

    // Try to parse structured response
    let codeResult;
    try {
      codeResult = JSON.parse(generatedCode);
    } catch {
      // If not JSON, treat as raw code
      codeResult = {
        filename: `${name}.${context?.framework === 'React' ? 'tsx' : 'ts'}`,
        content: generatedCode,
        imports: [],
        usage_example: '',
        tests: ''
      };
    }

    // Update template usage count if used
    if (template) {
      await supabaseClient
        .from('code_generation_templates')
        .update({ usage_count: (template.usage_count || 0) + 1 })
        .eq('id', template.id);
    }

    // Log the generation for analytics
    const { error: logError } = await supabaseClient
      .from('ai_agent_runs')
      .insert({
        agent_id: (await supabaseClient.from('ai_agents').select('id').eq('slug', 'code-generator').single())?.data?.id,
        title: `Code Generation: ${name}`,
        ai_summary: {
          type: 'code_generation',
          component_type,
          name,
          success: true,
          generated_files: [codeResult.filename]
        },
        generated_tasks: [{
          type: 'code_generated',
          title: `Review generated ${component_type}: ${name}`,
          description: `Review and integrate the generated ${component_type} code`,
          priority: 'medium'
        }],
        executed_by: user.id,
        status: 'completed'
      });

    if (logError) {
      console.error('Error logging code generation:', logError);
    }

    return new Response(JSON.stringify({
      success: true,
      component_type,
      name,
      generated_code: codeResult,
      template_used: template?.name || 'Default',
      generation_summary: `Successfully generated ${component_type} "${name}"`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-code function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});