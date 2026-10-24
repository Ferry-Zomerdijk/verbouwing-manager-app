# Nieuwe omgeving, templates en Pro-abonnement

## Al opgelost
- Datalek: de app bewaarde gegevens op het apparaat en wiste die niet bij een andere login. Nu wordt alles gewist zodra een andere gebruiker inlogt. De database zelf blokkeerde Rob al correct (geen rollen, geen projecten).

## 1. Onboarding met templates
- Nieuwe stap in de onboarding: "Begin vanaf nul" of kies een template: Badkamer verbouwen, Keuken verbouwen, Complete woningrenovatie, Aanbouw / uitbouw.
- Template maakt een eigen project aan met voorbeeldtaken en budget, alleen voor deze gebruiker.

## 2. Bewerkbare prijs en periode (admin)
- Nieuwe instelling "Pro-abonnement" voor admins: prijs (maandelijks), naam, voorwaardentekst.
- Prijswijziging maakt automatisch een nieuwe Stripe-prijs aan op de achtergrond; checkout gebruikt altijd de actuele prijs. Bestaande abonnees houden hun oude prijs.

## 3. Checkout-pagina Pro
- Toont prijs, periode (maandelijks, automatisch verlengd), wat je krijgt, dat facturen automatisch in de app verschijnen, en akkoord met voorwaarden (verplicht vinkje). Daarna betaling via Stripe.

## 4. Abonnementsbeheer in de app (/abonnement)
- Huidige plan, status, volgende factuurdatum, prijs.
- Opzeggen per einde periode, opzegging ongedaan maken.
- Factuuroverzicht met downloadlinks (PDF) — allemaal in de app, Stripe draait alleen op de achtergrond.

## 5. Voorwaardenpagina (/pro-voorwaarden)
- Leest de tekst uit de admin-instelling.

## Technisch
- Tabel `app_settings` (publiek leesbaar, alleen admin schrijft) voor prijs/tekst/huidige price-id.
- Edge functions: `admin-update-pro-price`, `manage-subscription` (cancel/resume/status), `list-invoices`; `stripe-checkout` allowlist leest price-id uit `app_settings`.
- Templates als statische data in de frontend, aangemaakt via bestaande inserts (RLS blijft eigenaar-gebonden).
- Tests: price-allowlist, admin-only prijswijziging.
