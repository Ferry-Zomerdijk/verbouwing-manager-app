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

// Webhook health monitoring helpers
async function logWebhookEvent(
  eventId: string,
  eventType: string,
  status: 'received' | 'processing' | 'success' | 'failed',
  options?: {
    stripeCustomerId?: string;
    userId?: string;
    errorMessage?: string;
    processingTimeMs?: number;
  }
) {
  try {
    const { error } = await supabaseAdmin.from("webhook_events").upsert({
      event_id: eventId,
      event_type: eventType,
      status,
      stripe_customer_id: options?.stripeCustomerId || null,
      user_id: options?.userId || null,
      error_message: options?.errorMessage || null,
      processing_time_ms: options?.processingTimeMs || null,
      processed_at: status === 'success' || status === 'failed' ? new Date().toISOString() : null,
    }, { onConflict: 'event_id' });
    
    if (error) {
      console.error("[WEBHOOK-MONITOR] Failed to log event:", error);
    }
  } catch (err) {
    console.error("[WEBHOOK-MONITOR] Exception logging event:", err);
  }
}

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

function generateCancellationEmailHtml(
  userName: string,
  tier: string
): string {
  const tierName = getTierDisplayName(tier);
  const features = getTierFeatures(tier);

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
            <td style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                Je abonnement is beëindigd
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
                Je <strong>${tierName}</strong> abonnement is nu beëindigd. We vinden het jammer om je te zien gaan!
              </p>
              
              <!-- Lost Features Box -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
                <h2 style="color: #991b1b; font-size: 16px; margin: 0 0 16px; font-weight: 600;">
                  ⚠️ Je verliest toegang tot:
                </h2>
                <ul style="color: #7f1d1d; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  ${features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
              </div>
              
              <!-- Free Tier Info -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #374151; font-size: 16px; margin: 0 0 12px; font-weight: 600;">
                  Wat kun je nog wel doen?
                </h2>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                  Met het gratis account heb je nog steeds toegang tot 1 project, 10 taken per project, en basis functionaliteit. 
                  Je bestaande projecten en data blijven bewaard.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0;">
                Wil je toch weer upgraden? Je kunt op elk moment je abonnement opnieuw activeren.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://bouwapp.lovable.app/pricing" 
                   style="display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Bekijk abonnementen →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Feedback? Laat ons weten waarom je hebt opgezegd, zodat we kunnen verbeteren.<br>
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

async function sendCancellationEmail(userId: string, tier: string) {
  try {
    console.log("Sending cancellation email for user:", userId);
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, naam")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      console.error("Could not fetch user profile for cancellation email:", profileError);
      return;
    }

    const { data, error } = await resend.emails.send({
      from: "Bouw App <onboarding@resend.dev>",
      to: [profile.email],
      subject: `Je ${getTierDisplayName(tier)} abonnement is beëindigd`,
      html: generateCancellationEmailHtml(profile.naam || "", tier),
    });

    if (error) {
      console.error("Error sending cancellation email:", error);
      return;
    }

    console.log("Cancellation email sent successfully:", data);
  } catch (error) {
    console.error("Exception sending cancellation email:", error);
  }
}

function generatePaymentFailedEmailHtml(userName: string, attemptCount: number): string {
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
            <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ⚠️ Betaling mislukt
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
                We konden je laatste betaling voor je abonnement niet verwerken. ${attemptCount > 1 ? `Dit is poging ${attemptCount}.` : ''}
              </p>
              
              <!-- Warning Box -->
              <div style="background-color: #fef2f2; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #ef4444;">
                <h2 style="color: #991b1b; font-size: 16px; margin: 0 0 12px; font-weight: 600;">
                  Actie vereist
                </h2>
                <p style="color: #7f1d1d; font-size: 14px; line-height: 1.6; margin: 0;">
                  Om te voorkomen dat je abonnement wordt geannuleerd, werk je betaalmethode bij via onderstaande knop.
                </p>
              </div>
              
              <!-- Steps Box -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin: 24px 0;">
                <h2 style="color: #374151; font-size: 16px; margin: 0 0 16px; font-weight: 600;">
                  Hoe los je dit op?
                </h2>
                <ol style="color: #6b7280; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Klik op de knop hieronder om naar je account te gaan</li>
                  <li>Ga naar "Abonnement beheren"</li>
                  <li>Werk je betaalmethode bij met een geldige kaart</li>
                  <li>De betaling wordt automatisch opnieuw geprobeerd</li>
                </ol>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://bouwapp.lovable.app/dashboard" 
                   style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Betaalmethode bijwerken →
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0; text-align: center;">
                Heb je vragen? Neem gerust contact met ons op.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Dit is een automatisch bericht over je abonnementsbetaling.<br>
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

async function sendPaymentFailedEmail(customerEmail: string, customerName: string, attemptCount: number) {
  try {
    console.log("Sending payment failed email to:", customerEmail);

    const { data, error } = await resend.emails.send({
      from: "Bouw App <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "⚠️ Je betaling is mislukt - actie vereist",
      html: generatePaymentFailedEmailHtml(customerName, attemptCount),
    });

    if (error) {
      console.error("Error sending payment failed email:", error);
      return;
    }

    console.log("Payment failed email sent successfully:", data);
  } catch (error) {
    console.error("Exception sending payment failed email:", error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing failed invoice payment:", invoice.id);

  const customerEmail = invoice.customer_email;
  const customerName = invoice.customer_name || "";
  const attemptCount = invoice.attempt_count || 1;

  if (!customerEmail) {
    console.error("No customer email found on invoice");
    return;
  }

  await sendPaymentFailedEmail(customerEmail, customerName, attemptCount);
}

function generatePaymentRecoveredEmailHtml(userName: string): string {
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
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ✅ Betaling geslaagd!
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
                Goed nieuws! Je betaling is nu succesvol verwerkt en je abonnement blijft actief.
              </p>
              
              <!-- Success Box -->
              <div style="background-color: #d1fae5; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #10b981;">
                <h2 style="color: #065f46; font-size: 16px; margin: 0 0 12px; font-weight: 600;">
                  Alles is in orde
                </h2>
                <p style="color: #047857; font-size: 14px; line-height: 1.6; margin: 0;">
                  Je hoeft verder niets te doen. Je hebt weer volledige toegang tot alle premium features van je abonnement.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0;">
                Bedankt dat je klant blijft! Als je vragen hebt over je abonnement of facturen, kun je altijd contact met ons opnemen.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://bouwapp.lovable.app/dashboard" 
                   style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Naar mijn dashboard →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Dit is een bevestiging van je herstelde abonnementsbetaling.<br>
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

async function sendPaymentRecoveredEmail(customerEmail: string, customerName: string) {
  try {
    console.log("Sending payment recovered email to:", customerEmail);

    const { data, error } = await resend.emails.send({
      from: "Bouw App <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "✅ Je betaling is geslaagd!",
      html: generatePaymentRecoveredEmailHtml(customerName),
    });

    if (error) {
      console.error("Error sending payment recovered email:", error);
      return;
    }

    console.log("Payment recovered email sent successfully:", data);
  } catch (error) {
    console.error("Exception sending payment recovered email:", error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log("Processing successful invoice payment:", invoice.id);

  // Only send email if this was a recovery (attempt_count > 1 means there were failed attempts before)
  const attemptCount = invoice.attempt_count || 1;
  
  if (attemptCount <= 1) {
    console.log("First attempt success, no recovery email needed");
    return;
  }

  const customerEmail = invoice.customer_email;
  const customerName = invoice.customer_name || "";

  if (!customerEmail) {
    console.error("No customer email found on invoice");
    return;
  }

  console.log(`Payment recovered after ${attemptCount} attempts, sending recovery email`);
  await sendPaymentRecoveredEmail(customerEmail, customerName);
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

  // First get the subscription to find user_id and tier before updating
  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, tier")
    .eq("id", subscription.id)
    .single();

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({ status: "canceled", canceled_at: new Date().toISOString() })
    .eq("id", subscription.id);

  if (error) {
    console.error("Error updating deleted subscription:", error);
    throw error;
  }

  // Send cancellation email
  if (existingSub?.user_id) {
    await sendCancellationEmail(existingSub.user_id, existingSub.tier || "basis");
  }
}

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  
  if (!signature) {
    console.log("No signature found, processing without verification");
  }

  const startTime = Date.now();
  let eventId = "unknown";
  let eventType = "unknown";

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
        await logWebhookEvent("sig_failed_" + Date.now(), "signature_verification", "failed", {
          errorMessage: errMessage,
        });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // Parse without verification (for testing)
      event = JSON.parse(body);
    }

    eventId = event.id;
    eventType = event.type;
    console.log("[WEBHOOK-MONITOR] Received event:", eventType, eventId);

    // Log received event
    await logWebhookEvent(eventId, eventType, "processing");

    let stripeCustomerId: string | undefined;
    let userId: string | undefined;

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        stripeCustomerId = subscription.customer as string;
        userId = subscription.metadata?.supabase_user_id;
        await handleSubscriptionEvent(subscription, event.type);
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        stripeCustomerId = subscription.customer as string;
        await handleCustomerSubscriptionDeleted(subscription);
        break;
      }
      
      case "product.created":
      case "product.updated":
        await handleProductEvent(event.data.object as Stripe.Product, event.type);
        break;
      
      case "price.created":
      case "price.updated":
        await handlePriceEvent(event.data.object as Stripe.Price, event.type);
        break;
      
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        stripeCustomerId = session.customer as string;
        console.log("Checkout completed for session:", session.id);
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        stripeCustomerId = invoice.customer as string;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        stripeCustomerId = invoice.customer as string;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      
      default:
        console.log("Unhandled event type:", event.type);
    }

    const processingTime = Date.now() - startTime;
    await logWebhookEvent(eventId, eventType, "success", {
      stripeCustomerId,
      userId,
      processingTimeMs: processingTime,
    });

    console.log(`[WEBHOOK-MONITOR] Successfully processed ${eventType} in ${processingTime}ms`);

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    console.error(`[WEBHOOK-MONITOR] Failed to process ${eventType}:`, errorMessage);
    
    await logWebhookEvent(eventId, eventType, "failed", {
      errorMessage,
      processingTimeMs: processingTime,
    });

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
