import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tier limits configuration (keep in sync with frontend)
const TIER_LIMITS: Record<string, number> = {
  free: 0,
  basis: 0, // invoice scanning is Pro-only
  pro: -1, // unlimited
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Niet ingelogd', canUse: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Niet ingelogd', canUse: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Checking AI usage for user:', user.id);

    // Get user's subscription tier
    const { data: subscription, error: subError } = await supabaseClient
      .from('subscriptions')
      .select('tier, status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error('Subscription error:', subError);
    }

    const tier = subscription?.tier || 'free';
    const limit = TIER_LIMITS[tier] ?? 0;

    console.log('User tier:', tier, 'Limit:', limit);

    // If unlimited, return immediately
    if (limit === -1) {
      return new Response(
        JSON.stringify({
          canUse: true,
          currentUsage: 0,
          limit: -1,
          tier,
          isUnlimited: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If free tier (limit = 0), no AI access
    if (limit === 0) {
      return new Response(
        JSON.stringify({
          canUse: false,
          currentUsage: 0,
          limit: 0,
          tier,
          isUnlimited: false,
          error: 'AI factuurscanning is niet beschikbaar in het gratis abonnement. Upgrade naar Basis of Pro.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get usage count for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count, error: countError } = await supabaseClient
      .from('ai_usage')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('usage_type', 'invoice_scan')
      .gte('created_at', firstDayOfMonth);

    if (countError) {
      console.error('Count error:', countError);
    }

    const currentUsage = count || 0;
    const canUse = currentUsage < limit;

    console.log('Current usage:', currentUsage, 'Can use:', canUse);

    return new Response(
      JSON.stringify({
        canUse,
        currentUsage,
        limit,
        tier,
        isUnlimited: false,
        remaining: limit - currentUsage,
        error: canUse ? null : `Je hebt de maandelijkse limiet van ${limit} AI scans bereikt. Upgrade naar Pro voor onbeperkte scans.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in check-ai-usage:', error);
    return new Response(
      JSON.stringify({ error: error.message, canUse: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
