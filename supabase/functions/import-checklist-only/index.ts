import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChecklistImportResult {
  synced: number;
  skipped: number;
  failed: number;
  duration: number;
  errors: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const result: ChecklistImportResult = {
    synced: 0,
    skipped: 0,
    failed: 0,
    duration: 0,
    errors: [],
  };

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get Control Tower credentials from edge secrets (matching sync-control-tower-deals pattern)
    const envUrl = Deno.env.get('Controltowerurl');
    const envKey = Deno.env.get('CONTROLTOWERAPIKEY');

    if (!envUrl || !envKey) {
      throw new Error('Control Tower credentials not configured in edge secrets');
    }

    console.log('[Import] Using Control Tower credentials from edge secrets');

    // Initialize Control Tower client
    const controlTowerClient = createClient(envUrl, envKey);

    // Parse optional dealId from body
    const body = await req.json().catch(() => ({}));
    const specificDealId = body.dealId;

    // Fetch deals with control_tower_id
    let dealsQuery = supabase
      .from('deals')
      .select('id, control_tower_id')
      .not('control_tower_id', 'is', null);

    if (specificDealId) {
      dealsQuery = dealsQuery.eq('id', specificDealId);
    }

    const { data: deals, error: dealsError } = await dealsQuery;

    if (dealsError) {
      throw new Error(`Failed to fetch deals: ${dealsError.message}`);
    }

    if (!deals || deals.length === 0) {
      console.log('[Import] No deals with control_tower_id found');
      result.duration = Date.now() - startTime;
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Import] Processing ${deals.length} deals for checklist import`);

    // Process each deal
    for (const deal of deals) {
      try {
        // Fetch checklist items from Control Tower (table name: deal_checklist_items)
        const { data: ctChecklistItems, error: ctError } = await controlTowerClient
          .from('deal_checklist_items')
          .select('*')
          .eq('deal_id', deal.control_tower_id);

        if (ctError) {
          console.error(`[Import] Failed to fetch checklist for deal ${deal.id}:`, ctError);
          result.failed++;
          result.errors.push(`Deal ${deal.id}: ${ctError.message}`);
          continue;
        }

        if (!ctChecklistItems || ctChecklistItems.length === 0) {
          result.skipped++;
          continue;
        }

        // Fetch existing local checklist items with control_tower_item_id
        const { data: localItems } = await supabase
          .from('deal_checklist_items')
          .select('control_tower_item_id, is_completed, completed_at')
          .eq('deal_id', deal.id)
          .not('control_tower_item_id', 'is', null);

        const localItemsMap = new Map(
          (localItems || []).map((item: any) => [item.control_tower_item_id, item])
        );

        // Upsert each checklist item
        for (const ctItem of ctChecklistItems) {
          const localItem = localItemsMap.get(ctItem.id);
          
          // Conflict resolution: preserve local completion if more recent
          let isCompleted = ctItem.is_completed;
          let completedAt = ctItem.completed_at;
          let completedBy = ctItem.completed_by;

          if (localItem?.is_completed && localItem.completed_at) {
            const localCompletedAt = new Date(localItem.completed_at);
            const ctCompletedAt = ctItem.completed_at ? new Date(ctItem.completed_at) : null;
            
            if (!ctCompletedAt || localCompletedAt > ctCompletedAt) {
              // Keep local completion status
              isCompleted = true;
              completedAt = localItem.completed_at;
              completedBy = localItem.completed_by;
            }
          }

          // Validate completed_by user exists in local database
          if (completedBy) {
            const { data: userExists } = await supabase
              .from('users')
              .select('id')
              .eq('id', completedBy)
              .maybeSingle();
            
            if (!userExists) {
              console.warn(`[Import] User ${completedBy} does not exist locally, setting completed_by to NULL for item ${ctItem.id}`);
              completedBy = null;
            }
          }

          // Handle NULL titles from Control Tower with default value
          const title = ctItem.title || `Checklist Item ${ctItem.order_index || 'Untitled'}`;
          
          // Log if we're using a default title
          if (!ctItem.title) {
            console.warn(`[Import] Item ${ctItem.id} has NULL title, using default: "${title}"`);
          }

          const { error: upsertError } = await supabase
            .from('deal_checklist_items')
            .upsert({
              deal_id: deal.id,
              control_tower_item_id: ctItem.id,
              title: title,
              is_completed: isCompleted,
              completed_at: completedAt,
              completed_by: completedBy,
              order_index: ctItem.order_index,
              created_by: ctItem.created_by,
              created_at: ctItem.created_at,
            }, {
              onConflict: 'deal_id,control_tower_item_id',
              ignoreDuplicates: false,
            });

          if (upsertError) {
            console.error(`[Import] Failed to upsert checklist item:`, upsertError);
            result.failed++;
            result.errors.push(`Item ${ctItem.id}: ${upsertError.message}`);
          } else {
            result.synced++;
          }
        }
      } catch (dealError: any) {
        console.error(`[Import] Error processing deal ${deal.id}:`, dealError);
        result.failed++;
        result.errors.push(`Deal ${deal.id}: ${dealError.message}`);
      }
    }

    result.duration = Date.now() - startTime;
    console.log(`[Import] Complete: ${result.synced} synced, ${result.skipped} skipped, ${result.failed} failed in ${result.duration}ms`);

    // Log a single summary entry
    await supabase.from('control_tower_sync_log').insert({
      sync_type: 'pull',
      entity_type: 'checklist_import',
      entity_id: specificDealId || null,
      control_tower_id: null,
      status: result.failed > 0 ? 'partial_success' : 'success',
      error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
      synced_by: user.id,
      payload: {
        synced: result.synced,
        skipped: result.skipped,
        failed: result.failed,
        duration_ms: result.duration,
        deals_processed: deals.length
      }
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[Import] Fatal error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        synced: result.synced,
        failed: result.failed,
        skipped: result.skipped,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
