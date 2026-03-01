import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to convert ArrayBuffer to base64url string
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Base64 URL to ArrayBuffer
function base64UrlToArrayBuffer(base64: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(b64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function should only be called from other edge functions (server-side)
    // Verify the caller is using the service role key via Authorization header
    const authHeader = req.headers.get('Authorization');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Only allow service role calls (from other edge functions)
    if (token !== supabaseServiceRoleKey) {
      // Also check if it's an authenticated user with admin role
      const userClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        supabaseAnonKey,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Only admins can directly call this function
      const adminClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        supabaseServiceRoleKey
      );
      const { data: adminRole } = await adminClient
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      
      if (!adminRole) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseServiceRoleKey
    );

    const { user_id, title, body, url, tag, icon } = await req.json();

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending push notification to user ${user_id}: ${title}`);

    // Get all subscriptions for this user
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${user_id}`);
      return new Response(
        JSON.stringify({ success: true, message: 'No subscriptions found', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('VAPID keys not configured');
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      url: url || '/',
      tag: tag || 'general',
      timestamp: Date.now(),
    });

    let successCount = 0;
    const failedSubscriptions: string[] = [];

    for (const sub of subscriptions) {
      try {
        // Create JWT for VAPID
        const encoder = new TextEncoder();
        const audience = new URL(sub.endpoint).origin;
        
        // JWT Header
        const header = { alg: 'ES256', typ: 'JWT' };
        const headerB64 = arrayBufferToBase64Url(encoder.encode(JSON.stringify(header)).buffer as ArrayBuffer);
        
        // JWT Claims
        const now = Math.floor(Date.now() / 1000);
        const claims = {
          aud: audience,
          exp: now + 12 * 60 * 60,
          sub: 'mailto:ron@fonkelmedia.nl',
        };
        const claimsB64 = arrayBufferToBase64Url(encoder.encode(JSON.stringify(claims)).buffer as ArrayBuffer);
        
        // Import private key for signing
        const privateKeyBuffer = base64UrlToArrayBuffer(vapidPrivateKey);
        
        // For ECDSA P-256, we need to create a proper JWK
        const privateKeyArray = new Uint8Array(privateKeyBuffer);
        
        const jwk = {
          kty: 'EC',
          crv: 'P-256',
          d: vapidPrivateKey,
          x: vapidPublicKey.substring(0, 43),
          y: vapidPublicKey.substring(43),
        };

        const privateKey = await crypto.subtle.importKey(
          'jwk',
          jwk,
          { name: 'ECDSA', namedCurve: 'P-256' },
          false,
          ['sign']
        );

        // Sign the JWT
        const unsignedToken = `${headerB64}.${claimsB64}`;
        const signature = await crypto.subtle.sign(
          { name: 'ECDSA', hash: 'SHA-256' },
          privateKey,
          encoder.encode(unsignedToken)
        );

        // Convert signature from DER to raw format (r || s)
        const signatureB64 = arrayBufferToBase64Url(signature);
        const jwt = `${unsignedToken}.${signatureB64}`;

        // Send push notification (without encryption for simplicity - just the endpoint)
        // Note: For full encryption, you'd need to implement RFC 8291
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `vapid t=${jwt}, k=${vapidPublicKey}`,
            'Content-Type': 'application/json',
            'TTL': '86400',
          },
          body: payload,
        });

        if (response.ok || response.status === 201) {
          successCount++;
          console.log(`Push sent successfully to endpoint: ${sub.endpoint.substring(0, 50)}...`);
        } else if (response.status === 404 || response.status === 410) {
          console.log(`Removing expired subscription: ${sub.id}`);
          failedSubscriptions.push(sub.id);
        } else {
          const responseText = await response.text();
          console.error(`Push failed with status ${response.status}: ${responseText}`);
        }
      } catch (error) {
        console.error(`Error sending push to ${sub.id}:`, error);
      }
    }

    // Remove invalid subscriptions
    if (failedSubscriptions.length > 0) {
      await supabaseClient
        .from('push_subscriptions')
        .delete()
        .in('id', failedSubscriptions);
      console.log(`Removed ${failedSubscriptions.length} expired subscriptions`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: subscriptions.length,
        removed: failedSubscriptions.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});