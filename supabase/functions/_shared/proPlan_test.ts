import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { BASIS_PRICE_ID, isCheckoutPrice, tierForPrice, type ProPlan } from "./proPlan.ts";

const plan: ProPlan = {
  name: "Pro", amount_cents: 1299, currency: "eur", interval: "month",
  price_id: "price_new", product_id: "prod_x", known_price_ids: ["price_old", "price_new"], terms: "",
};

Deno.test("checkout allows basis and current pro price only", () => {
  assertEquals(isCheckoutPrice(BASIS_PRICE_ID, plan), true);
  assertEquals(isCheckoutPrice("price_new", plan), true);
  assertEquals(isCheckoutPrice("price_old", plan), false);
  assertEquals(isCheckoutPrice("price_evil", plan), false);
});

Deno.test("old pro prices still map to pro tier", () => {
  assertEquals(tierForPrice("price_old", plan), "pro");
  assertEquals(tierForPrice(BASIS_PRICE_ID, plan), "basis");
});
