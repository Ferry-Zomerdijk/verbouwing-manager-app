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

    // Verify caller identity and project access
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: caller }, error: callerErr } = await supabaseAdmin.auth.getUser(token);
    if (callerErr || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: hasAccess, error: accessErr } = await supabaseAdmin.rpc('has_project_access', {
      _user_id: caller.id,
      _project_id: projectId,
    });
    if (accessErr || !hasAccess) {
      return new Response(
        JSON.stringify({ error: 'Geen toegang tot dit project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating access token for project:', projectId);

    // 1. Check if user exists, otherwise create
    let userId: string;
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const foundUser = existingUser?.users?.find(u => u.email === userEmail);
    
    if (foundUser) {
      userId = foundUser.id;
      console.log('User already exists:', userId);
    } else {
      // Create new user with random password
      const tempPassword = crypto.randomUUID();
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: userEmail,
        password: tempPassword,
        email_confirm: true,
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

    // 2. Add user to project_users (upsert to avoid duplicates)
    const { error: projectUserError } = await supabaseAdmin
      .from('project_users')
      .upsert({ 
        project_id: projectId, 
        user_id: userId,
      }, { 
        onConflict: 'project_id,user_id' 
      });
    
    if (projectUserError) {
      console.error('Error adding to project_users:', projectUserError);
      throw projectUserError;
    }

    // 3. Generate magic link for authentication
    const { data: magicLinkData, error: magicLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    if (magicLinkError || !magicLinkData) {
      console.error('Failed to generate magic link:', magicLinkError);
      throw new Error('Failed to generate session');
    }

    // Extract token from the hashed_token
    const accessToken = magicLinkData.properties.hashed_token;

    // 4. Store token in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const tokenRecord = {
      project_id: projectId,
      user_id: userId,
      token: accessToken,
      expires_at: expiresAt,
    };

    const { error: tokenError } = await supabaseAdmin
      .from('project_access_tokens')
      .insert(tokenRecord);

    if (tokenError) {
      console.error('Error storing token:', tokenError);
      throw tokenError;
    }

    // 5. Generate the complete URL
    const baseUrl = 'https://preview--verbouwing-manager-app.lovable.app';
    const accessUrl = `${baseUrl}/project-tasks/${projectId}?token=${accessToken}`;

    console.log('Successfully generated access token');

    return new Response(
      JSON.stringify({ 
        success: true, 
        accessUrl,
        userId,
        expiresAt,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error generating access token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
