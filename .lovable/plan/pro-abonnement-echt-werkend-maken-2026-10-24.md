# Pro-abonnement echt werkend maken

Doel: factuurscan, openbare links en teamleden alleen voor Pro (en platformbeheerders), op de server afgedwongen, plus een eigen checkoutpagina. De bestaande Stripe-koppeling (eigen Stripe-account, Basis en Pro) blijft; er wordt geen nieuwe betaalprovider ingeschakeld.

## Wat verandert voor gebruikers

1. **Factuurscan alleen voor Pro**
   - Basis verliest de factuurscan; de prijspagina en de vergelijking worden daarop aangepast.
   - Basis- en Gratis-gebruikers zien bij "Factuur scannen" een upgrade-melding met een knop naar de checkout.
   - Bestaande Basis-abonnees houden hun abonnement; alleen de scanfunctie valt weg.

2. **Openbare links en teamleden**
   - Deze zijn al Pro-only op de server. In de app wordt overal dezelfde upgrade-melding getoond in plaats van een foutmelding.

3. **Nieuwe checkoutpagina `/checkout`**
   - Kies Basis of Pro (via `/checkout?plan=pro`), met een overzicht: prijs per maand, wat er inbegrepen is en wat je erbij krijgt ten opzichte van je huidige plan.
   - Niet ingelogd: eerst naar inloggen, daarna terug naar de checkout.
   - Heb je al dit plan: melding met een knop "Abonnement beheren" (Stripe-portaal).
   - Knop "Afrekenen" stuurt je naar de beveiligde Stripe-betaalpagina; daarna kom je terug op de bestaande succespagina, die het abonnement direct synchroniseert. Annuleren brengt je terug op `/checkout`.
   - Alle upgradeknoppen (prijspagina, upgrade-meldingen) gaan naar deze pagina.

## Technische details

- `process-invoice`: na de bestaande auth- en padcontrole `hasProEntitlement` uit `_shared/security.ts` aanroepen; anders 403 met code `pro_required`. Limiet per maand vervalt voor Pro (onbeperkt).
- `useSubscription`: `ai_invoice_scan` uit Basis-features, `maxAiScansPerMonth` Basis naar 0. `CreateCostDialog`, `SharePublicLinkDialog`, `ProjectUsersManager` gebruiken `FeatureGate`/`UpgradePrompt`, en 403 `pro_required` toont dezelfde prompt.
- `stripe-checkout`: alleen de twee bekende price-id's uit een allowlist accepteren (anders 400); `cancelUrl` standaard `/checkout`.
- Nieuwe pagina `src/pages/Checkout.tsx`, route in `App.tsx`, teksten via `useLanguage` (nl/en), Dutch sentence case, neutrale/oranje stijl.
- Tests: Deno-test voor de price-allowlist en `pro_required` zonder Pro; app-test dat Basis geen `ai_invoice_scan` heeft en Pro wel.
- Controle: build, Playwright door `/checkout` tot aan de doorstuur naar Stripe (geen echte betaling).

## Niet gecontroleerd vooraf
- Of de Stripe-sleutel en beide price-id's in live-modus actief zijn; dit controleer ik bij de bouw met een leesactie in Stripe.
