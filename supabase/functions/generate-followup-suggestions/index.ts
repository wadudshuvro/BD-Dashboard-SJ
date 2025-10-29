import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { dealId, contactId } = await req.json();

    // Fetch deal or contact data with related information
    let contextData: any = {};
    let entityType = '';
    let entityId = '';

    if (dealId) {
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .select(`
          *,
          client:clients(name, industry, website),
          deal_comments(comment, created_at, user_id),
          deal_checklist_items(title, is_completed)
        `)
        .eq('id', dealId)
        .single();

      if (dealError) throw dealError;
      contextData = deal;
      entityType = 'deal';
      entityId = dealId;

      // Get last activity date
      const { data: lastComment } = await supabase
        .from('deal_comments')
        .select('created_at')
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      contextData.lastActivity = lastComment?.created_at;
    } else if (contactId) {
      const { data: contact, error: contactError } = await supabase
        .from('campaign_contacts')
        .select(`
          *,
          campaign:bd_campaigns(name, status, campaign_type),
          campaign_contact_comments(comment, created_at)
        `)
        .eq('id', contactId)
        .single();

      if (contactError) throw contactError;
      contextData = contact;
      entityType = 'contact';
      entityId = contactId;

      const { data: lastComment } = await supabase
        .from('campaign_contact_comments')
        .select('created_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      contextData.lastActivity = lastComment?.created_at;
    } else {
      throw new Error('Either dealId or contactId is required');
    }

    // Build AI prompt for generating follow-up suggestions
    const systemPrompt = `You are a business development assistant helping sales teams with intelligent follow-up strategies. 
Based on the context provided, suggest 3-5 follow-up actions with:
1. Recommended timing (calculate days from now)
2. Type of follow-up (email, call, linkedin, meeting)
3. Priority level (low, medium, high, urgent)
4. Clear reasoning for each suggestion
5. A personalized message draft for each follow-up

Consider:
- Time since last contact
- Deal/contact stage and status
- Industry best practices for the type of engagement
- Pending tasks or incomplete checklist items
- Previous communication patterns`;

    const userPrompt = entityType === 'deal'
      ? `Deal Context:
- Title: ${contextData.title}
- Stage: ${contextData.stage}
- Status: ${contextData.status}
- Client: ${contextData.client?.name}
- Industry: ${contextData.client?.industry}
- Amount: $${contextData.amount || 'Not specified'}
- Last Activity: ${contextData.lastActivity ? new Date(contextData.lastActivity).toLocaleDateString() : 'No recent activity'}
- Recent Comments: ${contextData.deal_comments?.slice(0, 3).map((c: any) => c.comment).join('; ') || 'None'}
- Incomplete Tasks: ${contextData.deal_checklist_items?.filter((t: any) => !t.is_completed).map((t: any) => t.title).join(', ') || 'None'}

Generate follow-up suggestions to move this deal forward.`
      : `Contact Context:
- Name: ${contextData.contact_name}
- Company: ${contextData.contact_company}
- Title: ${contextData.current_position_title}
- Status: ${contextData.status}
- Campaign: ${contextData.campaign?.name}
- Campaign Type: ${contextData.campaign?.campaign_type}
- Last Activity: ${contextData.lastActivity ? new Date(contextData.lastActivity).toLocaleDateString() : 'No recent activity'}
- Recent Comments: ${contextData.campaign_contact_comments?.slice(0, 3).map((c: any) => c.comment).join('; ') || 'None'}

Generate follow-up suggestions to engage this contact effectively.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'create_followup_suggestions',
            description: 'Create intelligent follow-up suggestions',
            parameters: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      days_from_now: { type: 'number', description: 'Days from today to schedule follow-up' },
                      type: { type: 'string', enum: ['email', 'call', 'linkedin', 'meeting', 'other'] },
                      priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                      reasoning: { type: 'string', description: 'Why this follow-up is recommended' },
                      message_draft: { type: 'string', description: 'Personalized message for this follow-up' },
                      topic: { type: 'string', description: 'Brief topic/subject of the follow-up' }
                    },
                    required: ['days_from_now', 'type', 'priority', 'reasoning', 'message_draft', 'topic']
                  }
                }
              },
              required: ['suggestions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'create_followup_suggestions' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const suggestionsData = JSON.parse(toolCall.function.arguments);

    // Insert suggestions into database
    const suggestions = suggestionsData.suggestions.map((s: any) => {
      const suggestedDate = new Date();
      suggestedDate.setDate(suggestedDate.getDate() + s.days_from_now);

      return {
        user_id: user.id,
        ...(dealId ? { deal_id: dealId } : { campaign_contact_id: contactId }),
        suggested_date: suggestedDate.toISOString().split('T')[0],
        suggested_type: s.type,
        suggested_priority: s.priority,
        reasoning: s.reasoning,
        ai_message_draft: s.message_draft,
        metadata: { topic: s.topic }
      };
    });

    const { data: insertedSuggestions, error: insertError } = await supabase
      .from('followup_suggestions')
      .insert(suggestions)
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        suggestions: insertedSuggestions,
        count: insertedSuggestions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating follow-up suggestions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
