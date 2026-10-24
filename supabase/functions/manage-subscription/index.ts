import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// In-app subscription management: status, cancel at period end, resume, invoice list.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u.user) return json({ error: "Niet ingelogd" }, 401);
    const { action } = await req.json().catch(() => ({ action: "status" }));

    const { data: cust } = await admin.from("customers").select("stripe_customer_id").eq("user_id", u.user.id).maybeSingle();
    const customerId = cust?.stripe_customer_id;
    if (!customerId) return json({ subscription: null, invoices: [] });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16" });
    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 5 });
    const sub = subs.data.find((s) => ["active", "trialing", "past_due"].includes(s.status));

    if ((action === "cancel" || action === "resume") && sub) {
      const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: action === "cancel" });
      await admin.from("subscriptions").update({
        cancel_at: updated.cancel_at ? new Date(updated.cancel_at * 1000).toISOString() : null,
        canceled_at: updated.canceled_at ? new Date(updated.canceled_at * 1000).toISOString() : null,
      }).eq("id", sub.id).eq("user_id", u.user.id);
      console.log("Subscription", action, sub.id);
    }

    const fresh = sub ? await stripe.subscriptions.retrieve(sub.id) : null;
    const inv = await stripe.invoices.list({ customer: customerId, limit: 24 });
    const item = fresh?.items.data[0]?.price;
    return json({
      subscription: fresh && {
        status: fresh.status,
        cancel_at_period_end: fresh.cancel_at_period_end,
        current_period_start: new Date(fresh.current_period_start * 1000).toISOString(),
        current_period_end: new Date(fresh.current_period_end * 1000).toISOString(),
        amount_cents: item?.unit_amount ?? null,
        currency: item?.currency ?? "eur",
        interval: item?.recurring?.interval ?? "month",
      },
      invoices: inv.data.map((i) => ({
        id: i.id,
        number: i.number,
        date: new Date(i.created * 1000).toISOString(),
        amount_cents: i.amount_paid || i.amount_due,
        currency: i.currency,
        status: i.status,
        pdf: i.invoice_pdf,
        url: i.hosted_invoice_url,
      })),
    });
  } catch (e) {
    console.error("manage-subscription error", e instanceof Error ? e.message : e);
    return json({ error: "Abonnement ophalen mislukt" }, 500);
  }
});
