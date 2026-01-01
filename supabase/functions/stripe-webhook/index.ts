import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Map price metadata to tier
function getTierFromPrice(priceId: string, metadata: Record<string, string>): string {
  if (metadata?.tier) return metadata.tier;
  // Default tier mapping based on amount can be added here
  return "basis";
}

function getTierDisplayName(tier: string): string {
  switch (tier) {
    case "pro":
      return "Pro";
    case "basis":
      return "Basis";
    default:
      return tier.charAt(0).toUpperCase() + tier.slice(1);
  }
}

function getTierFeatures(tier: string): string[] {
  switch (tier) {
    case "pro":
      return [
        "Onbeperkt projecten",
        "Onbeperkt taken per project",
        "Onbeperkt teamleden uitnodigen",
        "Onbeperkt aannemers",
        "Documenten importeren & exporteren",
        "Prioriteit ondersteuning"
      ];
    case "basis":
      return [
        "Tot 5 projecten",
        "Tot 50 taken per project",
        "Tot 3 teamleden per project",
        "Tot 10 aannemers per project",
        "Basis documenten functionaliteit"
      ];
    default:
      return ["Basis functionaliteit"];
  }
}

function generateSubscriptionEmailHtml(
  userName: string,
  tier: string,
  periodEnd: Date
): string {
  const tierName = getTierDisplayName(tier);
  const features = getTierFeatures(tier);
  const formattedDate = periodEnd.toLocaleDateString("nl-NL", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                🎉 Welkom bij ${tierName}!
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Hoi${userName ? ` ${userName}` : ''},
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Bedankt voor je ${tierName} abonnement! Je hebt nu toegang tot alle premium features om je bouwprojecten nog beter te beheren.
              </p>
              
              <!-- Features Box -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #92400e; font-size: 18px; margin: 0 0 16px; font-weight: 600;">
                  Jouw ${tierName} features:
                </h2>
                <ul style="color: #78350f; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  ${features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
              
              <!-- Period Info -->
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0;">
                Je abonnement verlengt automatisch op <strong>${formattedDate}</strong>. 
                Je kunt je abonnement op elk moment beheren via je account instellingen.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://bouwapp.lovable.app/dashboard" 
                   style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Naar mijn dashboard →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Heb je vragen? Neem gerust contact met ons op.<br>
                © ${new Date().getFullYear()} Bouw App. Alle rechten voorbehouden.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

async function sendSubscriptionConfirmationEmail(
  userId: string,
  tier: string,
  periodEnd: Date
) {
  try {
    console.log("Fetching user profile for email notification:", userId);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, naam")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Could not fetch user profile:", profileError);
      return;
    }

    console.log("Sending subscription confirmation email to:", profile.email);

    const { data, error } = await resend.emails.send({
      from: "Bouw App <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Welkom bij ${getTierDisplayName(tier)}! 🎉`,
      html: generateSubscriptionEmailHtml(profile.naam || "", tier, periodEnd),
    });

    if (error) {
      console.error("Error sending subscription confirmation email:", error);
      return;
    }

    console.log("Subscription confirmation email sent successfully:", data);
  } catch (error) {
    console.error("Exception sending subscription confirmation email:", error);
  }
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

  // Send welcome email for new subscriptions
  if (eventType === "customer.subscription.created") {
    const periodEnd = new Date(subscription.current_period_end * 1000);
    await sendSubscriptionConfirmationEmail(userId, tier, periodEnd);
  }
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
