// Shared server-side security helpers for edge functions.
// deno-lint-ignore-file no-explicit-any

const DEFAULT_ALLOWED_HOSTS = [
  "verbouwing-manager-app.lovable.app",
  "id-preview--20291b55-3894-4f6c-8e54-46ea6ab5e19f.lovable.app",
  "localhost",
];

function allowedHosts(): string[] {
  const hosts = [...DEFAULT_ALLOWED_HOSTS];
  const site = Deno.env.get("SITE_URL");
  if (site) {
    try { hosts.push(new URL(site).hostname); } catch { /* ignore */ }
  }
  return hosts;
}

/** Returns the candidate URL only if it is an http(s) URL on one of the app's own hosts. */
export function safeRedirect(candidate: unknown, fallback: string): string {
  if (typeof candidate !== "string" || candidate.length === 0) return fallback;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "https:" && !(u.protocol === "http:" && u.hostname === "localhost")) return fallback;
    return allowedHosts().includes(u.hostname) ? u.toString() : fallback;
  } catch {
    return fallback;
  }
}

/** Returns the request origin when trusted, otherwise the published app URL. */
export function trustedOrigin(req: Request): string {
  const fallback = "https://verbouwing-manager-app.lovable.app";
  return safeRedirect(req.headers.get("origin") ?? "", fallback).replace(/\/$/, "");
}

/** Mask an email address for logs: j***@example.com */
export function maskEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) return "[redacted]";
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}

/** Paid-feature entitlement: platform admin, or active/trialing Pro subscription. */
export async function hasProEntitlement(admin: any, userId: string): Promise<boolean> {
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (isAdmin) return true;
  const { data: sub } = await admin
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .in("status", ["active", "trialing"])
    .eq("tier", "pro")
    .limit(1)
    .maybeSingle();
  return !!sub;
}

/** Internal/scheduled endpoints: accept the vault-backed cron secret or the service role key. */
export async function isInternalCaller(req: Request, admin: any): Promise<boolean> {
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (serviceKey && bearer === serviceKey) return true;
  const secret = req.headers.get("x-cron-secret");
  if (!secret) return false;
  const { data, error } = await admin.rpc("verify_cron_secret", { _secret: secret });
  return !error && data === true;
}
