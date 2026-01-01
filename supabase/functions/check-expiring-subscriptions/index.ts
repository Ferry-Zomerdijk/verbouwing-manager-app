import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

function generateExpiryReminderEmailHtml(
  userName: string,
  tier: string,
  expiryDate: Date
): string {
  const tierName = getTierDisplayName(tier);
  const formattedDate = expiryDate.toLocaleDateString("nl-NL", {
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
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
                ⏰ Je abonnement verloopt bijna
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
                Dit is een vriendelijke herinnering dat je <strong>${tierName}</strong> abonnement over 7 dagen verloopt op <strong>${formattedDate}</strong>.
              </p>
              
              <!-- Info Box -->
              <div style="background-color: #dbeafe; border-radius: 8px; padding: 24px; margin: 24px 0; border-left: 4px solid #3b82f6;">
                <h2 style="color: #1e40af; font-size: 16px; margin: 0 0 12px; font-weight: 600;">
                  Wat gebeurt er daarna?
                </h2>
                <p style="color: #1e3a8a; font-size: 14px; line-height: 1.6; margin: 0;">
                  Als je automatische verlenging hebt ingeschakeld, wordt je abonnement automatisch verlengd. 
                  Als je dit niet wilt, kun je je abonnement opzeggen via je account instellingen.
                </p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0;">
                Wil je je abonnement beheren of wijzigen? Je kunt dit eenvoudig doen via je account instellingen.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://bouwapp.lovable.app/dashboard" 
                   style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Bekijk mijn abonnement →
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                Heb je vragen over je abonnement? Neem gerust contact met ons op.<br>
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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting check for expiring subscriptions...");

    // Calculate date 7 days from now
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

    // Find subscriptions expiring in ~7 days that haven't received a reminder
    // We use a range (6-7 days) to account for cron timing
    const { data: expiringSubscriptions, error: fetchError } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, tier, current_period_end, expiry_reminder_sent_at")
      .eq("status", "active")
      .gte("current_period_end", sixDaysFromNow.toISOString())
      .lte("current_period_end", sevenDaysFromNow.toISOString())
      .is("expiry_reminder_sent_at", null);

    if (fetchError) {
      console.error("Error fetching expiring subscriptions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} subscriptions expiring in 7 days`);

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: "No expiring subscriptions found", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    let sentCount = 0;
    const errors: string[] = [];

    for (const subscription of expiringSubscriptions) {
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("email, naam")
          .eq("id", subscription.user_id)
          .single();

        if (profileError || !profile?.email) {
          console.error(`Could not fetch profile for user ${subscription.user_id}:`, profileError);
          errors.push(`User ${subscription.user_id}: profile not found`);
          continue;
        }

        const expiryDate = new Date(subscription.current_period_end);

        // Send reminder email
        const { error: emailError } = await resend.emails.send({
          from: "Bouw App <onboarding@resend.dev>",
          to: [profile.email],
          subject: `⏰ Je ${getTierDisplayName(subscription.tier)} abonnement verloopt over 7 dagen`,
          html: generateExpiryReminderEmailHtml(profile.naam || "", subscription.tier, expiryDate),
        });

        if (emailError) {
          console.error(`Error sending email to ${profile.email}:`, emailError);
          errors.push(`User ${subscription.user_id}: email send failed`);
          continue;
        }

        // Mark reminder as sent
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ expiry_reminder_sent_at: now.toISOString() })
          .eq("id", subscription.id);

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError);
          errors.push(`Subscription ${subscription.id}: update failed`);
          continue;
        }

        console.log(`Sent expiry reminder to ${profile.email} for subscription ${subscription.id}`);
        sentCount++;
      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error);
        errors.push(`Subscription ${subscription.id}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }

    console.log(`Finished: sent ${sentCount} reminders, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        message: "Expiry check completed",
        sent: sentCount,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in check-expiring-subscriptions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
