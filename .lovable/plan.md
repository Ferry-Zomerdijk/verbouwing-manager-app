
# Plan: Automatisch uitnodigingsemail versturen via Resend

## Probleem

De `create-project-invitation` edge function genereert alleen een uitnodigingslink en toont deze in de UI. Er wordt geen email verstuurd naar de uitgenodigde gebruiker. De gebruiker moet de link handmatig kopieren en doorsturen.

## Oplossing

De edge function uitbreiden zodat na het aanmaken van de uitnodiging automatisch een email wordt verstuurd via de bestaande Resend API key.

## Wijzigingen

### 1. `supabase/functions/create-project-invitation/index.ts`

Na het aanmaken van de uitnodiging (regel 116), email versturen via Resend:

- Projectnaam ophalen uit de database
- Naam van de uitnodiger ophalen
- Email versturen via Resend API met:
  - Afzender: `De Renovatie App <onboarding@resend.dev>`
  - Ontvanger: het opgegeven emailadres
  - Onderwerp: "Je bent uitgenodigd voor project [projectnaam]"
  - Inhoud: nette HTML email met uitnodigingslink en uitleg
- Het resultaat van de email-verzending meegeven in de response
- Bij falen van email: uitnodiging is wel aangemaakt, dus een waarschuwing teruggeven (niet de hele actie laten falen)

### 2. `src/components/project/InviteProjectUserDialog.tsx`

De UI aanpassen zodat:
- Na succesvolle generatie een melding wordt getoond dat de email is verstuurd
- De "Deel deze link" sectie aanpassen met een bevestiging dat de email onderweg is
- De kopieerknop behouden als backup optie

## Belangrijke opmerking

De Resend afzender is `onboarding@resend.dev` (test-domein). Dit domein kan alleen emails sturen naar het emailadres van de Resend account-eigenaar. Voor betrouwbare levering aan externe adressen zoals `ron@fonkelmedia.nl` is een eigen domein nodig in Resend. Dit is dezelfde beperking als bij de wachtwoord reset emails.

## Technische details

- `RESEND_API_KEY` is al geconfigureerd als secret
- De email bevat de uitnodigingslink, projectnaam, en naam van de uitnodiger
- Falen van emailverzending breekt de uitnodiging niet af (graceful degradation)
