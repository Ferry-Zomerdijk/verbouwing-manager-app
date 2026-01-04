import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Loader2, Settings } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

export function SubscriptionStatus() {
  const { subscription, currentTier, isActive, openPortal, isOpeningPortal, limits } = useSubscription();

  const tierNames: Record<string, string> = {
    free: "Gratis",
    basis: "Basis",
    pro: "Pro",
  };

  const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active: { label: "Actief", variant: "default" },
    trialing: { label: "Proefperiode", variant: "secondary" },
    canceled: { label: "Geannuleerd", variant: "destructive" },
    past_due: { label: "Achterstallig", variant: "destructive" },
    unpaid: { label: "Onbetaald", variant: "destructive" },
    paused: { label: "Gepauzeerd", variant: "outline" },
  };

  const status = subscription?.status ? statusLabels[subscription.status] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abonnement
            </CardTitle>
            <CardDescription>Beheer je abonnement en facturatie</CardDescription>
          </div>
          {status && (
            <Badge variant={status.variant}>{status.label}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-muted-foreground">Huidige plan</span>
          <span className="font-semibold">{tierNames[currentTier]}</span>
        </div>

        {subscription?.current_period_end && isActive && (
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Volgende factuurdatum
            </span>
            <span>
              {format(new Date(subscription.current_period_end), "d MMMM yyyy", { locale: nl })}
            </span>
          </div>
        )}

        {subscription?.cancel_at && (
          <div className="flex items-center justify-between py-2 border-b text-destructive">
            <span>Eindigt op</span>
            <span>
              {format(new Date(subscription.cancel_at), "d MMMM yyyy", { locale: nl })}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Limieten:</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Projecten</span>
              <span className="font-medium">{limits.maxProjects === -1 ? "∞" : limits.maxProjects}</span>
            </div>
            <div className="flex justify-between">
              <span>Taken</span>
              <span className="font-medium">{limits.maxTasks === -1 ? "∞" : limits.maxTasks}</span>
            </div>
            <div className="flex justify-between">
              <span>Foto's</span>
              <span className="font-medium">{limits.maxPhotos === -1 ? "∞" : limits.maxPhotos}</span>
            </div>
            <div className="flex justify-between">
              <span>Documenten</span>
              <span className="font-medium">{limits.maxDocuments === -1 ? "∞" : limits.maxDocuments}</span>
            </div>
            <div className="flex justify-between">
              <span>AI scans/maand</span>
              <span className="font-medium">
                {limits.maxAiScansPerMonth === -1 
                  ? "∞" 
                  : limits.maxAiScansPerMonth === 0 
                    ? "—" 
                    : limits.maxAiScansPerMonth}
              </span>
            </div>
          </div>
        </div>

        {subscription && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => openPortal()}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Laden...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Beheer abonnement
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
