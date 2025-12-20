import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  projectId: string;
  userEmail: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { projectId, userEmail }: RequestBody = await req.json();

    if (!projectId || !userEmail) {
      throw new Error('Missing projectId or userEmail');
    }

    console.log('Creating invitation for:', { projectId, userEmail });

    // Get current user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: inviter }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !inviter) {
      throw new Error('Invalid authorization');
    }

    // 1. Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userEmail);
    
    let userId: string;
    
    if (existingUser) {
      userId = existingUser.id;
      console.log('User already exists:', userId);
      
      // Check if already has access to this project
      const { data: existingAccess } = await supabaseAdmin
        .from('project_users')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single();
      
      if (existingAccess) {
        throw new Error('Gebruiker heeft al toegang tot dit project');
      }
    } else {
      // Create new user without password (they will set it via invitation)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        email_confirm: true,
        user_metadata: { needs_password: true }
      });
      
      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        throw new Error('Failed to create user');
      }
      
      userId = newUser.user.id;
      console.log('Created new user:', userId);
      
      // Add user to profiles table
      await supabaseAdmin.from('profiles').insert({
        id: userId,
        email: userEmail,
        naam: userEmail.split('@')[0],
      });
    }

    // 2. Generate unique invite token
    const inviteToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    
    // 3. Create invitation record (7 days valid)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error: inviteError } = await supabaseAdmin
      .from('project_invitations')
      .insert({
        project_id: projectId,
        email: userEmail,
        invite_token: inviteToken,
        invited_by: inviter.id,
        expires_at: expiresAt,
        user_id: userId,
      });

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw inviteError;
    }

    // 4. Generate the invitation URL
    const baseUrl = req.headers.get('origin') || 'https://preview--verbouwing-manager-app.lovable.app';
    const inviteUrl = `${baseUrl}/accept-invite/${inviteToken}`;

    console.log('Successfully created invitation');

    return new Response(
      JSON.stringify({ 
        success: true, 
        inviteUrl,
        userId,
        expiresAt,
        isNewUser: !existingUser,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error creating invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
