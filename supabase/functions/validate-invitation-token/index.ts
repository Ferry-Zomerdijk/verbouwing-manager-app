import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  token: string;
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

    const { token }: RequestBody = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Geen token opgegeven' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating invitation token:', token.substring(0, 8) + '...');

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('project_invitations')
      .select('id, email, expires_at, accepted_at')
      .eq('invite_token', token)
      .single();

    if (inviteError || !invitation) {
      console.log('Invitation not found');
      return new Response(
        JSON.stringify({ valid: false, error: 'Uitnodiging niet gevonden' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      console.log('Invitation already accepted');
      return new Response(
        JSON.stringify({ valid: false, error: 'Deze uitnodiging is al geaccepteerd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      console.log('Invitation expired');
      return new Response(
        JSON.stringify({ valid: false, error: 'Deze uitnodiging is verlopen' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Invitation is valid for:', invitation.email);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        email: invitation.email,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Fout bij valideren uitnodiging' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
