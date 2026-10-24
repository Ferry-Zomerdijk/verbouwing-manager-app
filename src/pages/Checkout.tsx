import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, STRIPE_TIERS } from "@/hooks/useSubscription";
import { cn } from "@/lib/utils";

type PaidTier = "basis" | "pro";

const PLANS: Record<PaidTier, { name: string; price: string; tagline: string; features: string[]; extras: string[] }> = {
  basis: {
    name: "Basis",
    price: "€4,99",
    tagline: "Voor actieve verbouwers",
    features: ["3 projecten", "Onbeperkt taken", "100 foto's en 20 documenten", "Importeren en exporteren", "Aannemers beheren"],
    extras: [],
  },
  pro: {
    name: "Pro",
    price: "€9,99",
    tagline: "Alles, voor wie samen bouwt",
    features: ["Onbeperkt projecten, foto's en documenten", "Importeren en exporteren", "Aannemers beheren"],
    extras: ["Onbeperkt AI factuurscans", "Openbare projectlinks", "Teamleden uitnodigen", "Voorrang bij ondersteuning"],
  },
};

const TIER_RANK = { free: 0, basis: 1, pro: 2 } as const;

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initial = searchParams.get("plan") === "basis" ? "basis" : "pro";
  const [plan, setPlan] = useState<PaidTier>(initial);
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const { currentTier, createCheckout, isCreatingCheckout, openPortal, isOpeningPortal } = useSubscription();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (searchParams.get("canceled") === "true") toast.info("Afrekenen geannuleerd, er is niets betaald");
  }, [searchParams]);

  const choose = (tier: PaidTier) => {
    setPlan(tier);
    setSearchParams({ plan: tier }, { replace: true });
  };

  const isCurrent = currentTier === plan;
  const isDowngrade = TIER_RANK[currentTier] > TIER_RANK[plan];
  const selected = PLANS[plan];

  const handlePay = () => {
    if (!userId) {
      navigate(`/auth?returnUrl=${encodeURIComponent(`/checkout?plan=${plan}`)}`);
      return;
    }
    if (currentTier !== "free") {
      openPortal();
      return;
    }
    createCheckout(STRIPE_TIERS[plan].price_id);
  };

  const buttonLabel = !userId
    ? "Inloggen en afrekenen"
    : isCurrent
      ? "Abonnement beheren"
      : currentTier !== "free"
        ? isDowngrade ? "Wijzigen via abonnementsbeheer" : "Upgraden via abonnementsbeheer"
        : `Afrekenen — ${selected.price} per maand`;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Afrekenen — De Renovatie App" description="Kies Basis of Pro en reken veilig af via Stripe." path="/checkout" />
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Terug" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Afrekenen</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:py-12 grid gap-6 lg:grid-cols-[1fr_380px] max-w-5xl">
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Kies je abonnement</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(PLANS) as PaidTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => choose(tier)}
                aria-pressed={plan === tier}
                className={cn(
                  "text-left rounded-lg border bg-card p-5 transition-colors",
                  plan === tier ? "border-primary ring-2 ring-primary/30" : "hover:border-primary/50",
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{PLANS[tier].name}</span>
                  {currentTier === tier ? <Badge variant="secondary">Huidig plan</Badge> : tier === "pro" && <Badge>Aanbevolen</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mb-3">{PLANS[tier].tagline}</p>
                <p className="text-2xl font-bold">
                  {PLANS[tier].price}
                  <span className="text-sm font-normal text-muted-foreground"> /maand</span>
                </p>
              </button>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inbegrepen in {selected.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {selected.extras.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" /> {f}
                </div>
              ))}
              {selected.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0" /> {f}
                </div>
              ))}
              {plan === "basis" && (
                <p className="text-xs text-muted-foreground pt-2">
                  AI factuurscans, openbare links en teamleden zitten alleen in Pro.
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Overzicht</CardTitle>
              <CardDescription>Maandelijks opzegbaar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>{selected.name} abonnement</span>
                <span>{selected.price}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-3">
                <span>Per maand</span>
                <span>{selected.price}</span>
              </div>
              {isCurrent && <p className="text-sm text-muted-foreground">Je hebt dit plan al.</p>}
              <Button className="w-full" size="lg" onClick={handlePay} disabled={userId === undefined || isCreatingCheckout || isOpeningPortal}>
                {isCreatingCheckout || isOpeningPortal ? "Even geduld..." : buttonLabel}
              </Button>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Je betaalt veilig via Stripe. Wij zien je betaalgegevens nooit.</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Opzeggen kan altijd via abonnementsbeheer.</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
