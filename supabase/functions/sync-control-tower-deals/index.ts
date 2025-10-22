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

    // Get Control Tower credentials from edge secrets
    const envUrl = Deno.env.get('Controltowerurl');
    const envKey = Deno.env.get('CONTROLTOWERAPIKEY');
    
    if (!envUrl || !envKey) {
      throw new Error('Control Tower credentials not configured in edge secrets');
    }

    console.log('[Sync] Using Control Tower credentials from edge secrets');
    
    // Create Control Tower client with server-side credentials
    const ctClient = createClient(envUrl, envKey);

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

// Stage mapping from Control Tower to local pipeline stages
const STAGE_MAPPING: Record<string, string> = {
  'appointmentscheduled': 'prospecting',
  'qualifiedtobuy': 'qualification',
  'presentationscheduled': 'proposal',
  'decisionmakerboughtin': 'proposal',
  'contractsent': 'negotiation',
  'closedwon': 'closed_won',
  'closedlost': 'closed_lost',
  // Numeric ID mappings (from Control Tower)
  '960993642': 'prospecting',
  '960993643': 'qualification',
  '960993644': 'proposal',
  '960993645': 'negotiation',
};

function mapStage(ctStage: any, stageName?: string): string {
  if (!ctStage) return 'prospecting';
  
  // Log for debugging
  console.log('[Sync] Mapping stage:', { ctStage, stageName });
  
  // If we have a stage name, use it
  if (stageName) {
    const nameStr = String(stageName).toLowerCase().replace(/\s+/g, '');
    if (STAGE_MAPPING[nameStr]) {
      console.log('[Sync] Mapped by name:', nameStr, '->', STAGE_MAPPING[nameStr]);
      return STAGE_MAPPING[nameStr];
    }
  }
  
  // Try mapping the stage ID/value
  const stageStr = String(ctStage).toLowerCase().replace(/\s+/g, '');
  const mapped = STAGE_MAPPING[stageStr] || 'prospecting';
  console.log('[Sync] Mapped by ID:', stageStr, '->', mapped);
  return mapped;
}

async function getOrCreateClient(
  supabase: any,
  ctDeal: any
): Promise<string | null> {
  const clientCompany = ctDeal.clientCompanyName || ctDeal.company_name || ctDeal.client_company;
  const clientId = ctDeal.client_id || ctDeal.clientId;
  
  if (!clientId && !clientCompany) {
    console.log('[Sync] No client info for deal:', ctDeal.id);
    return null;
  }

  console.log('[Sync] Looking up client:', { clientId, clientCompany });

  // Try to find existing client by Control Tower ID (stored as hubspot_id)
  if (clientId) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('hubspot_id', String(clientId))
      .maybeSingle();
    
    if (existingClient) {
      console.log('[Sync] Found existing client:', existingClient.id);
      return existingClient.id;
    }
  }

  // Create new client if not found
  const clientData = {
    hubspot_id: clientId ? String(clientId) : null,
    name: clientCompany || 'Unknown Client',
    company: clientCompany || 'Unknown Client',
    email: ctDeal.clientEmail || ctDeal.client_email || null,
    phone: ctDeal.clientPhone || ctDeal.client_phone || null,
    contact_person: ctDeal.clientContactName || 
                   `${ctDeal.clientFirstName || ''} ${ctDeal.clientLastName || ''}`.trim() || null,
    website: ctDeal.clientWebsite || ctDeal.client_website || null,
    status: 'active',
  };

  console.log('[Sync] Creating new client:', clientData);

  const { data: newClient, error } = await supabase
    .from('clients')
    .upsert(clientData, {
      onConflict: 'hubspot_id',
      ignoreDuplicates: false
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Sync] Error creating client:', error);
    return null;
  }

  console.log('[Sync] Created new client:', newClient?.id);
  return newClient?.id || null;
}

async function performSync(
  ctClient: any,
  supabase: any,
  userId: string
): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // First, try to fetch pipeline/stage definitions from Control Tower
    console.log('[Sync] Fetching pipeline stages from Control Tower...');
    const { data: pipelineStages, error: pipelineError } = await ctClient
      .from('DealStage')
      .select('*');
    
    if (!pipelineError && pipelineStages && pipelineStages.length > 0) {
      console.log('[Sync] Found pipeline stages:', pipelineStages);
      // Update stage mapping based on pipeline definitions
      pipelineStages.forEach((stage: any) => {
        const stageId = String(stage.id || stage.stage_id);
        const stageName = String(stage.name || stage.label || '').toLowerCase().replace(/\s+/g, '');
        if (stageName && !STAGE_MAPPING[stageId]) {
          STAGE_MAPPING[stageId] = mapStage(stageName, stageName);
        }
      });
      console.log('[Sync] Active stage mapping:', STAGE_MAPPING);
    } else {
      console.log('[Sync] No pipeline stages table found, using default mapping');
    }
    
    console.log('[Sync] Final stage mapping:', STAGE_MAPPING);

    // Fetch all deals from Control Tower in one query
    console.log('[Sync] Fetching deals from Control Tower...');
    const { data: ctDeals, error: fetchError } = await ctClient
      .from('Deal')  // Capitalized to match Control Tower schema
      .select('*');

    if (fetchError) {
      console.error('[Sync] Error fetching deals from Control Tower:', {
        message: fetchError.message,
        code: fetchError.code,
        hint: fetchError.hint,
        details: fetchError.details
      });
      throw new Error(`Failed to fetch deals from Control Tower: ${fetchError.message}. Hint: ${fetchError.hint || 'Check table name and permissions'}`);
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

    // Log sample deal structure for debugging
    if (ctDeals.length > 0) {
      console.log('[Sync] Sample deal structure:', {
        id: ctDeals[0].id,
        dealname: ctDeals[0].dealname,
        potential_amount: ctDeals[0].potential_amount,
        amount: ctDeals[0].amount,
        dealstage: ctDeals[0].dealstage,
        clientCompanyName: ctDeals[0].clientCompanyName,
        expected_closing_date: ctDeals[0].expected_closing_date,
        keys: Object.keys(ctDeals[0]).slice(0, 15)
      });
    }

    // Transform deals for bulk upsert with flexible field mapping
    console.log('[Sync] Transforming deals with client lookup...');
    const transformedDeals = await Promise.all(
      ctDeals.map(async (ctDeal: any) => {
        const ctStage = ctDeal.dealstage || ctDeal.stage;
        const ctStageName = ctDeal.dealstage_name || ctDeal.stage_name;
        
        // Get or create local client
        const localClientId = await getOrCreateClient(supabase, ctDeal);
        
        return {
          control_tower_id: ctDeal.id,
          
          // Use correct Control Tower field names
          title: ctDeal.dealname || ctDeal.deal_name || ctDeal.name || 'Untitled Deal',
          amount: parseFloat(ctDeal.amount || ctDeal.potential_amount || 0),
          stage: mapStage(ctStage, ctStageName),
          close_date: ctDeal.expected_closing_date || ctDeal.closedate || ctDeal.close_date || null,
          
          // Map to local client
          client_id: localClientId,
          
          // Store Control Tower references for tracking
          control_tower_client_id: ctDeal.client_id || ctDeal.clientId || null,
          control_tower_owner_id: ctDeal.actual_deal_owner_id || ctDeal.owner_id || ctDeal.ownerId || null,
          control_tower_status: ctDeal.dealstatus || ctDeal.status || 'active',
          
          synced_from_control_tower: true,
          last_synced_at: new Date().toISOString(),
          probability: ctDeal.probability ? parseFloat(ctDeal.probability) : null,
          
          // Timestamps from Control Tower
          created_at: ctDeal.createdate || ctDeal.created_at || new Date().toISOString(),
          updated_at: ctDeal.updated_at || new Date().toISOString(),
        };
      })
    );
    
    console.log('[Sync] Transformed', transformedDeals.length, 'deals');

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
