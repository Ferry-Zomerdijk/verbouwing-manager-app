# Securityonderhoud: scanbevindingen en kwetsbare pakketten

Doel: alle openstaande bevindingen met de kleinste passende wijziging oplossen, zonder functies, rollen of tenantisolatie te veranderen. Geen findings negeren, niets publiceren, geen echte e-mails of betalingen.

## Volgorde

### 1. Bewijs lezen
Per bevinding de genoemde regels in de code en de bijbehorende database- en opslagregels bekijken voordat er iets verandert. Het volledige scanrapport wordt per regel doorgelopen, inclusief de bevindingen die in het overzicht zijn afgekapt.

### 2. Critical (eerst)
- **Factuurscan (process-invoice), 2 bevindingen**: voor het downloaden controleren dat het bestandspad bij een project hoort waartoe de gebruiker toegang heeft (projectmap in het pad + `has_project_access`), anders 403. De gebruikersclient vervangen door een anon-client met de token van de gebruiker voor de identiteitscheck.
- **Openbare projectlinks (generate-public-share)**: op de server controleren of de eigenaar een actief Pro-abonnement heeft (functie `public_links`). Platformbeheerders blijven vrijgesteld, zoals nu ook in de app.
- **Teamleden uitnodigen (create-project-invitation)**: dezelfde servercontrole op Pro (`team_sharing`), met vrijstelling voor beheerders.
- **Contactformulier (send-contact-email)**: geen bevestigingsmail meer naar een adres dat de bezoeker zelf opgeeft. Het bericht wordt nog steeds opgeslagen en naar support gestuurd; de bezoeker ziet de bevestiging op het scherm.
- Overige Critical-bevindingen uit het volledige rapport krijgen dezelfde aanpak: kleinste fix in de betreffende functie of regel.

### 3. Waarschuwingen
- **E-mailadressen in serverlogs** (stripe-webhook, create-user, generate-project-access-token en andere gemelde plekken): adressen uit logregels halen of maskeren.
- **Terugkeerlinks Stripe** (stripe-portal, stripe-checkout): `returnUrl`, `successUrl` en `cancelUrl` alleen accepteren als ze op het eigen domein van de app liggen; anders de standaardlink gebruiken.
- **Geplande taken van buitenaf te starten** (check-expiring-subscriptions, check-maintenance-due): een gedeeld geheim of service-role-token vereisen. De bestaande planning wordt gecontroleerd en zo aangepast dat die het geheim meestuurt, zodat herinneringen blijven werken. Als het nieuwe geheim nodig is, vraag ik het via het beveiligde invoerscherm (niet in de chat).
- **Uploadregels** (task-images, task-update-images, project-photos): uploads beperken tot mappen van projecten waartoe de gebruiker toegang heeft. Ik controleer eerst hoe de app bestandspaden opbouwt, zodat uploaden blijft werken.
- **Info-meldingen** (openbaar leesbare taaktypes, mappen van openbare buckets oplijsten): bewust openbaar en nodig voor de weergave; deze blijven open en ik leg uit waarom. Niets wordt genegeerd.

### 4. Kwetsbare pakketten (alleen veilige minor/patch-updates)
- `react-router-dom` 7.13 naar de nieuwste 7.x.
- `@supabase/supabase-js` naar de nieuwste 2.x (lost `ws` op).
- `@capacitor/*` naar de nieuwste 8.x (lost onder andere de Critical proxy-fout op).
- `vite-plugin-pwa`, `recharts`: binnen dezelfde major updaten; resterende transitive pakketten (lodash, brace-expansion, tar, xmldom, fast-uri enz.) waar mogelijk via `overrides` naar gepatchte versies binnen hun eigen major.
- `xlsx` 0.18.5: de npm-versie wordt niet meer onderhouden; de fixes staan alleen op SheetJS' eigen CDN (0.20.x). Dat zou een bronwijziging betekenen, dus die voer ik niet uit zonder jouw akkoord. Dit blijft open met uitleg.

### 5. Controle
- Build moet slagen.
- Gerichte Deno-tests voor de aangepaste functies: geweigerd zonder login, geweigerd voor een vreemd factuurpad, geweigerd zonder Pro, terugkeerlink van een vreemd domein valt terug op de standaard, geplande taak geweigerd zonder geheim. Er gaan geen echte e-mails of betalingen uit.
- Daarna de securityscan en dependency-scan opnieuw draaien en alleen bevindingen als opgelost markeren als de nieuwe scan dat bevestigt.

## Oplevering
Overzicht van: wat gewijzigd en met een nieuwe scan bevestigd is, wat open of onbevestigd blijft (bijvoorbeeld xlsx en de info-meldingen), welke tests niet konden draaien, en of een scan mislukt of onvolledig was.

## Technische details
- Entitlementcheck: `subscriptions` met status `active`/`trialing` en tier `pro`, of `has_role(uid,'admin')`; via de service-role-client, gefilterd op `project.user_id`.
- Factuurpad: eerste padsegment vergelijken met de padopbouw die de upload in `CreateCostDialog` gebruikt, en dan `has_project_access` aanroepen.
- Origin-allowlist: published-, preview- en eigen domeinen plus `SITE_URL`.
- Opslagregels: `INSERT`-policies vervangen door versies met `has_project_access(auth.uid(), (storage.foldername(name))[1]::uuid)`, mits de padopbouw dat ondersteunt; anders koppelen aan `owner`.
