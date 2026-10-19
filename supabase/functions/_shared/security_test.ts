import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { safeRedirect, maskEmail, isInternalCaller } from "./security.ts";
const fb = "https://verbouwing-manager-app.lovable.app/dashboard";
Deno.test("foreign return URL falls back", () => assertEquals(safeRedirect("https://evil.example/x", fb), fb));
Deno.test("javascript URL falls back", () => assertEquals(safeRedirect("javascript:alert(1)", fb), fb));
Deno.test("own domain kept", () => assertEquals(safeRedirect("https://verbouwing-manager-app.lovable.app/pricing", fb), "https://verbouwing-manager-app.lovable.app/pricing"));
Deno.test("lookalike host rejected", () => assertEquals(safeRedirect("https://verbouwing-manager-app.lovable.app.evil.com/", fb), fb));
Deno.test("email masked", () => assertEquals(maskEmail("jan@example.com"), "j***@example.com"));
const fakeAdmin = { rpc: async (_n: string, a: { _secret: string }) => ({ data: a._secret === "good", error: null }) };
Deno.test("internal job rejected without secret", async () =>
  assertEquals(await isInternalCaller(new Request("http://x"), fakeAdmin), false));
Deno.test("internal job rejected with anon bearer", async () =>
  assertEquals(await isInternalCaller(new Request("http://x", { headers: { Authorization: "Bearer anon" } }), fakeAdmin), false));
Deno.test("internal job accepted with cron secret", async () =>
  assertEquals(await isInternalCaller(new Request("http://x", { headers: { "x-cron-secret": "good" } }), fakeAdmin), true));
