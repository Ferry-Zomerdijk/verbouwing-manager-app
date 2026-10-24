// Only the app's own subscription prices may be checked out (keep in sync with STRIPE_TIERS in the app).
export const ALLOWED_PRICE_IDS = [
  "price_1SktI7GzO5wk8qyVK5wr1ENc", // basis
  "price_1SktK8GzO5wk8qyVsW9NlTMb", // pro
];

export function isAllowedPrice(priceId: unknown): boolean {
  return typeof priceId === "string" && ALLOWED_PRICE_IDS.includes(priceId);
}
