// deno-lint-ignore-file no-explicit-any
export const BASIS_PRICE_ID = "price_1SktI7GzO5wk8qyVK5wr1ENc";

export interface ProPlan {
  name: string;
  amount_cents: number;
  currency: string;
  interval: string;
  price_id: string;
  product_id: string;
  known_price_ids: string[];
  terms: string;
}

export async function getProPlan(admin: any): Promise<ProPlan | null> {
  const { data } = await admin.from("app_settings").select("value").eq("key", "pro_plan").maybeSingle();
  return (data?.value as ProPlan) ?? null;
}

/** Checkout may only use the basis price or the *current* Pro price. */
export function isCheckoutPrice(priceId: unknown, plan: ProPlan | null): boolean {
  if (typeof priceId !== "string") return false;
  return priceId === BASIS_PRICE_ID || (!!plan && priceId === plan.price_id);
}

/** Map any price (current or historical Pro, or basis) to a tier. */
export function tierForPrice(priceId: string, plan: ProPlan | null): "basis" | "pro" {
  if (plan && (plan.price_id === priceId || plan.known_price_ids?.includes(priceId))) return "pro";
  return "basis";
}
