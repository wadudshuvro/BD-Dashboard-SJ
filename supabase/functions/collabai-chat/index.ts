import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { agentId, message, conversationId } = await req.json();

    if (!agentId || !message) {
      return new Response(JSON.stringify({ error: 'Missing agentId or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get agent and integration details
    const { data: agent, error: agentError } = await supabase
      .from('collabai_agents')
      .select('*, integration:collabai_integrations!inner(*)')
      .eq('agent_id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('[collabai-chat] Agent not found:', agentError);
      return new Response(JSON.stringify({ error: 'Agent not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const integration = (agent as any).integration;
    
    // Get or create conversation
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: newConvo, error: convoError } = await supabase
        .from('collabai_conversations')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          integration_id: integration.id,
          title: message.substring(0, 50),
        })
        .select()
        .single();

      if (convoError) {
        console.error('[collabai-chat] Failed to create conversation:', convoError);
      } else {
        currentConversationId = newConvo.id;
      }
    }

    // Save user message
    if (currentConversationId) {
      await supabase.from('collabai_messages').insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
      });
    }

    // Call CollabAI API - try multiple possible endpoints
    const baseUrl = integration.base_url.replace(/\/+$/, '');
    
    // Try different possible endpoint patterns
    const possibleEndpoints = [
      `${baseUrl}/api/assistants/n8n/${agentId}/chat`,
      `${baseUrl}/api/assistants/${agentId}/chat`,
      `${baseUrl}/api/chat/${agentId}`,
      `${baseUrl}/api/v1/assistants/${agentId}/messages`,
    ];
    
    let lastError = null;
    let assistantMessage = '';
    
    for (const chatUrl of possibleEndpoints) {
      try {
        console.log('[collabai-chat] Trying endpoint:', chatUrl);
        
        const response = await fetch(chatUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${integration.api_key_encrypted}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            messages: [{ role: 'user', content: message }],
          }),
        });

        console.log('[collabai-chat] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[collabai-chat] Success with endpoint:', chatUrl);
          assistantMessage = data.response || data.message || data.choices?.[0]?.message?.content || data.content || '';
          break; // Success, exit loop
        } else {
          const errorText = await response.text();
          lastError = { status: response.status, url: chatUrl, error: errorText };
          console.log('[collabai-chat] Failed with status:', response.status, 'trying next endpoint...');
          continue; // Try next endpoint
        }
      } catch (err) {
        console.error('[collabai-chat] Request failed:', err);
        lastError = { url: chatUrl, error: err instanceof Error ? err.message : 'Unknown error' };
        continue; // Try next endpoint
      }
    }
    
    // If all endpoints failed
    if (!assistantMessage && lastError) {
      console.error('[collabai-chat] All endpoints failed. Last error:', lastError);
      return new Response(
        JSON.stringify({ 
          error: `Unable to reach CollabAI chat API. Please contact support with this error: ${JSON.stringify(lastError)}` 
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Save assistant message
    if (currentConversationId && assistantMessage) {
      await supabase.from('collabai_messages').insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: assistantMessage,
      });
    }

    return new Response(
      JSON.stringify({ 
        response: assistantMessage,
        conversationId: currentConversationId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[collabai-chat] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
