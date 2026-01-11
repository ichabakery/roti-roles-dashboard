import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: string
  branchId?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Verify the request is from an authenticated admin/owner
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Create client with user's token to verify permissions
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get current user and verify they are owner
    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !currentUser) {
      throw new Error('Unauthorized: Could not verify user')
    }

    // Check if current user is owner
    const { data: currentProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()

    if (profileError || !currentProfile) {
      throw new Error('Unauthorized: Could not verify user role')
    }

    // Allow owner and admin_pusat to create users
    if (!['owner', 'admin_pusat'].includes(currentProfile.role)) {
      throw new Error('Unauthorized: Only owner or admin can create users')
    }

    // Parse request body
    const userData: CreateUserRequest = await req.json()
    console.log('Creating user with data:', { 
      name: userData.name, 
      email: userData.email, 
      role: userData.role,
      branchId: userData.branchId 
    })

    // Create admin client with service role for user creation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Create user via admin API (doesn't affect current session)
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto confirm email
      user_metadata: {
        name: userData.name,
        role: userData.role
      }
    })

    if (createError) {
      console.error('Error creating user:', createError)
      throw new Error(createError.message)
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned')
    }

    console.log('User created successfully:', newUser.user.id)

    // Update the profile with correct data (trigger should have created it)
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: userData.name,
        role: userData.role,
        email: userData.email
      })
      .eq('id', newUser.user.id)

    if (profileUpdateError) {
      console.error('Error updating profile:', profileUpdateError)
      // Don't throw, user is already created
    }

    // If kasir_cabang or kurir and has branchId, assign to branch
    if ((userData.role === 'kasir_cabang' || userData.role === 'kurir') && userData.branchId) {
      console.log('Assigning user to branch:', userData.branchId)
      
      const { error: branchError } = await supabaseAdmin
        .from('user_branches')
        .insert({
          user_id: newUser.user.id,
          branch_id: userData.branchId
        })

      if (branchError) {
        console.error('Error assigning branch:', branchError)
        // Don't throw, user is already created
      } else {
        console.log('Branch assignment successful')
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: 'User created successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in create-user function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred while creating user'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
