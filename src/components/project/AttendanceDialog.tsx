import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

interface AttendanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  contractors: Contractor[];
  attendance?: Attendance | null;
  defaultDate?: Date | null;
  defaultContractorId?: string | null;
  onDelete?: () => void;
}

interface TimePreset {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  color?: string;
}

const PRESET_COLORS: Record<string, { bg: string; text: string }> = {
  yellow: { bg: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700", text: "text-yellow-800 dark:text-yellow-300" },
  orange: { bg: "bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700", text: "text-orange-800 dark:text-orange-300" },
  purple: { bg: "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700", text: "text-purple-800 dark:text-purple-300" },
  blue: { bg: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700", text: "text-blue-800 dark:text-blue-300" },
  green: { bg: "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700", text: "text-green-800 dark:text-green-300" },
  pink: { bg: "bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700", text: "text-pink-800 dark:text-pink-300" },
  gray: { bg: "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600", text: "text-gray-800 dark:text-gray-300" },
};

const DEFAULT_PRESETS = [
  { id: "default-1", label: "Ochtend", start_time: "07:00", end_time: "12:00", color: "yellow" },
  { id: "default-2", label: "Middag", start_time: "12:30", end_time: "17:00", color: "orange" },
  { id: "default-3", label: "Hele dag", start_time: "07:00", end_time: "17:00", color: "green" },
  { id: "default-4", label: "Korte dag", start_time: "07:00", end_time: "14:00", color: "blue" },
  { id: "default-5", label: "Avond", start_time: "17:00", end_time: "21:00", color: "purple" },
];

const AttendanceDialog = ({
  open,
  onOpenChange,
  projectId,
  contractors,
  attendance,
  defaultDate,
  defaultContractorId,
  onDelete,
}: AttendanceDialogProps) => {
  const [contractorId, setContractorId] = useState<string>("");
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<string>("07:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [status, setStatus] = useState<AttendanceStatus>("aanwezig");
  const [notes, setNotes] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const queryClient = useQueryClient();
  const isEditing = !!attendance;

  // Fetch time presets from database
  const { data: timePresets = DEFAULT_PRESETS } = useQuery({
    queryKey: ["attendance-presets", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_time_presets")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      
      // Return defaults if no presets exist
      if (!data || data.length === 0) {
        return DEFAULT_PRESETS;
      }
      return data as TimePreset[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (attendance) {
      setContractorId(attendance.contractor_id);
      setDate(new Date(attendance.date));
      setStartTime(attendance.start_time || "07:00");
      setEndTime(attendance.end_time || "17:00");
      setStatus(attendance.status);
      setNotes(attendance.notes || "");
    } else {
      setContractorId(defaultContractorId || contractors[0]?.id || "");
      setDate(defaultDate || new Date());
      setStartTime("07:00");
      setEndTime("17:00");
      setStatus("aanwezig");
      setNotes("");
    }
  }, [attendance, defaultDate, defaultContractorId, contractors, open]);

  const saveAttendance = useMutation({
    mutationFn: async () => {
      const data = {
        project_id: projectId,
        contractor_id: contractorId,
        date: format(date, "yyyy-MM-dd"),
        start_time: status === "aanwezig" ? startTime : null,
        end_time: status === "aanwezig" ? endTime : null,
        status,
        notes: notes || null,
      };

      if (isEditing && attendance) {
        const { error } = await supabase
          .from("attendance")
          .update(data)
          .eq("id", attendance.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("attendance")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", projectId] });
      toast.success(isEditing ? "Aanwezigheid bijgewerkt" : "Aanwezigheid toegevoegd");
      onOpenChange(false);
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Er is al een registratie voor deze datum en bouwvakker");
      } else {
        toast.error("Er is een fout opgetreden");
      }
    },
  });

  const handlePredefinedTime = (preset: TimePreset) => {
    setStartTime(preset.start_time);
    setEndTime(preset.end_time);
    setStatus("aanwezig");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractorId) {
      toast.error("Selecteer een bouwvakker");
      return;
    }
    saveAttendance.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Aanwezigheid bewerken" : "Aanwezigheid toevoegen"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contractor select */}
          <div className="space-y-2">
            <Label>Bouwvakker</Label>
            <Select 
              value={contractorId} 
              onValueChange={setContractorId}
              disabled={isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecteer bouwvakker" />
              </SelectTrigger>
              <SelectContent>
                {contractors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.naam} {c.rol && `(${c.rol})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date picker */}
          <div className="space-y-2">
            <Label>Datum</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                  disabled={isEditing}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: nl }) : "Kies een datum"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setDate(d);
                    setCalendarOpen(false);
                  }}
                  locale={nl}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Status select */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as AttendanceStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aanwezig">Aanwezig</SelectItem>
                <SelectItem value="afwezig">Afwezig</SelectItem>
                <SelectItem value="ziek">Ziek</SelectItem>
                <SelectItem value="vakantie">Vakantie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Predefined times - only show when status is aanwezig */}
          {status === "aanwezig" && (
            <>
              <div className="space-y-2">
                <Label>Snelle selectie</Label>
                <div className="flex flex-wrap gap-2">
                  {timePresets.map((preset) => {
                    const isSelected = startTime === preset.start_time && endTime === preset.end_time;
                    const colorStyle = PRESET_COLORS[preset.color || "gray"];
                    
                    return (
                      <Button
                        key={preset.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "border-2 transition-all",
                          isSelected 
                            ? cn(colorStyle?.bg, colorStyle?.text, "ring-2 ring-offset-1 ring-primary")
                            : cn(colorStyle?.bg, colorStyle?.text, "hover:opacity-80")
                        )}
                        onClick={() => handlePredefinedTime(preset)}
                      >
                        {preset.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Custom times */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Starttijd
                  </Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Eindtijd
                  </Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notities (optioneel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Eventuele opmerkingen..."
              rows={2}
            />
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  onDelete();
                  onOpenChange(false);
                }}
                className="w-full sm:w-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Verwijderen
              </Button>
            )}
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Annuleren
              </Button>
              <Button type="submit" disabled={saveAttendance.isPending} className="flex-1">
                {saveAttendance.isPending ? "Opslaan..." : "Opslaan"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AttendanceDialog;
