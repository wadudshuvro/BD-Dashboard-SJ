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

    // Call CollabAI API
    const chatUrl = `${integration.base_url}/api/chat/completions`;
    
    console.log('[collabai-chat] Calling CollabAI:', { url: chatUrl, agentId });
    
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${integration.api_key_encrypted}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: agentId,
        messages: [
          { role: 'user', content: message }
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[collabai-chat] CollabAI API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `CollabAI API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || data.response || '';

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
