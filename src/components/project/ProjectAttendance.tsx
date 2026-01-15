import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Calendar, Users, Clock, Settings } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AttendanceDialog from "./AttendanceDialog";
import { TimePresetsManager } from "./TimePresetsManager";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProjectAttendanceProps {
  projectId: string;
}

type AttendanceStatus = "aanwezig" | "afwezig" | "ziek" | "vakantie";

interface Attendance {
  id: string;
  project_id: string;
  contractor_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  status: AttendanceStatus;
  notes: string | null;
}

interface Contractor {
  id: string;
  naam: string;
  rol: string | null;
  bedrijf: string | null;
  is_actief: boolean;
}

const statusColors: Record<AttendanceStatus, string> = {
  aanwezig: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  afwezig: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
  ziek: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  vakantie: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

const statusLabels: Record<AttendanceStatus, string> = {
  aanwezig: "Aanwezig",
  afwezig: "Afwezig",
  ziek: "Ziek",
  vakantie: "Vakantie",
};

const ProjectAttendance = ({ projectId }: ProjectAttendanceProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [presetsDialogOpen, setPresetsDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedContractor, setSelectedContractor] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  // First fetch the "Bouwvakkers" category for this project
  const { data: bouwvakkersCategory } = useQuery({
    queryKey: ["bouwvakkers-category", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_categories")
        .select("id")
        .eq("project_id", projectId)
        .eq("naam", "Bouwvakkers")
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch active contractors from "Bouwvakkers" category only
  const { data: contractors = [] } = useQuery({
    queryKey: ["contractors", projectId, "bouwvakkers", bouwvakkersCategory?.id],
    queryFn: async () => {
      if (!bouwvakkersCategory?.id) return [];
      
      const { data, error } = await supabase
        .from("contractors")
        .select("id, naam, rol, bedrijf, is_actief")
        .eq("project_id", projectId)
        .eq("is_actief", true)
        .eq("category_id", bouwvakkersCategory.id)
        .order("naam");

      if (error) throw error;
      return data as Contractor[];
    },
    enabled: !!bouwvakkersCategory?.id,
  });

  // Fetch attendance for current week
  const { data: attendanceData = [] } = useQuery({
    queryKey: ["attendance", projectId, format(currentWeekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("project_id", projectId)
        .gte("date", format(currentWeekStart, "yyyy-MM-dd"))
        .lte("date", format(weekEnd, "yyyy-MM-dd"));

      if (error) throw error;
      return data as Attendance[];
    },
  });

  // Create attendance map for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, Attendance>();
    attendanceData.forEach((a) => {
      map.set(`${a.contractor_id}-${a.date}`, a);
    });
    return map;
  }, [attendanceData]);

  const deleteAttendance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("attendance")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", projectId] });
      toast.success("Aanwezigheid verwijderd");
    },
    onError: () => {
      toast.error("Fout bij verwijderen");
    },
  });

  const handlePrevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const handleNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleCellClick = (contractor: Contractor, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const existing = attendanceMap.get(`${contractor.id}-${dateStr}`);
    
    if (existing) {
      setSelectedAttendance(existing);
      setSelectedDate(null);
      setSelectedContractor(null);
    } else {
      setSelectedAttendance(null);
      setSelectedDate(date);
      setSelectedContractor(contractor.id);
    }
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedAttendance(null);
    setSelectedDate(new Date());
    setSelectedContractor(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedAttendance(null);
    setSelectedDate(null);
    setSelectedContractor(null);
  };

  const getWeekNumber = (date: Date) => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  };

  // Calculate totals for the week
  const weekTotals = useMemo(() => {
    const totals = {
      aanwezig: 0,
      afwezig: 0,
      ziek: 0,
      vakantie: 0,
    };
    attendanceData.forEach((a) => {
      totals[a.status]++;
    });
    return totals;
  }, [attendanceData]);

  if (contractors.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Geen actieve contacten</h3>
          <p className="text-muted-foreground mb-4">
            Voeg eerst actieve contacten toe aan dit project om hun aanwezigheid bij te houden.
          </p>
          <Button variant="outline" onClick={() => window.location.hash = "#contacten"}>
            Naar Contacten
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={handleToday} className="text-sm">
            Vandaag
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="font-medium ml-2">
            Week {getWeekNumber(currentWeekStart)}, {format(currentWeekStart, "yyyy")}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPresetsDialogOpen(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Tijden</span>
          </Button>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Toevoegen
          </Button>
        </div>
      </div>

      {/* Week totals */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(weekTotals).map(([status, count]) => (
          <Badge 
            key={status} 
            variant="secondary" 
            className={cn("gap-1", statusColors[status as AttendanceStatus])}
          >
            {statusLabels[status as AttendanceStatus]}: {count}
          </Badge>
        ))}
      </div>

      {/* Attendance Grid */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium bg-muted/50 sticky left-0 z-10 min-w-[150px]">
                  Bouwvakker
                </th>
                {weekDays.map((day) => (
                  <th 
                    key={day.toISOString()} 
                    className={cn(
                      "text-center p-3 font-medium min-w-[80px]",
                      isToday(day) && "bg-primary/10",
                      (day.getDay() === 0 || day.getDay() === 6) && "bg-muted/30"
                    )}
                  >
                    <div className="text-xs text-muted-foreground">
                      {format(day, "EEE", { locale: nl })}
                    </div>
                    <div className={cn(
                      "text-sm",
                      isToday(day) && "font-bold text-primary"
                    )}>
                      {format(day, "d")}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor) => (
                <tr key={contractor.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="p-3 sticky left-0 bg-background z-10">
                    <div className="font-medium">{contractor.naam}</div>
                    {contractor.rol && (
                      <div className="text-xs text-muted-foreground">{contractor.rol}</div>
                    )}
                  </td>
                  {weekDays.map((day) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const attendance = attendanceMap.get(`${contractor.id}-${dateStr}`);
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    
                    return (
                      <td 
                        key={day.toISOString()} 
                        className={cn(
                          "p-1 text-center cursor-pointer hover:bg-muted/50 transition-colors",
                          isToday(day) && "bg-primary/5",
                          isWeekend && "bg-muted/20"
                        )}
                        onClick={() => handleCellClick(contractor, day)}
                      >
                        {attendance ? (
                          <div className="flex flex-col items-center gap-1">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs px-2", statusColors[attendance.status])}
                            >
                              {attendance.status === "aanwezig" && attendance.start_time && attendance.end_time ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {attendance.start_time.slice(0, 5)}-{attendance.end_time.slice(0, 5)}
                                </span>
                              ) : (
                                statusLabels[attendance.status]
                              )}
                            </Badge>
                          </div>
                        ) : (
                          <div className="text-muted-foreground/50 hover:text-muted-foreground">
                            <Plus className="w-4 h-4 mx-auto" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Aanwezig</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span>Afwezig</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-orange-500" />
          <span>Ziek</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>Vakantie</span>
        </div>
      </div>

      {/* Time Presets Dialog */}
      <TimePresetsManager
        projectId={projectId}
        open={presetsDialogOpen}
        onOpenChange={setPresetsDialogOpen}
      />

      {/* Attendance Dialog */}
      <AttendanceDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        projectId={projectId}
        contractors={contractors}
        attendance={selectedAttendance}
        defaultDate={selectedDate}
        defaultContractorId={selectedContractor}
        onDelete={selectedAttendance ? () => deleteAttendance.mutate(selectedAttendance.id) : undefined}
      />
    </div>
  );
};

export default ProjectAttendance;
