import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  pin: string;
  password: string;
  action: 'set' | 'remove' | 'check';
}

// Hash PIN using PBKDF2 with random salt
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  
  // Combine salt + hash and encode to base64
  const combined = new Uint8Array(salt.length + 32);
  combined.set(salt);
  combined.set(new Uint8Array(derivedBits), salt.length);
  
  return btoa(String.fromCharCode(...combined));
}

// Encrypt password using AES-GCM
async function encryptPassword(password: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Create key from encryption key (pad/trim to 32 bytes)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encoder.encode(password)
  );
  
  // Combine IV + encrypted data and encode to base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Niet ingelogd');
    }

    // Create Supabase client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Niet ingelogd');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { pin, password, action }: RequestBody = await req.json();

    console.log('PIN setup action:', action, 'for user:', user.id);

    // Check if user already has a PIN
    if (action === 'check') {
      const { data: existingPin } = await supabaseAdmin
        .from('user_pins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ hasPin: !!existingPin }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Remove PIN
    if (action === 'remove') {
      const { error: deleteError } = await supabaseAdmin
        .from('user_pins')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error removing PIN:', deleteError);
        throw new Error('Kon pincode niet verwijderen');
      }

      console.log('PIN removed successfully for user:', user.id);
      return new Response(
        JSON.stringify({ success: true, message: 'Pincode verwijderd' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Set PIN - validate inputs
    if (!pin || !password) {
      throw new Error('Pincode en wachtwoord zijn verplicht');
    }

    if (!/^\d{6}$/.test(pin)) {
      throw new Error('Pincode moet exact 6 cijfers zijn');
    }

    // Verify password by attempting to sign in
    const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: password,
    });

    if (signInError) {
      console.log('Invalid password for user:', user.id);
      throw new Error('Ongeldig wachtwoord');
    }

    // Hash the PIN
    const pinHash = await hashPin(pin);

    // Encrypt the password
    const encryptionKey = Deno.env.get('PIN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('PIN_ENCRYPTION_KEY niet geconfigureerd');
    }

    const encryptedPassword = await encryptPassword(password, encryptionKey);

    // Upsert PIN data
    const { error: upsertError } = await supabaseAdmin
      .from('user_pins')
      .upsert({
        user_id: user.id,
        pin_hash: pinHash,
        encrypted_password: encryptedPassword,
        failed_attempts: 0,
        locked_until: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error saving PIN:', upsertError);
      throw new Error('Kon pincode niet opslaan');
    }

    console.log('PIN set successfully for user:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Pincode ingesteld' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('PIN setup error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
