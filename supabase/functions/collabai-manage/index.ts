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

      // Get the global base URL setting (set by admin)
      let globalBaseUrl = 'https://api.collabai.com'; // Default fallback
      try {
        // Prefer env override if provided
        const envBaseUrl = Deno.env.get('COLLABAI_BASE_URL');
        if (envBaseUrl) globalBaseUrl = envBaseUrl;

        // Attempt to derive base URL from API key (format: part1.part2.base64Url)
        if (apiKey) {
          const parts = apiKey.split('.');
          const b64 = parts[2];
          if (b64) {
            const decoded = atob(b64).trim();
            if (decoded.startsWith('http')) {
              globalBaseUrl = decoded.replace(/\/+$/, '');
              console.log('[collabai-manage] Derived base URL from API key:', globalBaseUrl);
            }
          }
        }
      } catch (e) {
        console.log('[collabai-manage] Using default CollabAI base URL');
      }

      if (action === 'test') {
        // For user testing, only require API key (use global base URL)
        if (!apiKey) {
          console.error('[collabai-manage] Missing API key for test action');
          return new Response(JSON.stringify({ ok: false, error: 'API key required' }), 
            { status: 400, headers: corsHeaders });
        }

        try {
          const testUrl = `${globalBaseUrl.replace(/\/+$/, '')}/api/assistants/n8n/assistant-list?page=1&pageSize=1`;
          console.log('[collabai-manage] Testing connection to:', testUrl);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('[collabai-manage] Test response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[collabai-manage] Test failed with status:', response.status, 'body:', errorText);
            throw new Error(`Connection failed (${response.status}): ${errorText}`);
          }

          const responseData = await response.json();
          console.log('[collabai-manage] Test successful, response:', responseData);
          
          return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
        } catch (error) {
          console.error('[collabai-manage] Test error:', error);
          return new Response(JSON.stringify({ 
            ok: false, 
            error: error instanceof Error ? error.message : 'Connection test failed' 
          }), { status: 400, headers: corsHeaders });
        }
      }

      if (action === 'save') {
        // For user saving, only require API key (use global base URL)
        if (!apiKey) {
          console.error('[collabai-manage] Missing API key for save action');
          return new Response(JSON.stringify({ ok: false, error: 'API key required' }), 
            { status: 400, headers: corsHeaders });
        }

        // First test the connection with global base URL
        try {
          const testUrl = `${globalBaseUrl.replace(/\/+$/, '')}/api/assistants/n8n/assistant-list?page=1&pageSize=1`;
          console.log('[collabai-manage] Testing connection before save to:', testUrl);
          
          const response = await fetch(testUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('[collabai-manage] Save test response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('[collabai-manage] Save test failed with status:', response.status, 'body:', errorText);
            throw new Error(`Connection failed (${response.status}): ${errorText}`);
          }
          
          console.log('[collabai-manage] Connection test successful, proceeding with save');
        } catch (error) {
          console.error('[collabai-manage] Save test error:', error);
          return new Response(JSON.stringify({ 
            ok: false, 
            error: `Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }), { status: 400, headers: corsHeaders });
        }

        // Deactivate existing integrations for this user
        console.log('[collabai-manage] Deactivating existing integrations for user:', userId);
        const { error: deactivateError } = await client
          .from('collabai_integrations')
          .update({ is_active: false })
          .eq('user_id', userId);

        if (deactivateError) {
          console.error('[collabai-manage] Error deactivating integrations:', deactivateError);
          throw deactivateError;
        }

        // Save new integration with global base URL
        console.log('[collabai-manage] Saving new integration for user:', userId);
        const { error: saveError } = await client
          .from('collabai_integrations')
          .insert({
            user_id: userId,
            api_key_encrypted: apiKey,
            base_url: globalBaseUrl.replace(/\/+$/, ''),
            is_active: true
          });

        if (saveError) {
          console.error('[collabai-manage] Error saving integration:', saveError);
          throw saveError;
        }

        console.log('[collabai-manage] Integration saved successfully');
        return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
      }

      if (action === 'save_base_url' && baseUrl) {
        // Admin action to save global base URL (you might want to add admin check here)
        // For now, we'll just return success as we're using environment variable
        return new Response(JSON.stringify({ ok: true, message: 'Base URL configuration noted' }), { headers: corsHeaders });
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