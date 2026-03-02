

# Plan: Wachtwoord reset via Resend koppelen aan de UI

## Samenvatting

De edge function `send-password-reset` bestaat al en werkt. Het probleem is dat de "Wachtwoord vergeten?" knop op het inlogscherm nog steeds `supabase.auth.resetPasswordForEmail()` aanroept, wat via de onbetrouwbare standaard Supabase SMTP gaat. De fix is eenvoudig: deze aanroep vervangen door een call naar de bestaande edge function.

## Wijziging

### `src/pages/Auth.tsx`

De `handleForgotPassword` functie (regel 230-246) wordt aangepast:

**Huidige code:**
```text
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`,
});
```

**Nieuwe code:**
```text
const { data, error } = await supabase.functions.invoke('send-password-reset', {
  body: { email }
});
if (data?.error) throw new Error(data.error);
```

Dit stuurt het verzoek naar de edge function die:
1. Via de Supabase Admin API een recovery link genereert
2. Deze via Resend als nette HTML-email verstuurt

## Belangrijke opmerking

De Resend afzender is momenteel `onboarding@resend.dev` (test-domein). Dit domein kan alleen emails sturen naar het emailadres van de Resend account-eigenaar. Voor betrouwbare levering aan alle gebruikers is een eigen domein nodig in Resend. Dit is een bestaande beperking van de huidige setup.
