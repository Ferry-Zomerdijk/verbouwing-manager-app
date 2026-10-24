import { useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PricingCard } from "@/components/subscription/PricingCard";
import { useSubscription, STRIPE_TIERS } from "@/hooks/useSubscription";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";

// Predefined pricing plans (will be synced with Stripe products)
const PRICING_PLANS = [
  {
    tier: "free",
    name: "Gratis",
    description: "Perfect om te beginnen",
    price: 0,
    features: [
      "1 project",
      "5 taken per project",
      "10 foto's",
      "3 documenten",
      "Basis taakbeheer",
      "Geen AI factuurscanning",
    ],
  },
  {
    tier: "basis",
    name: "Basis",
    description: "Voor actieve verbouwers",
    price: 499, // €4.99 in cents
    features: [
      "3 projecten",
      "Onbeperkte taken",
      "100 foto's",
      "20 documenten",
      "Importeren & exporteren",
      "Aannemers beheren",
      "Geen AI factuurscanning",
      "Email ondersteuning",
    ],
  },
  {
    tier: "pro",
    name: "Pro",
    description: "Voor professionals",
    price: 999, // €9.99 in cents
    features: [
      "Onbeperkte projecten",
      "Onbeperkte taken",
      "Onbeperkte foto's",
      "Onbeperkte documenten",
      "Teamleden uitnodigen",
      "Publieke links delen",
      "Onbeperkte AI factuurscans",
      "Prioriteit ondersteuning",
      "Alle toekomstige features",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentTier, prices, createCheckout, isCreatingCheckout, isLoading } = useSubscription();

  useEffect(() => {
    // Check for success/canceled params
    if (searchParams.get("subscription") === "success") {
      toast.success("Je abonnement is succesvol geactiveerd!");
    } else if (searchParams.get("subscription") === "canceled") {
      toast.info("Checkout geannuleerd");
    }
  }, [searchParams]);

  // Get price ID for tier directly from constants
  const getPriceIdForTier = (tier: string): string | null => {
    if (tier === "basis") return STRIPE_TIERS.basis.price_id;
    if (tier === "pro") return STRIPE_TIERS.pro.price_id;
    return null;
  };

  const handleSelectPlan = async (tier: string) => {
    if (tier === "free") {
      navigate("/dashboard");
      return;
    }

    navigate(`/checkout?plan=${tier}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Prijzen — De Renovatie App"
        description="Vergelijk de Gratis, Basis (€4,99/maand) en Pro (€9,99/maand) abonnementen van De Renovatie App. Maandelijks opzegbaar."
        path="/pricing"
      />
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Terug" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Abonnementen</h1>
            <p className="text-sm text-muted-foreground">Kies het plan dat bij jou past</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Eenvoudige, transparante prijzen
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start gratis en upgrade wanneer je meer nodig hebt. 
            Alle abonnementen zijn maandelijks opzegbaar.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.tier}
              name={plan.name}
              description={plan.description}
              price={plan.price}
              currency="eur"
              interval="month"
              features={plan.features}
              isPopular={plan.tier === "basis"}
              isCurrent={currentTier === plan.tier}
              onSelect={() => handleSelectPlan(plan.tier)}
              isLoading={isCreatingCheckout}
              disabled={isLoading}
            />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Veelgestelde vragen</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Kan ik op elk moment opzeggen?</h4>
              <p className="text-muted-foreground">
                Ja, je kunt je abonnement op elk moment opzeggen. Je behoudt toegang tot je 
                huidige plan tot het einde van de factureringsperiode.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Wat gebeurt er met mijn data als ik downgrade?</h4>
              <p className="text-muted-foreground">
                Je data blijft behouden, maar je kunt geen nieuwe items toevoegen boven de 
                limieten van je nieuwe plan. Bestaande data wordt niet verwijderd.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Is er een proefperiode?</h4>
              <p className="text-muted-foreground">
                Het gratis plan is permanent beschikbaar. Voor betaalde plannen kun je altijd 
                eerst het gratis plan proberen om te kijken of De Renovatie App bij je past.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Welke betaalmethodes accepteren jullie?</h4>
              <p className="text-muted-foreground">
                We accepteren alle gangbare creditcards, iDEAL, Bancontact en SEPA-incasso 
                via onze betalingspartner Stripe.
              </p>
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">Veilig betalen met</p>
          <div className="flex items-center justify-center gap-6 opacity-60">
            <span className="text-sm font-medium">Stripe</span>
            <span className="text-sm font-medium">iDEAL</span>
            <span className="text-sm font-medium">Visa</span>
            <span className="text-sm font-medium">Mastercard</span>
          </div>
        </div>

        {/* Legal links */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Door een abonnement af te sluiten ga je akkoord met onze{" "}
            <Link to="/terms" className="underline hover:text-foreground transition-colors">
              Algemene Voorwaarden
            </Link>{" "}
            en{" "}
            <Link to="/privacy" className="underline hover:text-foreground transition-colors">
              Privacybeleid
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
