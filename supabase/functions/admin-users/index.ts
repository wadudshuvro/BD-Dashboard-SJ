import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Admin Users function up and running!")

interface UserWithDetails {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_brands?: Array<{
    brand_id: string;
    brand_name: string;
    access_level: string;
  }>;
  permissions?: Array<{
    module_name: string;
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Verify the requesting user is authenticated and has admin privileges
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Check if user has admin privileges
    const { data: adminUser, error: adminError } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (adminError || !adminUser || !['super_admin', 'manager'].includes(adminUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient privileges' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    const { method } = req
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(Boolean)
    const userId = pathSegments[pathSegments.length - 1]

    if (method === 'GET') {
      if (userId && userId !== 'admin-users') {
        // Get specific user with details
        const { data: userData, error: userError } = await supabaseClient
          .from('users')
          .select(`
            id, email, first_name, last_name, role, status, created_at, updated_at,
            user_brands(
              brand_id,
              access_level,
              brands(name)
            ),
            user_permissions(
              module_name,
              can_view,
              can_create,
              can_edit,
              can_delete
            )
          `)
          .eq('id', userId)
          .single()

        if (userError) {
          return new Response(
            JSON.stringify({ error: userError.message }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }

        // Transform the data
        const userWithDetails: UserWithDetails = {
          ...userData,
          user_brands: userData.user_brands?.map((ub: any) => ({
            brand_id: ub.brand_id,
            brand_name: ub.brands?.name || '',
            access_level: ub.access_level
          })) || [],
          permissions: userData.user_permissions || []
        }

        return new Response(
          JSON.stringify({ user: userWithDetails }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      } else {
        // Get all users with pagination and filtering
        const searchParams = url.searchParams
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const search = searchParams.get('search') || ''
        const roleFilter = searchParams.get('role') || ''
        const statusFilter = searchParams.get('status') || ''
        
        const offset = (page - 1) * limit

        let query = supabaseClient
          .from('users')
          .select(`
            id, email, first_name, last_name, role, status, created_at, updated_at,
            user_brands(
              brand_id,
              access_level,
              brands(name)
            )
          `, { count: 'exact' })

        // Apply filters
        if (search) {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
        }
        if (roleFilter) {
          query = query.eq('role', roleFilter)
        }
        if (statusFilter) {
          query = query.eq('status', statusFilter)
        }

        const { data: users, error: usersError, count } = await query
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })

        if (usersError) {
          return new Response(
            JSON.stringify({ error: usersError.message }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          )
        }

        // Transform the data
        const usersWithDetails: UserWithDetails[] = users?.map((user: any) => ({
          ...user,
          user_brands: user.user_brands?.map((ub: any) => ({
            brand_id: ub.brand_id,
            brand_name: ub.brands?.name || '',
            access_level: ub.access_level
          })) || []
        })) || []

        return new Response(
          JSON.stringify({ 
            users: usersWithDetails,
            total: count || 0,
            page,
            limit
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    }

    if (method === 'POST') {
      // Create new user
      const { email, password, firstName, lastName, role = 'user', status = 'active' } = await req.json()
      
      console.log('Creating user:', email)

      // Create user in auth
      const { data: authData, error: authError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role
        }
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      // Create user record in users table
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .insert({
          id: authData.user?.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role,
          status,
          password_hash: 'managed_by_auth' // placeholder since auth manages passwords
        })
        .select()
        .single()

      if (userError) {
        console.error('User table creation error:', userError)
        // Clean up auth user if database insert fails
        await supabaseClient.auth.admin.deleteUser(authData.user?.id || '')
        
        return new Response(
          JSON.stringify({ error: userError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      console.log('User created successfully:', email)
      return new Response(
        JSON.stringify({ user: userData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 201 
        }
      )
    }

    if (method === 'PUT') {
      if (!userId || userId === 'admin-users') {
        return new Response(
          JSON.stringify({ error: 'User ID required for update' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      const updates = await req.json()
      
      // Update user in database
      const { data: userData, error: userError } = await supabaseClient
        .from('users')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          role: updates.role,
          status: updates.status
        })
        .eq('id', userId)
        .select()
        .single()

      if (userError) {
        return new Response(
          JSON.stringify({ error: userError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      // Update auth user metadata
      await supabaseClient.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: updates.firstName,
          last_name: updates.lastName,
          role: updates.role
        }
      })

      return new Response(
        JSON.stringify({ user: userData }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    if (method === 'DELETE') {
      if (!userId || userId === 'admin-users') {
        return new Response(
          JSON.stringify({ error: 'User ID required for deletion' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      // Delete from auth (this will cascade to users table via trigger)
      const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)

      if (authError) {
        return new Response(
          JSON.stringify({ error: authError.message }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        )
      }

      return new Response(
        JSON.stringify({ message: 'User deleted successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})