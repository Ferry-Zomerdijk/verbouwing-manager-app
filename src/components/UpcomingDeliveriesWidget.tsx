import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, ArrowRight } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface DeliveryTask {
  id: string;
  titel: string;
  verwachte_leverdatum: string;
  project_id: string;
  project: {
    id: string;
    naam: string;
  } | null;
}

const UpcomingDeliveriesWidget = () => {
  const navigate = useNavigate();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ["upcoming-deliveries"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      
      const { data: tasks, error } = await supabase
        .from("tasks")
        .select(`
          id,
          titel,
          verwachte_leverdatum,
          project_id,
          project:projects(id, naam),
          task_type:task_types(icoon)
        `)
      .not("verwachte_leverdatum", "is", null)
      .gte("verwachte_leverdatum", today)
      .neq("status", "Gereed")
      .order("verwachte_leverdatum", { ascending: true })
        .limit(20);

      if (error) throw error;
      
      // Filter only "Kopen" tasks and take max 5
      return (tasks || [])
        .filter((task: any) => task.task_type?.icoon === "shopping-cart")
        .slice(0, 5) as DeliveryTask[];
    },
  });

  const getDeliveryLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Vandaag";
    if (isTomorrow(date)) return "Morgen";
    return format(date, "EEEE", { locale: nl });
  };

  const getDeliveryClass = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "text-orange-600 dark:text-orange-400 font-medium";
    if (isTomorrow(date)) return "text-blue-600 dark:text-blue-400";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="h-5 w-40" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasDeliveries = deliveries && deliveries.length > 0;

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <div className="p-1.5 rounded-lg bg-blue-500/10">
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          Aankomende leveringen
          {hasDeliveries && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {deliveries.length} {deliveries.length === 1 ? "item" : "items"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasDeliveries ? (
          <div className="space-y-2">
            {deliveries.map((delivery) => (
              <button
                key={delivery.id}
                onClick={() => navigate(`/project/${delivery.project_id}`)}
                className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{delivery.titel}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {delivery.project?.naam}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className={`text-xs ${getDeliveryClass(delivery.verwachte_leverdatum)}`}>
                      {getDeliveryLabel(delivery.verwachte_leverdatum)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(delivery.verwachte_leverdatum), "d MMM", { locale: nl })}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Geen geplande leveringen
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeliveriesWidget;
