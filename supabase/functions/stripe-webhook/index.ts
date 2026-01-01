import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Map price metadata to tier
function getTierFromPrice(priceId: string, metadata: Record<string, string>): string {
  if (metadata?.tier) return metadata.tier;
  // Default tier mapping based on amount can be added here
  return "basis";
}

async function handleSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  console.log(`Processing ${eventType} for subscription:`, subscription.id);

  const userId = subscription.metadata?.supabase_user_id;
  if (!userId) {
    console.error("No supabase_user_id in subscription metadata");
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const price = subscription.items.data[0]?.price;
  const tier = getTierFromPrice(priceId, price?.metadata || {});

  const subscriptionData = {
    id: subscription.id,
    user_id: userId,
    customer_id: subscription.customer as string,
    price_id: priceId,
    status: subscription.status,
    tier: tier,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
    metadata: subscription.metadata,
  };

  console.log("Upserting subscription:", subscriptionData);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(subscriptionData, { onConflict: "id" });

  if (error) {
    console.error("Error upserting subscription:", error);
    throw error;
  }

  console.log("Subscription upserted successfully");
}

async function handleProductEvent(product: Stripe.Product, eventType: string) {
  console.log(`Processing ${eventType} for product:`, product.id);

  const productData = {
    id: product.id,
    name: product.name,
    description: product.description,
    active: product.active,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdmin
    .from("products")
    .upsert(productData, { onConflict: "id" });

  if (error) {
    console.error("Error upserting product:", error);
    throw error;
  }
}

async function handlePriceEvent(price: Stripe.Price, eventType: string) {
  console.log(`Processing ${eventType} for price:`, price.id);

  const priceData = {
    id: price.id,
    product_id: price.product as string,
    active: price.active,
    currency: price.currency,
    unit_amount: price.unit_amount,
    interval: price.recurring?.interval || null,
    interval_count: price.recurring?.interval_count || null,
    trial_period_days: price.recurring?.trial_period_days || null,
    type: price.type,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdmin
    .from("prices")
    .upsert(priceData, { onConflict: "id" });

  if (error) {
    console.error("Error upserting price:", error);
    throw error;
  }
}

async function handleCustomerSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Processing subscription deletion:", subscription.id);

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", subscription.id);

  if (error) {
    console.error("Error updating deleted subscription:", error);
    throw error;
  }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!signature) {
    console.log("No signature found, processing without verification");
  }

  try {
    const body = await req.text();
    let event: Stripe.Event;

    // If we have a webhook secret, verify the signature
    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      } catch (err) {
        const errMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("Webhook signature verification failed:", errMessage);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // Parse without verification (for testing)
      event = JSON.parse(body);
    }

    console.log("Received webhook event:", event.type);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription, event.type);
        break;
      
      case "customer.subscription.deleted":
        await handleCustomerSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case "product.created":
      case "product.updated":
        await handleProductEvent(event.data.object as Stripe.Product, event.type);
        break;
      
      case "price.created":
      case "price.updated":
        await handlePriceEvent(event.data.object as Stripe.Price, event.type);
        break;
      
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed for session:", session.id);
        // Subscription will be handled by customer.subscription.created event
        break;
      
      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
