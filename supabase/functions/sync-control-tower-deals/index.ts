import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

interface SyncResult {
  deals: {
    new: number;
    updated: number;
    failed: number;
  };
  clients: {
    new: number;
    updated: number;
  };
  checklists: {
    synced: number;
    failed: number;
  };
  errors: string[];
  duration: number;
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

    // Verify user authentication when a JWT is supplied. Allow service role
    // headers for scheduled jobs where no user context exists.
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.warn('[Sync] Unable to resolve user from auth header:', authError.message);
    }

    const userId = user?.id ?? null;

    if (userId) {
      console.log(`[Sync] Starting Control Tower sync for user: ${userId}`);
    } else {
      console.log('[Sync] Starting Control Tower sync with service credential');
    }

    // Fetch Control Tower configuration from ai_configurations table (if user authenticated)
    let configData = null;
    if (userId) {
      const { data, error: configError } = await supabase
        .from('ai_configurations')
        .select('configuration_data')
        .eq('user_id', userId)
        .eq('configuration_type', 'control_tower')
        .maybeSingle();
      
      if (!configError) {
        configData = data;
      }
    }

    // Get Control Tower credentials from edge secrets
    const envUrl = Deno.env.get('Controltowerurl');
    const envKey = Deno.env.get('CONTROLTOWERAPIKEY');
    
    if (!envUrl || !envKey) {
      throw new Error('Control Tower credentials not configured in edge secrets');
    }

    console.log('[Sync] Using Control Tower credentials from edge secrets');
    
    // Create Control Tower client with server-side credentials
    const ctClient = createClient(envUrl, envKey);

    return await performSync(ctClient, supabase, userId, supabaseKey);

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

function extractDriveFolderId(ctDeal: any): string | null {
  const candidates = [
    ctDeal.drive_folder_id,
    ctDeal.driveFolderId,
    ctDeal.google_drive_folder_id,
    ctDeal.googleDriveFolderId,
    ctDeal.drive_folder,
    ctDeal.google_drive_folder,
    ctDeal.folder_id,
    ctDeal.deal_folder_id,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }

    if (typeof candidate === 'object') {
      const nestedId = candidate.id ?? candidate.folder_id ?? candidate.folderId ?? null;
      if (typeof nestedId === 'string' && nestedId.trim()) {
        return nestedId.trim();
      }
    }
  }

  return null;
}

async function getOrCreateClient(
  ctClient: any,
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

  // First, try fetching client from Control Tower if we have a client ID
  if (clientId) {
    try {
      const { data: ctClientData, error: ctClientError } = await ctClient
        .from('Client')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (!ctClientError && ctClientData) {
        console.log('[Sync] Found client in Control Tower:', ctClientData);
        
        // Upsert client into BD Portal using control_tower_id
        const { data: upsertedClient, error: upsertError } = await supabase
          .from('clients')
          .upsert({
            control_tower_id: ctClientData.id,
            hubspot_id: ctClientData.hubspot_id || null,
            name: ctClientData.name || ctClientData.company || clientCompany || 'Unknown Client',
            company: ctClientData.company || clientCompany || 'Unknown Client',
            email: ctClientData.email || ctDeal.clientEmail || ctDeal.client_email || null,
            phone: ctClientData.phone || ctDeal.clientPhone || ctDeal.client_phone || null,
            contact_person: ctClientData.contact_person || ctDeal.clientContactName || 
                           `${ctDeal.clientFirstName || ''} ${ctDeal.clientLastName || ''}`.trim() || null,
            website: ctClientData.website || ctDeal.clientWebsite || ctDeal.client_website || null,
            industry: ctClientData.industry || null,
            status: ctClientData.status || 'active',
            address: ctClientData.address || null,
            city: ctClientData.city || null,
            state: ctClientData.state || null,
            postal_code: ctClientData.postal_code || null,
            country: ctClientData.country || null,
          }, {
            onConflict: 'control_tower_id',
            ignoreDuplicates: false
          })
          .select('id')
          .single();

        if (upsertError) {
          console.error('[Sync] Error upserting client from Control Tower:', upsertError);
        } else {
          console.log('[Sync] Upserted client:', upsertedClient.id);
          return upsertedClient.id;
        }
      }
    } catch (ctError) {
      console.warn('[Sync] Could not fetch client from Control Tower:', ctError);
    }
  }

  // Fallback: Try to find existing client by hubspot_id or control_tower_id
  if (clientId) {
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .or(`hubspot_id.eq.${clientId},control_tower_id.eq.${clientId}`)
      .maybeSingle();
    
    if (existingClient) {
      console.log('[Sync] Found existing client:', existingClient.id);
      return existingClient.id;
    }
  }

  // Final fallback: Create minimal client from deal data
  const clientData = {
    control_tower_id: clientId || null,
    name: clientCompany || 'Unknown Client',
    company: clientCompany || 'Unknown Client',
    email: ctDeal.clientEmail || ctDeal.client_email || null,
    phone: ctDeal.clientPhone || ctDeal.client_phone || null,
    contact_person: ctDeal.clientContactName || 
                   `${ctDeal.clientFirstName || ''} ${ctDeal.clientLastName || ''}`.trim() || null,
    website: ctDeal.clientWebsite || ctDeal.client_website || null,
    status: 'active',
  };

  console.log('[Sync] Creating minimal client:', clientData);

  const { data: newClient, error } = await supabase
    .from('clients')
    .insert(clientData)
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
  userId: string | null,
  serviceRoleKey: string,
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

    const driveFolderMap = new Map<string, string>();
    for (const ctDeal of ctDeals) {
      const folderId = extractDriveFolderId(ctDeal);
      if (folderId) {
        driveFolderMap.set(String(ctDeal.id), folderId);
      }
    }

    if (driveFolderMap.size > 0) {
      console.log(`[Sync] Identified Drive folders for ${driveFolderMap.size} deals`);
    }

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
        const localClientId = await getOrCreateClient(ctClient, supabase, ctDeal);
        
        const tags = Array.isArray(ctDeal.tags)
          ? ctDeal.tags
          : typeof ctDeal.tags === 'string'
            ? ctDeal.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean)
            : [];

        const expectedCloseDate = ctDeal.expected_closing_date || ctDeal.closedate || ctDeal.close_date;

        return {
          control_tower_id: ctDeal.id,

          // Use correct Control Tower field names
          title: ctDeal.dealname || ctDeal.deal_name || ctDeal.name || 'Untitled Deal',
          amount: parseFloat(ctDeal.amount || ctDeal.potential_amount || 0),
          stage: mapStage(ctStage, ctStageName),
          close_date: expectedCloseDate || null,

          // Map to local client
          client_id: localClientId,

          // Store Control Tower references for tracking
          control_tower_client_id: ctDeal.client_id || ctDeal.clientId || null,
          control_tower_owner_id: ctDeal.actual_deal_owner_id || ctDeal.owner_id || ctDeal.ownerId || null,
          control_tower_status: ctDeal.dealstatus || ctDeal.status || 'active',

          notes: ctDeal.notes || ctDeal.description || null,
          hubspot_deal_id: ctDeal.hubspot_deal_id || ctDeal.hs_object_id || null,
          hubspot_crm_deal_url: ctDeal.hubspot_crm_deal_url || null,
          dealtype: ctDeal.dealtype || ctDeal.deal_type || null,
          lead_source: ctDeal.lead_source || ctDeal.source || null,
          expected_closing_date: expectedCloseDate ? new Date(expectedCloseDate).toISOString().split('T')[0] : null,
          potential_amount: ctDeal.potential_amount ? parseFloat(ctDeal.potential_amount) : (ctDeal.amount ? parseFloat(ctDeal.amount) : null),
          priority: ctDeal.priority || 'medium',
          tags,
          external_links: {
            n8n_workflow_url: ctDeal.n8n_workflow_url || null,
            activecollab_project_url: ctDeal.activecollab_project_url || null,
            collabai_agent_url: ctDeal.collabai_agent_url || null,
          },
          control_tower_metadata: ctDeal,
          last_activity_at: ctDeal.updated_at || ctDeal.last_activity_at || new Date().toISOString(),

          // Control Tower may not expose the user reference; store null until mappings exist.
          last_activity_by: null,

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
      .select('id, control_tower_id');

    if (upsertError) {
      console.error('[Sync] Bulk upsert error:', upsertError);
      throw new Error(`Failed to sync deals: ${upsertError.message}`);
    }

    const syncedCount = upsertedDeals?.length || transformedDeals.length;
    console.log(`[Sync] Synced ${syncedCount} deals`);

    type UpsertedDealReference = { id: string | number; control_tower_id: string | number | null };
    const typedUpserts: UpsertedDealReference[] = (upsertedDeals || []) as UpsertedDealReference[];

    const fileSyncPayload = typedUpserts
      .map((deal) => {
        if (!deal?.id || !deal.control_tower_id) return null;
        const folderId = driveFolderMap.get(String(deal.control_tower_id));
        if (!folderId) return null;
        return {
          dealId: String(deal.id),
          controlTowerDealId: String(deal.control_tower_id),
          driveFolderId: folderId,
        };
      })
      .filter((value): value is { dealId: string; controlTowerDealId: string; driveFolderId: string } => Boolean(value));

    if (fileSyncPayload.length > 0) {
      console.log(`[Sync] Triggering Drive file sync for ${fileSyncPayload.length} deals`);
      try {
        await supabase.functions.invoke('sync-deal-files', {
          body: { deals: fileSyncPayload },
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
          },
        });
      } catch (fileSyncError) {
        console.warn('[Sync] Failed to trigger deal file sync:', fileSyncError);
      }
    }

    // Now sync checklist items for each deal
    console.log('[Sync] Syncing checklist items from Control Tower...');
    let checklistSyncedCount = 0;
    let checklistFailedCount = 0;

    for (const deal of upsertedDeals || []) {
      if (!deal.control_tower_id) continue;

      try {
        // Fetch checklist items from Control Tower for this deal
        const { data: ctChecklistItems, error: checklistError } = await ctClient
          .from('deal_checklist_items')
          .select('*')
          .eq('deal_id', deal.control_tower_id)
          .order('order_index', { ascending: true });

        if (checklistError) {
          console.warn(`[Sync] Error fetching checklist for deal ${deal.id}:`, checklistError);
          checklistFailedCount++;
          continue;
        }

        if (ctChecklistItems && ctChecklistItems.length > 0) {
          console.log(`[Sync] Found ${ctChecklistItems.length} checklist items for deal ${deal.id}`);

          // Map Control Tower checklist items to BD Portal format
          const checklistItemsToUpsert = ctChecklistItems.map((item: any, index: number) => ({
            deal_id: deal.id, // BD Portal deal ID
            title: item.title || `Checklist Item ${index + 1}`,
            is_completed: item.is_completed || false,
            completed_by: null, // User mapping not available cross-system
            completed_at: item.completed_at || null,
            order_index: item.order_index ?? index,
          }));

          // Upsert checklist items
          const { error: upsertChecklistError } = await supabase
            .from('deal_checklist_items')
            .upsert(checklistItemsToUpsert, {
              onConflict: 'deal_id,order_index',
              ignoreDuplicates: false
            });

          if (upsertChecklistError) {
            console.error(`[Sync] Error upserting checklist for deal ${deal.id}:`, upsertChecklistError);
            checklistFailedCount++;
          } else {
            checklistSyncedCount++;
          }
        } else {
          // No checklist in Control Tower, apply default template as fallback
          console.log(`[Sync] No checklist in Control Tower for deal ${deal.id}, applying template...`);
          try {
            await supabase.functions.invoke('apply-checklist-template', {
              body: { 
                dealId: deal.id, 
                stage: transformedDeals.find(d => d.control_tower_id === deal.control_tower_id)?.stage || 'prospecting'
              }
            });
          } catch (templateError) {
            console.warn(`[Sync] Failed to apply template for deal ${deal.id}:`, templateError);
          }
        }
      } catch (error) {
        console.error(`[Sync] Error processing checklist for deal ${deal.id}:`, error);
        checklistFailedCount++;
      }
    }

    console.log(`[Sync] Checklist sync complete: ${checklistSyncedCount} synced, ${checklistFailedCount} failed`);
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
      console.warn('[Sync] Failed to log legacy audit record:', auditError);
    }

    try {
      await supabase.from('control_tower_sync_log').insert({
        sync_type: 'pull',
        entity_type: 'deal',
        status: 'success',
        payload: { synced: syncedCount, duration },
        synced_by: userId,
      });
    } catch (logError) {
      console.warn('[Sync] Failed to log control_tower_sync_log record:', logError);
    }

    const result: SyncResult = {
      deals: {
        new: 0,
        updated: syncedCount,
        failed: 0
      },
      clients: {
        new: 0,
        updated: 0
      },
      checklists: {
        synced: 0,
        failed: 0
      },
      errors: [],
      duration: 0
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
      console.warn('[Sync] Failed to log legacy audit record:', auditError);
    }

    try {
      await supabase.from('control_tower_sync_log').insert({
        sync_type: 'pull',
        entity_type: 'deal',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        payload: { duration },
        synced_by: userId,
      });
    } catch (logError) {
      console.warn('[Sync] Failed to log control_tower_sync_log failure record:', logError);
    }

    throw error;
  }
}
