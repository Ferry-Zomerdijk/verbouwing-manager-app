import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
  password: string;
  name?: string;
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

    const { token, password, name }: RequestBody = await req.json();

    if (!token || !password) {
      throw new Error('Token en wachtwoord zijn verplicht');
    }

    if (password.length < 6) {
      throw new Error('Wachtwoord moet minimaal 6 tekens zijn');
    }

    console.log('Accepting invitation with token:', token.substring(0, 8) + '...');

    // 1. Find the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('project_invitations')
      .select('*')
      .eq('invite_token', token)
      .is('accepted_at', null)
      .single();

    if (inviteError || !invitation) {
      console.error('Invitation not found:', inviteError);
      throw new Error('Ongeldige of verlopen uitnodiging');
    }

    // 2. Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('Deze uitnodiging is verlopen');
    }

    console.log('Found valid invitation for:', invitation.email);

    // 3. Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      invitation.user_id,
      { 
        password,
        user_metadata: { needs_password: false }
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Kon wachtwoord niet instellen');
    }

    // 4. Update profile name if provided
    if (name) {
      await supabaseAdmin
        .from('profiles')
        .update({ naam: name })
        .eq('id', invitation.user_id);
    }

    // 5. Add user to project_users
    const { error: projectUserError } = await supabaseAdmin
      .from('project_users')
      .upsert({ 
        project_id: invitation.project_id, 
        user_id: invitation.user_id,
        created_by: invitation.invited_by,
      }, { 
        onConflict: 'project_id,user_id' 
      });

    if (projectUserError) {
      console.error('Error adding to project_users:', projectUserError);
      throw projectUserError;
    }

    // 6. Mark invitation as accepted
    await supabaseAdmin
      .from('project_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // 7. Sign in the user and get session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: invitation.email,
      password: password,
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      // User is set up but couldn't auto-sign in, they can sign in manually
      return new Response(
        JSON.stringify({ 
          success: true, 
          projectId: invitation.project_id,
          email: invitation.email,
          message: 'Account aangemaakt! Je kunt nu inloggen.',
          autoSignIn: false,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully accepted invitation and signed in user');

    return new Response(
      JSON.stringify({ 
        success: true, 
        projectId: invitation.project_id,
        session: signInData.session,
        autoSignIn: true,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
