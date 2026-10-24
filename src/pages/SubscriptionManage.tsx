import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useProPlan, formatEuro, intervalLabel } from "@/hooks/useProPlan";

interface Overview {
  subscription: null | {
    status: string; cancel_at_period_end: boolean; current_period_start: string; current_period_end: string;
    amount_cents: number | null; currency: string; interval: string;
  };
  invoices: { id: string; number: string | null; date: string; amount_cents: number; status: string | null; pdf: string | null; url: string | null }[];
}

const d = (iso: string) => format(new Date(iso), "d MMM yyyy", { locale: nl });

function AdminPlanEditor() {
  const { data: plan } = useProPlan();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [terms, setTerms] = useState("");
  useEffect(() => {
    if (plan) { setName(plan.name); setPrice((plan.amount_cents / 100).toFixed(2).replace(".", ",")); setInterval(plan.interval); setTerms(plan.terms); }
  }, [plan]);
  const save = useMutation({
    mutationFn: async () => {
      const amount_cents = Math.round(parseFloat(price.replace(",", ".")) * 100);
      const { data, error } = await supabase.functions.invoke("admin-update-pro-plan", { body: { name, amount_cents, interval, terms } });
      if (error || data?.error) throw new Error(data?.error ?? "Opslaan mislukt");
    },
    onSuccess: () => { toast.success("Pro-instellingen opgeslagen"); qc.invalidateQueries({ queryKey: ["app_settings"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pro-instellingen (beheerder)</CardTitle>
        <CardDescription>Nieuwe prijzen gelden voor nieuwe abonnementen. Bestaande abonnees houden hun prijs.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1"><Label htmlFor="pn">Naam</Label><Input id="pn" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="pp">Prijs (€)</Label><Input id="pp" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          <div className="space-y-1">
            <Label htmlFor="pi">Periode</Label>
            <select id="pi" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={interval} onChange={(e) => setInterval(e.target.value as "month" | "year")}>
              <option value="month">Per maand</option>
              <option value="year">Per jaar</option>
            </select>
          </div>
        </div>
        <div className="space-y-1"><Label htmlFor="pt">Voorwaarden</Label><Textarea id="pt" rows={10} value={terms} onChange={(e) => setTerms(e.target.value)} /></div>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Opslaan..." : "Opslaan"}</Button>
      </CardContent>
    </Card>
  );
}

export default function SubscriptionManage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentTier } = useSubscription();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return navigate("/auth?returnUrl=/abonnement");
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!r);
    });
  }, [navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["subscription-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("manage-subscription", { body: { action: "status" } });
      if (error) throw error;
      return data as Overview;
    },
  });

  const act = useMutation({
    mutationFn: async (action: "cancel" | "resume") => {
      const { data, error } = await supabase.functions.invoke("manage-subscription", { body: { action } });
      if (error) throw error;
      return data as Overview;
    },
    onSuccess: (res, action) => {
      qc.setQueryData(["subscription-overview"], res);
      qc.invalidateQueries({ queryKey: ["subscription"] });
      toast.success(action === "cancel" ? "Opgezegd per einde van de periode" : "Opzegging ingetrokken");
    },
    onError: () => toast.error("Dat lukte niet, probeer het later opnieuw"),
  });

  const sub = data?.subscription;

  return (
    <div className="min-h-screen bg-background">
      <Seo title="Abonnement — De Renovatie App" description="Beheer je abonnement en facturen." path="/abonnement" />
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Terug" onClick={() => navigate("/dashboard")}><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-xl font-semibold">Abonnement</h1>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Huidig plan <Badge variant="secondary" className="capitalize">{currentTier === "free" ? "Gratis" : currentTier}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? <p className="text-muted-foreground">Laden...</p> : sub ? (
              <>
                <div className="flex justify-between"><span>Prijs</span><span>{sub.amount_cents != null ? formatEuro(sub.amount_cents) : "-"} per {intervalLabel(sub.interval)}</span></div>
                <div className="flex justify-between"><span>Huidige periode</span><span>{d(sub.current_period_start)} – {d(sub.current_period_end)}</span></div>
                <div className="flex justify-between">
                  <span>{sub.cancel_at_period_end ? "Eindigt op" : "Volgende factuur"}</span><span>{d(sub.current_period_end)}</span>
                </div>
                {sub.cancel_at_period_end && <p className="text-muted-foreground">Je houdt al je functies tot de einddatum.</p>}
                <div className="flex flex-wrap gap-2 pt-2">
                  {sub.cancel_at_period_end ? (
                    <Button onClick={() => act.mutate("resume")} disabled={act.isPending}>Opzegging intrekken</Button>
                  ) : (
                    <Button variant="outline" onClick={() => { if (confirm("Weet je zeker dat je wilt opzeggen?")) act.mutate("cancel"); }} disabled={act.isPending}>Abonnement opzeggen</Button>
                  )}
                  {currentTier !== "pro" && <Button onClick={() => navigate("/checkout?plan=pro")}>Naar Pro</Button>}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-muted-foreground">Je hebt nog geen betaald abonnement.</p>
                <Button onClick={() => navigate("/checkout?plan=pro")}>Pro bekijken</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Facturen</CardTitle><CardDescription>Elke periode komt hier automatisch een factuur bij.</CardDescription></CardHeader>
          <CardContent>
            {!data?.invoices?.length ? <p className="text-sm text-muted-foreground">Nog geen facturen.</p> : (
              <ul className="divide-y">
                {data.invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between py-3 text-sm gap-2">
                    <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" />{d(i.date)} {i.number && <span className="text-muted-foreground">· {i.number}</span>}</span>
                    <span className="flex items-center gap-3">
                      {formatEuro(i.amount_cents)}
                      <Badge variant={i.status === "paid" ? "secondary" : "outline"}>{i.status === "paid" ? "Betaald" : "Open"}</Badge>
                      {i.pdf && <a href={i.pdf} target="_blank" rel="noreferrer" aria-label="Factuur downloaden"><Download className="h-4 w-4" /></a>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">Lees de <a className="underline" href="/pro-voorwaarden">Pro-voorwaarden</a>.</p>
        {isAdmin && <AdminPlanEditor />}
      </main>
    </div>
  );
}
