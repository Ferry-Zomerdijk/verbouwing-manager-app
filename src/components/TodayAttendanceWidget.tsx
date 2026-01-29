import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TodayAttendance {
  id: string;
  project_id: string;
  contractor_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
  contractor_naam: string;
  project_naam: string;
}

const TodayAttendanceWidget = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayAttendance = [], isLoading } = useQuery({
    queryKey: ["today-attendance", today],
    queryFn: async () => {
      try {
        // Fetch today's attendance with contractor and project info
        // Using regular joins instead of !inner to prevent RLS from hiding results
        const { data, error } = await supabase
          .from("attendance")
          .select(`
            id,
            project_id,
            contractor_id,
            date,
            start_time,
            end_time,
            status,
            contractors(naam),
            projects(naam)
          `)
          .eq("date", today)
          .eq("status", "aanwezig")
          .order("start_time");

        if (error) {
          console.error("Attendance query error:", error);
          return [];
        }

        return (data || []).map((item: any) => ({
          id: item.id,
          project_id: item.project_id,
          contractor_id: item.contractor_id,
          date: item.date,
          start_time: item.start_time,
          end_time: item.end_time,
          status: item.status,
          contractor_naam: item.contractors?.naam || "Onbekend",
          project_naam: item.projects?.naam || "Onbekend project",
        })) as TodayAttendance[];
      } catch (err) {
        console.error("Attendance fetch failed:", err);
        return [];
      }
    },
  });

  // Group by project
  const attendanceByProject = todayAttendance.reduce((acc, item) => {
    if (!acc[item.project_id]) {
      acc[item.project_id] = {
        project_naam: item.project_naam,
        items: [],
      };
    }
    acc[item.project_id].items.push(item);
    return acc;
  }, {} as Record<string, { project_naam: string; items: TodayAttendance[] }>);

  const totalPresent = todayAttendance.length;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="h-20 animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            Vandaag aanwezig
          </CardTitle>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            {totalPresent} {totalPresent === 1 ? "persoon" : "personen"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(), "EEEE d MMMM", { locale: nl })}
        </p>
      </CardHeader>
      <CardContent className="pt-2">
        {totalPresent === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Vandaag geen aanwezigheid geregistreerd</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(attendanceByProject).map(([projectId, { project_naam, items }]) => (
              <div 
                key={projectId} 
                className="group cursor-pointer rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                onClick={() => navigate(`/project/${projectId}?tab=aanwezigheid`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm truncate">{project_naam}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full",
                        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      )}
                    >
                      <span className="font-medium">{item.contractor_naam}</span>
                      {item.start_time && item.end_time && (
                        <span className="flex items-center gap-0.5 text-green-600 dark:text-green-300">
                          <Clock className="w-3 h-3" />
                          {item.start_time.slice(0, 5)}-{item.end_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayAttendanceWidget;
