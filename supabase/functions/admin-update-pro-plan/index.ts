import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getProPlan } from "../_shared/proPlan.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: u } = await admin.auth.getUser(token);
    if (!u.user) return json({ error: "Niet ingelogd" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Alleen beheerders" }, 403);

    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
    const terms = typeof body.terms === "string" ? body.terms.slice(0, 20000) : "";
    const amount = Number(body.amount_cents);
    const interval = body.interval === "year" ? "year" : "month";
    if (!name || !Number.isInteger(amount) || amount < 100 || amount > 100000) {
      return json({ error: "Ongeldige naam of prijs (tussen €1 en €1000)" }, 400);
    }

    const plan = await getProPlan(admin);
    if (!plan) return json({ error: "Instellingen ontbreken" }, 500);
    const next = { ...plan, name, terms };

    if (amount !== plan.amount_cents || interval !== plan.interval) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", { apiVersion: "2023-10-16" });
      const price = await stripe.prices.create({
        product: plan.product_id,
        unit_amount: amount,
        currency: plan.currency,
        recurring: { interval },
        metadata: { tier: "pro" },
      });
      next.price_id = price.id;
      next.amount_cents = amount;
      next.interval = interval;
      next.known_price_ids = Array.from(new Set([...(plan.known_price_ids ?? []), price.id]));
      console.log("New pro price created", price.id);
    }

    const { error } = await admin.from("app_settings")
      .update({ value: next, updated_at: new Date().toISOString(), updated_by: u.user.id })
      .eq("key", "pro_plan");
    if (error) throw error;
    return json({ plan: next });
  } catch (e) {
    console.error("admin-update-pro-plan error", e instanceof Error ? e.message : e);
    return json({ error: "Opslaan mislukt" }, 500);
  }
});
