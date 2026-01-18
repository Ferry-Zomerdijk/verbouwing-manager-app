import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Price and product IDs for each tier
const TIER_CONFIG = {
  basis: {
    productId: "prod_TiJvrPggwqeBgF",
    priceId: "price_1SktI7GzO5wk8qyVK5wr1ENc",
  },
  pro: {
    productId: "prod_TiJysg1CJilS1o",
    priceId: "price_1SktK8GzO5wk8qyVsW9NlTMb",
  },
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the requester is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Geen autorisatie header aanwezig");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Niet geauthenticeerd");
    }

    const adminUserId = userData.user.id;
    logStep("Admin authenticated", { adminUserId });

    // Verify admin role
    const { data: adminRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUserId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !adminRole) {
      throw new Error("Je hebt geen admin rechten");
    }
    logStep("Admin role verified");

    // Parse request body
    const { userId, tier, durationMonths, createStripeCustomer } = await req.json();
    logStep("Request parsed", { userId, tier, durationMonths, createStripeCustomer });

    if (!userId || !tier) {
      throw new Error("userId en tier zijn verplicht");
    }

    if (!["free", "basis", "pro"].includes(tier)) {
      throw new Error("Ongeldige tier");
    }

    // Get target user info
    const { data: targetUser, error: targetUserError } = await supabaseClient
      .from("profiles")
      .select("id, email, naam")
      .eq("id", userId)
      .single();

    if (targetUserError || !targetUser) {
      throw new Error("Gebruiker niet gevonden");
    }
    logStep("Target user found", { email: targetUser.email });

    // Calculate subscription period
    const now = new Date();
    let periodEnd: Date | null = null;
    
    if (tier !== "free" && durationMonths !== null) {
      periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + durationMonths);
    } else if (tier !== "free") {
      // Unlimited: set to 100 years from now
      periodEnd = new Date(now);
      periodEnd.setFullYear(periodEnd.getFullYear() + 100);
    }

    let stripeCustomerId: string | null = null;

    // Check for existing customer record
    const { data: existingCustomer } = await supabaseClient
      .from("customers")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingCustomer?.stripe_customer_id) {
      stripeCustomerId = existingCustomer.stripe_customer_id;
      logStep("Existing Stripe customer found", { stripeCustomerId });
    }

    // Create Stripe customer if requested and not exists
    if (createStripeCustomer && !stripeCustomerId && tier !== "free") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
          
          const customer = await stripe.customers.create({
            email: targetUser.email || undefined,
            name: targetUser.naam || undefined,
            metadata: {
              supabase_user_id: userId,
              created_by_admin: adminUserId,
            },
          });
          
          stripeCustomerId = customer.id;
          logStep("Stripe customer created", { stripeCustomerId });
        } catch (stripeError) {
          logStep("Stripe customer creation failed", { error: String(stripeError) });
          // Continue without Stripe customer
        }
      }
    }

    // Upsert customer record if we have a Stripe customer ID
    if (stripeCustomerId) {
      const { error: customerError } = await supabaseClient
        .from("customers")
        .upsert({
          user_id: userId,
          stripe_customer_id: stripeCustomerId,
          updated_at: now.toISOString(),
        }, {
          onConflict: "user_id",
        });

      if (customerError) {
        logStep("Customer upsert error", { error: customerError.message });
      } else {
        logStep("Customer record upserted");
      }
    }

    // Handle subscription based on tier
    if (tier === "free") {
      // Delete or cancel existing subscription
      const { error: deleteError } = await supabaseClient
        .from("subscriptions")
        .delete()
        .eq("user_id", userId);

      if (deleteError) {
        logStep("Subscription delete error", { error: deleteError.message });
      } else {
        logStep("Subscription deleted (downgraded to free)");
      }
    } else {
      // Get tier config
      const tierConfig = TIER_CONFIG[tier as "basis" | "pro"];
      
      // Check for existing subscription
      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const subscriptionData = {
        user_id: userId,
        tier: tier,
        status: "active" as const,
        price_id: tierConfig.priceId,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd?.toISOString() || null,
        customer_id: stripeCustomerId,
        metadata: {
          created_by_admin: adminUserId,
          manual_upgrade: true,
          duration_months: durationMonths,
        },
        updated_at: now.toISOString(),
      };

      if (existingSub) {
        // Update existing subscription
        const { error: updateError } = await supabaseClient
          .from("subscriptions")
          .update(subscriptionData)
          .eq("id", existingSub.id);

        if (updateError) {
          throw new Error(`Subscription update failed: ${updateError.message}`);
        }
        logStep("Subscription updated", { tier, periodEnd: periodEnd?.toISOString() });
      } else {
        // Create new subscription
        const { error: insertError } = await supabaseClient
          .from("subscriptions")
          .insert({
            id: crypto.randomUUID(),
            ...subscriptionData,
            created_at: now.toISOString(),
          });

        if (insertError) {
          throw new Error(`Subscription insert failed: ${insertError.message}`);
        }
        logStep("Subscription created", { tier, periodEnd: periodEnd?.toISOString() });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tier,
        periodEnd: periodEnd?.toISOString() || null,
        stripeCustomerId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
