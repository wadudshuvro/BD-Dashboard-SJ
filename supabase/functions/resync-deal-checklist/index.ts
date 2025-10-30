// Phase 6: Manual re-sync edge function for deal checklist
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResyncRequest {
  dealId: string;
}

interface ResyncResult {
  success: boolean;
  deleted_count: number;
  synced_count: number;
  errors?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { dealId }: ResyncRequest = await req.json();
    if (!dealId) {
      throw new Error('dealId is required');
    }

    console.log(`[Resync] Starting checklist resync for deal ${dealId}`);

    // Get deal info
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select('control_tower_id, synced_from_control_tower, title')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error('Deal not found');
    }

    if (!deal.synced_from_control_tower || !deal.control_tower_id) {
      throw new Error('Deal is not synced from Control Tower');
    }

    // Get Control Tower integration config
    const { data: ctConfig, error: ctConfigError } = await supabase
      .from('integration_configs')
      .select('config')
      .eq('integration_type', 'control_tower')
      .eq('is_active', true)
      .single();

    if (ctConfigError || !ctConfig) {
      throw new Error('Control Tower integration not configured');
    }

    const controlTowerUrl = ctConfig.config.base_url;
    const controlTowerApiKey = ctConfig.config.api_key;

    // Initialize Control Tower client
    const controlTowerClient = createClient(controlTowerUrl, controlTowerApiKey);

    // Step 1: Delete all existing checklist items for this deal
    const { error: deleteError, count: deletedCount } = await supabase
      .from('deal_checklist_items')
      .delete({ count: 'exact' })
      .eq('deal_id', dealId);

    if (deleteError) {
      throw new Error(`Failed to delete existing items: ${deleteError.message}`);
    }

    console.log(`[Resync] Deleted ${deletedCount || 0} existing checklist items`);

    // Step 2: Fetch checklist from Control Tower
    const { data: ctChecklist, error: ctChecklistError } = await controlTowerClient
      .from('deal_checklist')
      .select('*')
      .eq('deal_id', deal.control_tower_id)
      .order('order_index', { ascending: true });

    if (ctChecklistError) {
      throw new Error(`Failed to fetch checklist from Control Tower: ${ctChecklistError.message}`);
    }

    if (!ctChecklist || ctChecklist.length === 0) {
      console.log(`[Resync] No checklist items found in Control Tower for deal ${dealId}`);
      return new Response(
        JSON.stringify({
          success: true,
          deleted_count: deletedCount || 0,
          synced_count: 0,
          message: 'No checklist items in Control Tower'
        } as ResyncResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Insert items from Control Tower
    const itemsToInsert = ctChecklist.map((item: any, index: number) => ({
      deal_id: dealId,
      control_tower_item_id: item.id,
      title: item.title || `Checklist Item ${index + 1}`,
      is_completed: item.is_completed || false,
      completed_by: item.completed_by || null,
      completed_at: item.completed_at || null,
      order_index: item.order_index ?? index,
    }));

    const { error: insertError } = await supabase
      .from('deal_checklist_items')
      .insert(itemsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert checklist items: ${insertError.message}`);
    }

    console.log(`[Resync] Successfully synced ${itemsToInsert.length} checklist items`);

    // Log the resync operation
    await supabase
      .from('control_tower_sync_log')
      .insert({
        sync_type: 'manual_resync',
        entity_type: 'checklist',
        entity_id: dealId,
        status: 'success',
        synced_by: user.id,
        control_tower_id: deal.control_tower_id,
        payload: {
          deal_title: deal.title,
          deleted_count: deletedCount || 0,
          synced_count: itemsToInsert.length,
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        deleted_count: deletedCount || 0,
        synced_count: itemsToInsert.length,
      } as ResyncResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Resync] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        deleted_count: 0,
        synced_count: 0,
        errors: [errorMessage]
      } as ResyncResult),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
