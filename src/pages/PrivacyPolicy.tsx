import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Privacybeleid</h1>
            <p className="text-sm text-muted-foreground">Laatst bijgewerkt: januari 2026</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8">Privacybeleid HomeProject</h1>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Inleiding</h2>
            <p className="text-muted-foreground mb-4">
              HomeProject ("wij", "ons" of "onze") respecteert uw privacy en is toegewijd aan het beschermen van uw persoonlijke gegevens. Dit privacybeleid legt uit hoe wij uw persoonlijke informatie verzamelen, gebruiken, opslaan en beschermen wanneer u onze applicatie gebruikt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Welke gegevens verzamelen wij?</h2>
            <p className="text-muted-foreground mb-4">Wij verzamelen de volgende categorieën persoonlijke gegevens:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Accountgegevens:</strong> E-mailadres, naam, wachtwoord (versleuteld)</li>
              <li><strong>Projectgegevens:</strong> Projectnamen, beschrijvingen, taken, foto's, documenten</li>
              <li><strong>Betalingsgegevens:</strong> Verwerkt via Stripe, wij slaan geen creditcardgegevens op</li>
              <li><strong>Gebruiksgegevens:</strong> App-interacties, apparaatinformatie, IP-adres</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Hoe gebruiken wij uw gegevens?</h2>
            <p className="text-muted-foreground mb-4">Wij gebruiken uw gegevens voor:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Het leveren en verbeteren van onze diensten</li>
              <li>Accountbeheer en authenticatie</li>
              <li>Verwerking van betalingen en abonnementen</li>
              <li>Communicatie over uw account en diensten</li>
              <li>Technische ondersteuning</li>
              <li>Naleving van wettelijke verplichtingen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Gegevensdeling</h2>
            <p className="text-muted-foreground mb-4">
              Wij delen uw persoonlijke gegevens niet met derden, behalve:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Stripe:</strong> Voor betalingsverwerking</li>
              <li><strong>Supabase:</strong> Voor database- en authenticatiediensten</li>
              <li><strong>Wanneer wettelijk vereist:</strong> Op basis van gerechtelijke bevelen of wettelijke verplichtingen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Gegevensbeveiliging</h2>
            <p className="text-muted-foreground mb-4">
              Wij implementeren passende technische en organisatorische maatregelen om uw gegevens te beschermen, waaronder:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Versleuteling van gegevens in transit (HTTPS/TLS)</li>
              <li>Versleuteling van wachtwoorden</li>
              <li>Beveiligde cloudinfrastructuur</li>
              <li>Regelmatige beveiligingsaudits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Uw rechten (AVG)</h2>
            <p className="text-muted-foreground mb-4">
              Onder de Algemene Verordening Gegevensbescherming (AVG) heeft u de volgende rechten:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Recht op inzage:</strong> U kunt opvragen welke gegevens wij van u hebben</li>
              <li><strong>Recht op rectificatie:</strong> U kunt onjuiste gegevens laten corrigeren</li>
              <li><strong>Recht op verwijdering:</strong> U kunt verzoeken uw gegevens te verwijderen</li>
              <li><strong>Recht op overdraagbaarheid:</strong> U kunt uw gegevens in een bruikbaar formaat opvragen</li>
              <li><strong>Recht op bezwaar:</strong> U kunt bezwaar maken tegen bepaalde verwerkingen</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Bewaartermijnen</h2>
            <p className="text-muted-foreground mb-4">
              Wij bewaren uw gegevens zolang uw account actief is of zolang nodig voor onze diensten. Na verwijdering van uw account worden uw gegevens binnen 30 dagen permanent verwijderd, tenzij wettelijke bewaartermijnen van toepassing zijn.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-muted-foreground mb-4">
              Wij gebruiken essentiële cookies voor authenticatie en sessiebeheer. Er worden geen tracking cookies of advertentiecookies gebruikt.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Wijzigingen in dit beleid</h2>
            <p className="text-muted-foreground mb-4">
              Wij kunnen dit privacybeleid van tijd tot tijd bijwerken. Wijzigingen worden op deze pagina gepubliceerd met een bijgewerkte datum. Bij significante wijzigingen informeren wij u via e-mail.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Contact</h2>
            <p className="text-muted-foreground mb-4">
              Voor vragen over dit privacybeleid of uw persoonlijke gegevens kunt u contact met ons opnemen via:
            </p>
            <p className="text-muted-foreground">
              E-mail: privacy@homeproject.nl
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
