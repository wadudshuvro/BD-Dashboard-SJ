import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  synced: number;
  updated: number;
  failed: number;
  errors: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[Sync] Starting Control Tower sync for user: ${user.id}`);

    // Fetch Control Tower configuration from ai_configurations table
    const { data: configData, error: configError } = await supabase
      .from('ai_configurations')
      .select('configuration_data')
      .eq('user_id', user.id)
      .eq('configuration_type', 'control_tower')
      .single();

    if (configError || !configData) {
      // Try to get from env variables as fallback
      const envUrl = Deno.env.get('VITE_CONTROL_TOWER_URL');
      const envKey = Deno.env.get('VITE_CONTROL_TOWER_ANON_KEY');
      
      if (!envUrl || !envKey) {
        throw new Error('Control Tower not configured. Please configure in settings.');
      }

      console.log('[Sync] Using Control Tower config from environment variables');
      
      const ctClient = createClient(envUrl, envKey);
      return await performSync(ctClient, supabase, user.id);
    }

    const config = configData.configuration_data as { url: string; anon_key: string };
    
    if (!config.url || !config.anon_key) {
      throw new Error('Invalid Control Tower configuration');
    }

    console.log('[Sync] Using Control Tower config from database');

    // Create Control Tower client with server-side credentials
    const ctClient = createClient(config.url, config.anon_key);

    return await performSync(ctClient, supabase, user.id);

  } catch (error) {
    console.error('[Sync] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        synced: 0,
        updated: 0,
        failed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function performSync(
  ctClient: any,
  supabase: any,
  userId: string
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Fetch all active deals from Control Tower in one query
    console.log('[Sync] Fetching active deals from Control Tower...');
    const { data: ctDeals, error: fetchError } = await ctClient
      .from('deals')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      console.error('[Sync] Error fetching deals:', fetchError);
      throw new Error(`Failed to fetch deals: ${fetchError.message}`);
    }

    if (!ctDeals || ctDeals.length === 0) {
      console.log('[Sync] No active deals found');
      return new Response(
        JSON.stringify({ 
          synced: 0, 
          updated: 0, 
          failed: 0, 
          errors: [] 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Sync] Found ${ctDeals.length} active deals to sync`);

    // Transform deals for bulk upsert
    const transformedDeals = ctDeals.map((ctDeal: any) => ({
      control_tower_id: ctDeal.id,
      title: ctDeal.deal_name || ctDeal.title || 'Untitled Deal',
      amount: ctDeal.value || ctDeal.amount || 0,
      stage: ctDeal.stage || 'new',
      close_date: ctDeal.close_date || null,
      control_tower_client_id: ctDeal.client_id || null,
      control_tower_owner_id: ctDeal.owner_id || null,
      control_tower_status: ctDeal.status || 'active',
      synced_from_control_tower: true,
      last_synced_at: new Date().toISOString(),
      probability: ctDeal.probability || null
    }));

    // Perform bulk upsert
    console.log('[Sync] Performing bulk upsert...');
    const { data: upsertedDeals, error: upsertError } = await supabase
      .from('deals')
      .upsert(transformedDeals, {
        onConflict: 'control_tower_id',
        ignoreDuplicates: false
      })
      .select('control_tower_id');

    if (upsertError) {
      console.error('[Sync] Bulk upsert error:', upsertError);
      throw new Error(`Failed to sync deals: ${upsertError.message}`);
    }

    const syncedCount = upsertedDeals?.length || transformedDeals.length;
    const duration = Date.now() - startTime;

    console.log(`[Sync] Successfully synced ${syncedCount} deals in ${duration}ms`);

    // Log sync operation to audit log (optional)
    try {
      await supabase
        .from('sync_audit_log')
        .insert({
          sync_type: 'deals',
          user_id: userId,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          status: 'success',
          records_synced: syncedCount,
          records_updated: syncedCount,
          records_failed: 0,
          error_details: null
        });
    } catch (auditError) {
      // Don't fail the sync if audit logging fails
      console.warn('[Sync] Failed to log audit record:', auditError);
    }

    const result: SyncResult = {
      synced: syncedCount,
      updated: syncedCount,
      failed: 0,
      errors: []
    };

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Sync] Failed after ${duration}ms:`, error);

    // Log failed sync to audit log
    try {
      await supabase
        .from('sync_audit_log')
        .insert({
          sync_type: 'deals',
          user_id: userId,
          started_at: new Date(startTime).toISOString(),
          completed_at: new Date().toISOString(),
          status: 'failed',
          records_synced: 0,
          records_updated: 0,
          records_failed: 0,
          error_details: { message: error instanceof Error ? error.message : 'Unknown error' }
        });
    } catch (auditError) {
      console.warn('[Sync] Failed to log audit record:', auditError);
    }

    throw error;
  }
}
