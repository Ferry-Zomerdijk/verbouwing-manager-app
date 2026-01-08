import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, AlertCircle, CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface WebhookEvent {
  id: string;
  event_id: string;
  event_type: string;
  status: string;
  stripe_customer_id: string | null;
  user_id: string | null;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: string;
  processed_at: string | null;
}

interface WebhookStats {
  total: number;
  success: number;
  failed: number;
  avgProcessingTime: number;
  successRate: number;
}

const WebhookHealthMonitor = () => {
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ["webhook-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WebhookEvent[];
    },
    refetchInterval: 30000,
  });

  const stats: WebhookStats = events ? {
    total: events.length,
    success: events.filter(e => e.status === "success").length,
    failed: events.filter(e => e.status === "failed").length,
    avgProcessingTime: events.filter(e => e.processing_time_ms).reduce((acc, e) => acc + (e.processing_time_ms || 0), 0) / (events.filter(e => e.processing_time_ms).length || 1),
    successRate: events.length > 0 ? (events.filter(e => e.status === "success").length / events.length) * 100 : 100,
  } : { total: 0, success: 0, failed: 0, avgProcessingTime: 0, successRate: 100 };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "processing":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/30">Succes</Badge>;
      case "failed":
        return <Badge variant="destructive">Mislukt</Badge>;
      case "processing":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Bezig</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      "customer.subscription.created": "Abonnement aangemaakt",
      "customer.subscription.updated": "Abonnement bijgewerkt",
      "customer.subscription.deleted": "Abonnement opgezegd",
      "checkout.session.completed": "Checkout voltooid",
      "invoice.payment_succeeded": "Betaling geslaagd",
      "invoice.payment_failed": "Betaling mislukt",
      "product.created": "Product aangemaakt",
      "product.updated": "Product bijgewerkt",
      "price.created": "Prijs aangemaakt",
      "price.updated": "Prijs bijgewerkt",
      "signature_verification": "Signature verificatie",
    };
    return labels[type] || type;
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Fout bij laden van webhook events: {(error as Error).message}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Totaal Events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{stats.total}</span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Succes Rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${stats.successRate >= 95 ? "text-green-600" : stats.successRate >= 80 ? "text-yellow-600" : "text-destructive"}`}>
                  {stats.successRate.toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              Mislukte Events
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className={`text-2xl font-bold ${stats.failed > 0 ? "text-destructive" : ""}`}>
                {stats.failed}
              </span>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Gem. verwerkingstijd
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-2xl font-bold">{stats.avgProcessingTime.toFixed(0)}ms</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Failed Events Alert */}
      {stats.failed > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Aandacht vereist
            </CardTitle>
            <CardDescription>
              Er zijn {stats.failed} webhook event(s) mislukt. Controleer de details hieronder.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recente Webhook Events
              </CardTitle>
              <CardDescription>
                Laatste 100 Stripe webhook events
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : events?.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nog geen webhook events ontvangen
            </p>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {events?.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${
                      event.status === "failed" 
                        ? "border-destructive/30 bg-destructive/5" 
                        : "bg-muted/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {getStatusIcon(event.status)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">
                              {getEventTypeLabel(event.event_type)}
                            </span>
                            {getStatusBadge(event.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Event ID: {event.event_id}
                          </p>
                          {event.error_message && (
                            <p className="text-xs text-destructive mt-1">
                              {event.error_message}
                            </p>
                          )}
                          {event.stripe_customer_id && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Klant: {event.stripe_customer_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: nl })}
                        </p>
                        {event.processing_time_ms && (
                          <p className="text-xs text-muted-foreground">
                            {event.processing_time_ms}ms
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WebhookHealthMonitor;
