# Project rules

- Edge functions share security helpers in `supabase/functions/_shared/security.ts` (paid-feature entitlement, redirect allowlist, email masking, internal-caller auth); why: one server-side source of truth so client gates can't be bypassed.
- Scheduled/internal edge functions authenticate via the `x-cron-secret` header checked by `public.verify_cron_secret` against the vault secret `cron_secret`; why: the secret never leaves the database and anon keys can't trigger jobs.
- Never log email addresses or other personal data in edge functions; log ids instead.
