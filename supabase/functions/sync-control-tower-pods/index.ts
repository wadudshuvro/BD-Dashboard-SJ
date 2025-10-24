import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

const CONTROL_TOWER_BASE_URL = Deno.env.get('CONTROL_TOWER_BASE_URL');
const CONTROL_TOWER_API_KEY = Deno.env.get('CONTROL_TOWER_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[sync-control-tower-pods] Starting POD import from Control Tower...');

    // Verify Control Tower credentials
    if (!CONTROL_TOWER_BASE_URL || !CONTROL_TOWER_API_KEY) {
      throw new Error('Control Tower credentials not configured');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all active deals from Control Tower
    console.log('[sync-control-tower-pods] Fetching deals from Control Tower...');
    const ctResponse = await fetch(`${CONTROL_TOWER_BASE_URL}/api/deals?status=active`, {
      headers: {
        'Authorization': `Bearer ${CONTROL_TOWER_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!ctResponse.ok) {
      throw new Error(`Control Tower API error: ${ctResponse.status} ${ctResponse.statusText}`);
    }

    const ctDeals = await ctResponse.json();
    console.log(`[sync-control-tower-pods] Fetched ${ctDeals.length} deals from Control Tower`);

    // Extract unique POD names from Control Tower deals
    const podNamesSet = new Set<string>();
    ctDeals.forEach((deal: any) => {
      const podName = deal.pod || deal.pod_name || deal.team;
      if (podName && typeof podName === 'string' && podName.trim()) {
        podNamesSet.add(podName.trim());
      }
    });

    const podNames = Array.from(podNamesSet).sort();
    console.log(`[sync-control-tower-pods] Found ${podNames.length} unique PODs:`, podNames);

    // Delete all existing PODs
    console.log('[sync-control-tower-pods] Deleting existing PODs...');
    const { error: deleteError } = await supabaseClient
      .from('pods')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteError) {
      console.error('[sync-control-tower-pods] Error deleting PODs:', deleteError);
      throw deleteError;
    }

    // Insert new PODs from Control Tower
    if (podNames.length > 0) {
      console.log('[sync-control-tower-pods] Creating new PODs...');
      const podsToInsert = podNames.map(name => ({
        name,
        description: `Imported from Control Tower`,
        is_active: true,
      }));

      const { data: insertedPods, error: insertError } = await supabaseClient
        .from('pods')
        .insert(podsToInsert)
        .select();

      if (insertError) {
        console.error('[sync-control-tower-pods] Error inserting PODs:', insertError);
        throw insertError;
      }

      console.log(`[sync-control-tower-pods] Successfully imported ${insertedPods?.length || 0} PODs`);

      return new Response(
        JSON.stringify({
          success: true,
          podsImported: insertedPods?.length || 0,
          podNames: podNames,
          message: `Successfully imported ${insertedPods?.length || 0} PODs from Control Tower`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('[sync-control-tower-pods] No PODs found in Control Tower deals');
      return new Response(
        JSON.stringify({
          success: true,
          podsImported: 0,
          podNames: [],
          message: 'No PODs found in Control Tower deals',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('[sync-control-tower-pods] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
