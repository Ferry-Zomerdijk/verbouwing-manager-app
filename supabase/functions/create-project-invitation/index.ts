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

    // Verify caller owns the project or is an admin
    const { data: projectAccess } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', inviter.id)
      .maybeSingle();

    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', inviter.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!projectAccess && !adminRole) {
      return new Response(
        JSON.stringify({ error: 'Geen toegang tot dit project' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
    const baseUrl = req.headers.get('origin') || 'https://verbouwing-manager-app.lovable.app';
    const inviteUrl = `${baseUrl}/accept-invite/${inviteToken}`;

    console.log('Successfully created invitation');

    // 5. Send email via Resend
    let emailSent = false;
    let emailError: string | null = null;

    try {
      // Fetch project name
      const { data: project } = await supabaseAdmin
        .from('projects')
        .select('naam')
        .eq('id', projectId)
        .single();

      // Fetch inviter name
      const { data: inviterProfile } = await supabaseAdmin
        .from('profiles')
        .select('naam, email')
        .eq('id', inviter.id)
        .single();

      const projectName = project?.naam || 'een project';
      const inviterName = inviterProfile?.naam || inviterProfile?.email || 'Iemand';

      const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 20px; color: #18181b; margin: 0 0 8px;">Je bent uitgenodigd!</h1>
    <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      <strong>${inviterName}</strong> heeft je uitgenodigd voor het project <strong>"${projectName}"</strong> in De Renovatie App.
    </p>
    <a href="${inviteUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px;">
      Uitnodiging accepteren
    </a>
    <p style="color: #a1a1aa; font-size: 13px; margin: 24px 0 0; line-height: 1.5;">
      ${!existingUser ? 'Via deze link kun je een pincode aanmaken en direct aan de slag.' : 'Je hebt al een account en krijgt via deze link direct toegang.'}
    </p>
    <p style="color: #a1a1aa; font-size: 12px; margin: 16px 0 0;">
      Deze link is 7 dagen geldig. Werkt de knop niet? Kopieer dan deze link:<br>
      <span style="word-break: break-all;">${inviteUrl}</span>
    </p>
  </div>
</body>
</html>`;

      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'De Renovatie App <onboarding@resend.dev>',
          to: [userEmail],
          subject: `Je bent uitgenodigd voor project "${projectName}"`,
          html: emailHtml,
        }),
      });

      if (resendRes.ok) {
        emailSent = true;
        console.log('Invitation email sent successfully');
      } else {
        const resendError = await resendRes.text();
        console.error('Resend API error:', resendError);
        emailError = `Email kon niet worden verstuurd: ${resendRes.status}`;
      }
    } catch (mailErr: any) {
      console.error('Failed to send invitation email:', mailErr);
      emailError = mailErr.message;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inviteUrl,
        userId,
        expiresAt,
        isNewUser: !existingUser,
        emailSent,
        emailError,
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
