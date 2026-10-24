# Project rules

- Edge functions share security helpers in `supabase/functions/_shared/security.ts` (paid-feature entitlement, redirect allowlist, email masking, internal-caller auth); why: one server-side source of truth so client gates can't be bypassed.
- Scheduled/internal edge functions authenticate via the `x-cron-secret` header checked by `public.verify_cron_secret` against the vault secret `cron_secret`; why: the secret never leaves the database and anon keys can't trigger jobs.
- Never log email addresses or other personal data in edge functions; log ids instead.
- The Pro plan (name, price, interval, terms, current Stripe price id) lives in `app_settings` key `pro_plan`, edited only via the `admin-update-pro-plan` function; checkout allowlist and tier mapping read it through `_shared/proPlan.ts`. Why: price changes without code changes while old Pro prices keep mapping to Pro.
- The persisted React Query cache is wiped whenever the signed-in user changes (App.tsx). Why: prevents one account's cached data showing to another on the same device.
