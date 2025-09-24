import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const client = await getClient(req);
  const userId = await requireAuth(client);

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      // Get current CollabAI configuration for the user
      const { data: config, error } = await client
        .from('collabai_integrations')
        .select('base_url, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      return new Response(JSON.stringify({
        ok: true,
        configured: !!config,
        baseUrl: config?.base_url || '',
        enabled: config?.is_active || false
      }), { headers: corsHeaders });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, apiKey, baseUrl } = body;

      if (action === 'test') {
        // Test CollabAI connection
        if (!apiKey || !baseUrl) {
          return new Response(JSON.stringify({ ok: false, error: 'API key and Base URL required' }), 
            { status: 400, headers: corsHeaders });
        }

        try {
          const testUrl = `${baseUrl.replace(/\/+$/, '')}/api/assistants/n8n/assistant-list?page=1&pageSize=1`;
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`Connection failed (${response.status})`);
          }

          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        } catch (error) {
          return new Response(JSON.stringify({ 
            ok: false, 
            error: error instanceof Error ? error.message : 'Connection test failed' 
          }), { status: 400, headers: corsHeaders });
        }
      }

      if (action === 'save') {
        if (!apiKey || !baseUrl) {
          return new Response(JSON.stringify({ ok: false, error: 'API key and Base URL required' }), 
            { status: 400, headers: corsHeaders });
        }

        // First test the connection
        try {
          const testUrl = `${baseUrl.replace(/\/+$/, '')}/api/assistants/n8n/assistant-list?page=1&pageSize=1`;
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`Connection failed (${response.status})`);
          }
        } catch (error) {
          return new Response(JSON.stringify({ 
            ok: false, 
            error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }), { status: 400, headers: corsHeaders });
        }

        // Deactivate existing integrations
        await client
          .from('collabai_integrations')
          .update({ is_active: false })
          .eq('user_id', userId);

        // Save new integration
        const { error: saveError } = await client
          .from('collabai_integrations')
          .insert({
            user_id: userId,
            api_key_encrypted: apiKey,
            base_url: baseUrl.replace(/\/+$/, ''),
            is_active: true
          });

        if (saveError) throw saveError;

        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: 'Unsupported action' }), 
      { status: 400, headers: corsHeaders });
  } catch (error) {
    console.error('[collabai-manage]', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), { status: 500, headers: corsHeaders });
  }
});