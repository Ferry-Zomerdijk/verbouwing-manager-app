import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  email: string;
  pin: string;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Verify PIN using PBKDF2
async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
  
  // Extract salt (first 16 bytes) and hash
  const salt = combined.slice(0, 16);
  const storedDerivedBits = combined.slice(16);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(pin), 'PBKDF2', false, ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  
  // Compare hashes (constant-time comparison)
  const newHash = new Uint8Array(derivedBits);
  if (newHash.length !== storedDerivedBits.length) return false;
  let result = 0;
  for (let i = 0; i < newHash.length; i++) {
    result |= newHash[i] ^ storedDerivedBits[i];
  }
  return result === 0;
}

// Decrypt password using AES-GCM
async function decryptPassword(encryptedData: string, encryptionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  
  // Decode from base64
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);
  
  // Create key from encryption key
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decrypt
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    keyMaterial,
    encrypted
  );
  
  return decoder.decode(decrypted);
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

    const { email, pin }: RequestBody = await req.json();

    if (!email || !pin) {
      throw new Error('Email en pincode zijn verplicht');
    }

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      throw new Error('Pincode moet exact 6 cijfers zijn');
    }

    console.log('PIN login attempt');

    // 1. Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      throw new Error('Inloggen mislukt');
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.log('User not found for PIN login');
      // Don't reveal that user doesn't exist
      throw new Error('Ongeldige email of pincode');
    }

    // 2. Get PIN data for user
    const { data: pinData, error: pinError } = await supabaseAdmin
      .from('user_pins')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (pinError || !pinData) {
      console.log('No PIN data found for user:', user.id);
      throw new Error('Deze gebruiker heeft geen pincode ingesteld. Log in met wachtwoord.');
    }

    // 3. Check if account is locked
    if (pinData.locked_until && new Date(pinData.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(pinData.locked_until).getTime() - Date.now()) / 60000);
      console.log('Account locked, remaining minutes:', remainingMinutes);
      throw new Error(`Account tijdelijk geblokkeerd. Probeer het over ${remainingMinutes} minuten opnieuw.`);
    }

    // 4. Verify PIN using PBKDF2
    const pinValid = await verifyPin(pin, pinData.pin_hash);

    if (!pinValid) {
      console.log('Invalid PIN for user:', user.id);
      
      // Increment failed attempts
      const newFailedAttempts = (pinData.failed_attempts || 0) + 1;
      const updateData: { failed_attempts: number; locked_until?: string } = {
        failed_attempts: newFailedAttempts,
      };

      // Lock account if max attempts reached
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000);
        updateData.locked_until = lockUntil.toISOString();
        console.log('Locking account until:', lockUntil);
      }

      await supabaseAdmin
        .from('user_pins')
        .update(updateData)
        .eq('user_id', user.id);

      const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
      if (remainingAttempts > 0) {
        throw new Error(`Ongeldige pincode. Nog ${remainingAttempts} poging${remainingAttempts === 1 ? '' : 'en'} over.`);
      } else {
        throw new Error(`Account geblokkeerd voor ${LOCKOUT_MINUTES} minuten vanwege te veel mislukte pogingen.`);
      }
    }

    // 5. PIN is valid - reset failed attempts
    await supabaseAdmin
      .from('user_pins')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('user_id', user.id);

    // 6. Decrypt the stored password
    const encryptionKey = Deno.env.get('PIN_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('PIN_ENCRYPTION_KEY niet geconfigureerd');
    }

    const decryptedPassword = await decryptPassword(pinData.encrypted_password, encryptionKey);
    console.log('Password decrypted successfully');

    // 7. Sign in with decrypted password
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: user.email!,
      password: decryptedPassword,
    });

    if (signInError) {
      console.error('Error signing in with decrypted password:', signInError);
      throw new Error('Inloggen mislukt. Neem contact op met support.');
    }

    console.log('Successfully logged in user via PIN');

    return new Response(
      JSON.stringify({ 
        success: true,
        session: signInData.session,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('PIN login error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
