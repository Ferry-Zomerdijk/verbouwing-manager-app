import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getProPlan, tierForPrice } from "../_shared/proPlan.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map price IDs to tiers
const PRICE_TO_TIER: Record<string, string> = {
  "price_1SktI7GzO5wk8qyVK5wr1ENc": "basis",
  "price_1SktK8GzO5wk8qyVsW9NlTMb": "pro",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Find Stripe customer by email
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ 
        synced: false, 
        reason: "no_customer",
        subscription: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubscriptions.data.length === 0) {
        logStep("No active or trialing subscription found in Stripe");
        return new Response(JSON.stringify({ 
          synced: false, 
          reason: "no_subscription",
          subscription: null 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Use trialing subscription
      subscriptions.data = trialingSubscriptions.data;
    }

    const stripeSub = subscriptions.data[0];
    const priceId = stripeSub.items.data[0]?.price.id;
    const tier = PRICE_TO_TIER[priceId] || "basis";
    
    logStep("Found Stripe subscription", { 
      subscriptionId: stripeSub.id, 
      status: stripeSub.status,
      priceId,
      tier
    });

    // Check if subscription exists in database
    const { data: existingSub, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();

    if (fetchError) {
      logStep("Error fetching existing subscription", { error: fetchError.message });
    }

    const subscriptionData = {
      id: stripeSub.id,
      user_id: user.id,
      customer_id: customerId,
      price_id: priceId,
      status: stripeSub.status as "active" | "trialing",
      tier: tier as "basis" | "pro",
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
      trial_start: stripeSub.trial_start ? new Date(stripeSub.trial_start * 1000).toISOString() : null,
      trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
      cancel_at: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000).toISOString() : null,
      canceled_at: stripeSub.canceled_at ? new Date(stripeSub.canceled_at * 1000).toISOString() : null,
    };

    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update(subscriptionData)
        .eq("id", existingSub.id);

      if (updateError) {
        logStep("Error updating subscription", { error: updateError.message });
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }
      logStep("Updated existing subscription in database");
    } else {
      // Insert new subscription
      const { error: insertError } = await supabaseAdmin
        .from("subscriptions")
        .insert(subscriptionData);

      if (insertError) {
        logStep("Error inserting subscription", { error: insertError.message });
        throw new Error(`Failed to insert subscription: ${insertError.message}`);
      }
      logStep("Inserted new subscription into database");
    }

    // Also ensure customer record exists
    const { data: existingCustomer } = await supabaseAdmin
      .from("customers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingCustomer) {
      await supabaseAdmin
        .from("customers")
        .insert({
          user_id: user.id,
          stripe_customer_id: customerId,
        });
      logStep("Created customer record");
    }

    return new Response(JSON.stringify({ 
      synced: true,
      subscription: {
        id: stripeSub.id,
        status: stripeSub.status,
        tier,
        current_period_end: subscriptionData.current_period_end,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
