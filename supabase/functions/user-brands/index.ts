import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    const brandSlug = pathParts[pathParts.length - 1];

    // GET /user-brands - Get user's brands with KPIs
    if (req.method === 'GET' && !brandSlug) {
      const { data: brands, error } = await supabase.rpc('get_user_brands', {
        p_user_id: user.id,
      });

      if (error) throw error;

      // Fetch KPIs for each brand
      const brandsWithKPIs = await Promise.all(
        (brands || []).map(async (brand: any) => {
          const { data: kpis } = await supabase
            .from('brand_kpis')
            .select('*')
            .eq('brand_id', brand.brand_id)
            .eq('is_active', true)
            .order('display_order', { ascending: true });

          return {
            ...brand,
            kpis: kpis || [],
          };
        })
      );

      return new Response(
        JSON.stringify({ brands: brandsWithKPIs }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /user-brands/:slug - Get single brand by slug
    if (req.method === 'GET' && brandSlug) {
      const { data: brand, error } = await supabase
        .from('brands')
        .select(`
          *,
          user_brands!inner (
            access_level,
            can_view_kpis,
            can_edit_kpis,
            can_manage_team,
            can_edit_settings
          )
        `)
        .eq('slug', brandSlug)
        .eq('user_brands.user_id', user.id)
        .single();

      if (error) throw error;

      // Get KPIs
      const { data: kpis } = await supabase
        .from('brand_kpis')
        .select('*')
        .eq('brand_id', brand.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      // Get team members
      const { data: teamMembers } = await supabase
        .from('user_brands')
        .select(`
          *,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('brand_id', brand.id);

      // Get integrations
      const { data: integrations } = await supabase
        .from('brand_integrations')
        .select('*')
        .eq('brand_id', brand.id);

      return new Response(
        JSON.stringify({
          brand: {
            ...brand,
            kpis: kpis || [],
            team_members: teamMembers || [],
            integrations: integrations || [],
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in user-brands:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
