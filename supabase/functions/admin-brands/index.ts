import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface BrandPayload {
  name: string;
  type: 'internal' | 'client';
  description?: string;
  owner_id?: string;
  monthly_budget?: number;
  logo_url?: string;
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

    // Verify user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roleCheck } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['super_admin', 'admin'])
      .single();

    if (!roleCheck) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const brandId = pathParts[pathParts.length - 1];

    // GET /admin-brands - List all brands
    if (req.method === 'GET' && !brandId) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const search = url.searchParams.get('search') || '';
      const type = url.searchParams.get('type') || '';
      const isActive = url.searchParams.get('is_active');

      let query = supabase
        .from('brands')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (type) {
        query = query.eq('type', type);
      }

      if (isActive !== null) {
        query = query.eq('is_active', isActive === 'true');
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return new Response(
        JSON.stringify({ brands: data, total: count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /admin-brands/:id - Get single brand
    if (req.method === 'GET' && brandId) {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', brandId)
        .single();

      if (error) throw error;

      // Get brand team members
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
        .eq('brand_id', brandId);

      return new Response(
        JSON.stringify({ brand: data, team_members: teamMembers || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /admin-brands - Create brand
    if (req.method === 'POST') {
      const payload: BrandPayload = await req.json();

      const { data, error } = await supabase
        .from('brands')
        .insert({
          name: payload.name,
          type: payload.type,
          description: payload.description,
          owner_id: payload.owner_id || user.id,
          monthly_budget: payload.monthly_budget,
          logo_url: payload.logo_url,
          metadata: payload.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;

      // Automatically add owner to user_brands
      if (data) {
        await supabase.from('user_brands').insert({
          user_id: payload.owner_id || user.id,
          brand_id: data.id,
          access_level: 'owner',
          can_view_kpis: true,
          can_edit_kpis: true,
          can_manage_team: true,
          can_edit_settings: true,
        });
      }

      console.log(`Brand created: ${data.id} - ${data.name}`);

      return new Response(
        JSON.stringify({ brand: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /admin-brands/:id - Update brand
    if (req.method === 'PUT' && brandId) {
      const payload: Partial<BrandPayload> = await req.json();

      const { data, error } = await supabase
        .from('brands')
        .update({
          name: payload.name,
          type: payload.type,
          description: payload.description,
          monthly_budget: payload.monthly_budget,
          logo_url: payload.logo_url,
          metadata: payload.metadata,
        })
        .eq('id', brandId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Brand updated: ${brandId}`);

      return new Response(
        JSON.stringify({ brand: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE /admin-brands/:id - Soft delete brand
    if (req.method === 'DELETE' && brandId) {
      const { data, error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', brandId)
        .select()
        .single();

      if (error) throw error;

      console.log(`Brand deactivated: ${brandId}`);

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
    console.error('Error in admin-brands:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
