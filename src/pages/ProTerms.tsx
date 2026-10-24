import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { useProPlan, formatEuro, intervalLabel } from "@/hooks/useProPlan";

export default function ProTerms() {
  const navigate = useNavigate();
  const { data: plan } = useProPlan();
  return (
    <div className="min-h-screen bg-background">
      <Seo title="Pro-voorwaarden — De Renovatie App" description="Voorwaarden van het Pro-abonnement." path="/pro-voorwaarden" />
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Terug" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-semibold">Pro-voorwaarden</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        {plan && (
          <p className="text-muted-foreground">
            {plan.name}: {formatEuro(plan.amount_cents)} per {intervalLabel(plan.interval)}, automatisch verlengd.
          </p>
        )}
        <article className="space-y-2 whitespace-pre-wrap leading-relaxed">
          {(plan?.terms ?? "").split("\n").map((line, i) =>
            line.startsWith("## ") ? <h2 key={i} className="text-lg font-semibold pt-2">{line.slice(3)}</h2> : <p key={i}>{line}</p>
          )}
        </article>
      </main>
    </div>
  );
}
