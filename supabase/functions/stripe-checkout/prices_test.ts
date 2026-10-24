import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { isAllowedPrice } from "./prices.ts";

Deno.test("accepts the Pro price", () => assertEquals(isAllowedPrice("price_1SktK8GzO5wk8qyVsW9NlTMb"), true));
Deno.test("accepts the Basis price", () => assertEquals(isAllowedPrice("price_1SktI7GzO5wk8qyVK5wr1ENc"), true));
Deno.test("rejects an unknown price", () => assertEquals(isAllowedPrice("price_attacker"), false));
Deno.test("rejects a missing price", () => assertEquals(isAllowedPrice(undefined), false));
