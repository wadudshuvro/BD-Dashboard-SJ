import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Control Tower credentials
    const { data: config } = await supabase
      .from('integrations')
      .select('config')
      .eq('name', 'control_tower')
      .single();

    if (!config?.config?.url || !config?.config?.anon_key) {
      throw new Error('Control Tower credentials not configured');
    }

    const controlTowerUrl = config.config.url;
    const controlTowerKey = config.config.anon_key;
    const controlTower = createClient(controlTowerUrl, controlTowerKey);

    console.log('[Employee Sync] Fetching users from Control Tower...');

    // Fetch users from Control Tower (they store users in auth.users metadata + profiles)
    const { data: ctProfiles, error: ctError } = await controlTower
      .from('profiles')
      .select('*')
      .order('full_name');

    if (ctError) {
      console.error('[Employee Sync] Error fetching Control Tower profiles:', ctError);
      throw ctError;
    }

    console.log(`[Employee Sync] Found ${ctProfiles?.length || 0} profiles in Control Tower`);

    let syncedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    // Sync each employee
    for (const ctProfile of ctProfiles || []) {
      try {
        const employeeData = {
          control_tower_id: ctProfile.id,
          full_name: ctProfile.full_name || ctProfile.email,
          email: ctProfile.email,
          phone: ctProfile.phone,
          role: ctProfile.title || 'Team Member',
          department: ctProfile.department,
          is_active: true,
          synced_from_control_tower: true,
          last_synced_at: new Date().toISOString(),
          metadata: {
            avatar_url: ctProfile.avatar_url,
            control_tower_data: ctProfile,
          },
        };

        // Upsert employee (insert or update if exists)
        const { error: upsertError } = await supabase
          .from('employees')
          .upsert(employeeData, {
            onConflict: 'control_tower_id',
          });

        if (upsertError) {
          console.error(`[Employee Sync] Error syncing ${ctProfile.full_name}:`, upsertError);
          errorCount++;
        } else {
          // Check if it was an insert or update
          const { data: existing } = await supabase
            .from('employees')
            .select('created_at')
            .eq('control_tower_id', ctProfile.id)
            .single();

          if (existing && new Date(existing.created_at) < new Date(Date.now() - 1000)) {
            updatedCount++;
          } else {
            syncedCount++;
          }
        }
      } catch (err) {
        console.error(`[Employee Sync] Error processing ${ctProfile.email}:`, err);
        errorCount++;
      }
    }

    console.log(`[Employee Sync] Complete: ${syncedCount} new, ${updatedCount} updated, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncedCount,
        updated: updatedCount,
        errors: errorCount,
        total: ctProfiles?.length || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[Employee Sync] Fatal error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
