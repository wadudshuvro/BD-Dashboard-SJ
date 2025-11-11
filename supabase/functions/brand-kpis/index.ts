import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface KPIPayload {
  brand_id: string;
  name: string;
  description?: string;
  kpi_type: 'number' | 'percentage' | 'currency';
  current_value?: number;
  target_value?: number;
  source?: 'manual' | 'hubspot' | 'google_analytics' | 'linkedin' | 'gohighlevel' | 'custom';
  display_order?: number;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const kpiId = pathParts[pathParts.length - 1];

    // GET /brand-kpis?brand_id=xxx - List KPIs for a brand
    if (req.method === 'GET' && !kpiId) {
      const brandId = url.searchParams.get('brand_id');
      if (!brandId) {
        return new Response(JSON.stringify({ error: 'brand_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const { data: hasPermission } = await supabase.rpc('check_brand_permission', {
        p_user_id: user.id,
        p_brand_id: brandId,
        p_permission: 'view_kpis',
      });

      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'No permission to view KPIs' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('brand_kpis')
        .select('*')
        .eq('brand_id', brandId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      return new Response(
        JSON.stringify({ kpis: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /brand-kpis - Create KPI
    if (req.method === 'POST') {
      const payload: KPIPayload = await req.json();

      // Check permission
      const { data: hasPermission } = await supabase.rpc('check_brand_permission', {
        p_user_id: user.id,
        p_brand_id: payload.brand_id,
        p_permission: 'edit_kpis',
      });

      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'No permission to create KPIs' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('brand_kpis')
        .insert({
          brand_id: payload.brand_id,
          name: payload.name,
          description: payload.description,
          kpi_type: payload.kpi_type,
          current_value: payload.current_value || 0,
          target_value: payload.target_value,
          source: payload.source || 'manual',
          display_order: payload.display_order || 0,
          metadata: payload.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`KPI created: ${data.id} - ${data.name} for brand ${payload.brand_id}`);

      return new Response(
        JSON.stringify({ kpi: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /brand-kpis/:id - Update KPI
    if (req.method === 'PUT' && kpiId) {
      const payload: Partial<KPIPayload> = await req.json();

      // Get KPI to check brand_id
      const { data: kpi } = await supabase
        .from('brand_kpis')
        .select('brand_id')
        .eq('id', kpiId)
        .single();

      if (!kpi) {
        return new Response(JSON.stringify({ error: 'KPI not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const { data: hasPermission } = await supabase.rpc('check_brand_permission', {
        p_user_id: user.id,
        p_brand_id: kpi.brand_id,
        p_permission: 'edit_kpis',
      });

      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'No permission to edit KPIs' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('brand_kpis')
        .update({
          name: payload.name,
          description: payload.description,
          kpi_type: payload.kpi_type,
          current_value: payload.current_value,
          target_value: payload.target_value,
          source: payload.source,
          display_order: payload.display_order,
          metadata: payload.metadata,
          is_active: payload.is_active !== undefined ? payload.is_active : undefined,
        })
        .eq('id', kpiId)
        .select()
        .single();

      if (error) throw error;

      console.log(`KPI updated: ${kpiId}`);

      return new Response(
        JSON.stringify({ kpi: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /brand-kpis/:id - Soft delete KPI
    if (req.method === 'DELETE' && kpiId) {
      // Get KPI to check brand_id
      const { data: kpi } = await supabase
        .from('brand_kpis')
        .select('brand_id')
        .eq('id', kpiId)
        .single();

      if (!kpi) {
        return new Response(JSON.stringify({ error: 'KPI not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check permission
      const { data: hasPermission } = await supabase.rpc('check_brand_permission', {
        p_user_id: user.id,
        p_brand_id: kpi.brand_id,
        p_permission: 'edit_kpis',
      });

      if (!hasPermission) {
        return new Response(JSON.stringify({ error: 'No permission to delete KPIs' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { error } = await supabase
        .from('brand_kpis')
        .update({ is_active: false })
        .eq('id', kpiId);

      if (error) throw error;

      console.log(`KPI deactivated: ${kpiId}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in brand-kpis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
