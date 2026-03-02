
# Plan: Handmatige wachtwoord reset email via Resend

## Wat gaan we doen

Een edge function maken die:
1. Via de Supabase Admin API een wachtwoord reset link genereert voor `ron@fonkelmedia.nl`
2. Deze link via Resend als email verstuurt

## Aanpak

### Nieuwe Edge Function: `send-password-reset`

Een eenvoudige edge function die:
- De Supabase Admin API (`generateLink`) gebruikt om een recovery link te genereren
- De link via Resend stuurt met een nette HTML email
- Beveiligd is zodat alleen admins deze kunnen aanroepen

### Werking

```text
1. Admin roept edge function aan met { email: "ron@fonkelmedia.nl" }
2. Function genereert recovery link via supabase.auth.admin.generateLink()
3. Link wordt verstuurd via Resend API
4. Gebruiker ontvangt email met link naar /reset-password pagina
```

### Belangrijke details

- **Afzender**: `onboarding@resend.dev` (Resend test domain, zelfde als contact emails). NB: Resend's test domain kan alleen naar het emailadres van de Resend account-eigenaar sturen. Als `ron@fonkelmedia.nl` niet het Resend account-email is, moet er een eigen domein worden geconfigureerd.
- **Redirect URL**: `https://verbouwing-manager-app.lovable.app/reset-password`
- **Beveiliging**: Alleen authenticated admins of service role key
- **Bestaande secrets**: `RESEND_API_KEY` en `SUPABASE_SERVICE_ROLE_KEY` zijn al geconfigureerd

### Te maken bestanden

| Bestand | Actie |
|---------|-------|
| `supabase/functions/send-password-reset/index.ts` | Nieuwe edge function |
| `supabase/config.toml` | `verify_jwt = false` toevoegen (met in-code auth check) |

### Na deployment

De function direct aanroepen via de curl tool om de reset email naar `ron@fonkelmedia.nl` te sturen.
