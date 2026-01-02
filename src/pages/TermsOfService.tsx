import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";

export default function TermsOfService() {
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
            <h1 className="text-xl font-semibold">Algemene Voorwaarden</h1>
            <p className="text-sm text-muted-foreground">Laatst bijgewerkt: januari 2026</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1 className="text-3xl font-bold mb-8">Algemene Voorwaarden De Renovatie App</h1>
          
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptatie van voorwaarden</h2>
            <p className="text-muted-foreground mb-4">
              Door De Renovatie App te gebruiken gaat u akkoord met deze algemene voorwaarden. Als u niet akkoord gaat met deze voorwaarden, gebruik onze diensten dan niet.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Beschrijving van de dienst</h2>
            <p className="text-muted-foreground mb-4">
              De Renovatie App is een applicatie voor het beheren van woningrenovatieprojecten. De dienst stelt gebruikers in staat om:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Renovatieprojecten aan te maken en te beheren</li>
              <li>Taken, kosten en deadlines bij te houden</li>
              <li>Foto's en documenten op te slaan</li>
              <li>Samen te werken met andere gebruikers (Pro-abonnement)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Accounts</h2>
            <p className="text-muted-foreground mb-4">
              Om De Renovatie App te gebruiken moet u een account aanmaken. U bent verantwoordelijk voor:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Het verstrekken van accurate en volledige informatie</li>
              <li>Het beveiligen van uw accountgegevens</li>
              <li>Alle activiteiten onder uw account</li>
              <li>Het onmiddellijk melden van ongeautoriseerd gebruik</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Abonnementen en betalingen</h2>
            <p className="text-muted-foreground mb-4">
              De Renovatie App biedt gratis en betaalde abonnementen aan:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Gratis:</strong> Beperkte functies, geen kosten</li>
              <li><strong>Basis (€4,99/maand):</strong> Uitgebreide functies</li>
              <li><strong>Pro (€9,99/maand):</strong> Alle functies inclusief teamfunctionaliteit</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Betaalde abonnementen worden maandelijks automatisch verlengd. U kunt op elk moment opzeggen via uw accountinstellingen. Bij opzegging behoudt u toegang tot het einde van de huidige factureringsperiode.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Acceptabel gebruik</h2>
            <p className="text-muted-foreground mb-4">
              Bij het gebruik van De Renovatie App gaat u akkoord met het volgende niet te doen:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Illegale of ongeoorloofde activiteiten</li>
              <li>Uploaden van schadelijke content of malware</li>
              <li>Pogingen om de dienst te verstoren of te hacken</li>
              <li>Misbruik van de dienst voor spam of commerciële doeleinden zonder toestemming</li>
              <li>Inbreuk maken op rechten van derden</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">6. Intellectueel eigendom</h2>
            <p className="text-muted-foreground mb-4">
              De Renovatie App en alle bijbehorende logo's, ontwerpen en content zijn eigendom van De Renovatie App en worden beschermd door auteursrechten en andere intellectuele eigendomsrechten.
            </p>
            <p className="text-muted-foreground">
              U behoudt alle rechten op de content die u uploadt naar De Renovatie App. Door content te uploaden verleent u ons een beperkte licentie om deze content te verwerken en weer te geven binnen de dienst.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Aansprakelijkheidsbeperking</h2>
            <p className="text-muted-foreground mb-4">
              De Renovatie App wordt aangeboden "as is" zonder garanties. Wij zijn niet aansprakelijk voor:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Indirecte, incidentele of gevolgschade</li>
              <li>Verlies van gegevens (hoewel wij redelijke maatregelen nemen om dit te voorkomen)</li>
              <li>Onderbrekingen in de dienstverlening</li>
              <li>Handelingen van derden</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Onze maximale aansprakelijkheid is beperkt tot het bedrag dat u de afgelopen 12 maanden aan ons heeft betaald.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Beëindiging</h2>
            <p className="text-muted-foreground mb-4">
              Wij behouden het recht om accounts te beëindigen of op te schorten bij:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Schending van deze voorwaarden</li>
              <li>Niet-betaling van verschuldigde bedragen</li>
              <li>Frauduleus of onwettig gedrag</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              U kunt uw account op elk moment verwijderen via de accountinstellingen.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Wijzigingen aan de dienst</h2>
            <p className="text-muted-foreground mb-4">
              Wij behouden het recht om de dienst te wijzigen, uit te breiden of te beëindigen. Bij significante wijzigingen stellen wij u op de hoogte via e-mail of in-app notificaties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Toepasselijk recht</h2>
            <p className="text-muted-foreground mb-4">
              Op deze voorwaarden is Nederlands recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechter in Nederland.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Contact</h2>
            <p className="text-muted-foreground mb-4">
              Voor vragen over deze voorwaarden kunt u contact met ons opnemen via:
            </p>
            <p className="text-muted-foreground">
              E-mail: support@derenovatieapp.nl
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
