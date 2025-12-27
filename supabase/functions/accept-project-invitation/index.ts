import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
  pin: string;
  name?: string;
}

// Generate a cryptographically secure random password
function generateSecurePassword(length: number = 32): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues, (v) => charset[v % charset.length]).join('');
}

// Encrypt password using AES-GCM
async function encryptPassword(password: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Create key from encryption key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Generate IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(password)
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
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

    const { token, pin, name }: RequestBody = await req.json();

    if (!token || !pin) {
      throw new Error('Token en pincode zijn verplicht');
    }

    // Validate PIN: must be exactly 6 digits
    if (!/^\d{6}$/.test(pin)) {
      throw new Error('Pincode moet exact 6 cijfers zijn');
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

    // 3. Generate a secure random password for Supabase Auth
    const generatedPassword = generateSecurePassword(32);
    console.log('Generated secure password for auth');

    // 4. Hash the PIN using bcrypt
    const pinHash = await bcrypt.hash(pin);
    console.log('PIN hashed successfully');

    // 5. Encrypt the generated password
    const encryptionKey = Deno.env.get('PIN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('PIN_ENCRYPTION_KEY niet geconfigureerd');
    }
    
    const encryptedPassword = await encryptPassword(generatedPassword, encryptionKey);
    console.log('Password encrypted successfully');

    // 6. Update user password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      invitation.user_id,
      { 
        password: generatedPassword,
        user_metadata: { needs_password: false, uses_pin: true }
      }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      throw new Error('Kon account niet instellen: ' + updateError.message);
    }

    // 7. Store PIN hash and encrypted password in user_pins table
    const { error: pinError } = await supabaseAdmin
      .from('user_pins')
      .upsert({
        user_id: invitation.user_id,
        pin_hash: pinHash,
        encrypted_password: encryptedPassword,
        failed_attempts: 0,
        locked_until: null,
      }, {
        onConflict: 'user_id'
      });

    if (pinError) {
      console.error('Error storing PIN:', pinError);
      throw new Error('Kon pincode niet opslaan');
    }

    // 8. Update profile name if provided
    if (name) {
      await supabaseAdmin
        .from('profiles')
        .update({ naam: name })
        .eq('id', invitation.user_id);
    }

    // 9. Add user to project_users
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

    // 10. Mark invitation as accepted
    await supabaseAdmin
      .from('project_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // 11. Sign in the user and get session
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: invitation.email,
      password: generatedPassword,
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      return new Response(
        JSON.stringify({ 
          success: true, 
          projectId: invitation.project_id,
          email: invitation.email,
          message: 'Account aangemaakt! Je kunt nu inloggen met je pincode.',
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
