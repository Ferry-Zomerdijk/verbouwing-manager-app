import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useSubscription } from "@/hooks/useSubscription";

const tierNames: Record<string, string> = { free: "Gratis", basis: "Basis", pro: "Pro" };

export default function SubscriptionWidget() {
  const navigate = useNavigate();
  const { subscription, currentTier, isActive } = useSubscription();

  const endDate = subscription?.cancel_at || subscription?.current_period_end;
  const isEnding = !!subscription?.cancel_at;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Abonnement</CardTitle>
        <div className="p-2 rounded-lg bg-primary/10">
          <Crown className="w-4 h-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{tierNames[currentTier]}</span>
          {subscription && (
            <Badge variant={isEnding ? "destructive" : isActive ? "default" : "secondary"}>
              {isEnding ? "Loopt af" : isActive ? "Actief" : subscription.status}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {endDate
            ? `${isEnding ? "Eindigt op" : "Verlengt op"} ${format(new Date(endDate), "d MMM yyyy", { locale: nl })}`
            : "Geen einddatum"}
        </p>
        <Button variant="outline" size="sm" className="w-full" onClick={() => navigate(currentTier === "free" ? "/checkout" : "/abonnement")}>
          {currentTier === "free" ? "Upgraden" : "Beheer abonnement"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
