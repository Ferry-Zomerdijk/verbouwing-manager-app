import { format, parse, isBefore, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Phone, Paperclip, CalendarDays, AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";
import type { MaintenanceInstruction } from "./EditMaintenanceDialog";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";
import { getMonthName } from "./MonthPicker";

interface MaintenanceTimelineViewProps {
  instructions: MaintenanceInstruction[];
  onEdit: (item: MaintenanceInstruction) => void;
  onDelete: (item: MaintenanceInstruction) => void;
  isAdminOrOwner?: boolean;
}

type MaintenanceStatus = "overdue" | "thisWeek" | "active" | "planned" | "noPeriod";

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isMonthInPeriod(month: number, from: number, to: number): boolean {
  if (from <= to) {
    return month >= from && month <= to;
  }
  // Wrap-around (e.g. Nov-Mar = 11-3)
  return month >= from || month <= to;
}

function getMaintenanceStatus(item: MaintenanceInstruction): MaintenanceStatus {
  if (item.periode_van == null && item.periode_tot == null) return "noPeriod";
  
  const currentMonth = new Date().getMonth() + 1;
  const from = item.periode_van ?? 1;
  const to = item.periode_tot ?? 12;

  if (isMonthInPeriod(currentMonth, from, to)) return "active";
  
  // Check if the period recently ended (within last month)
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  if (to === prevMonth) return "overdue";
  
  return "planned";
}

function StatusBadge({ status, t }: { status: MaintenanceStatus; t: any }) {
  const config = {
    overdue: { label: t.management.maintenance.timeline.overdue, className: "bg-destructive text-destructive-foreground" },
    thisWeek: { label: t.management.maintenance.timeline.thisWeek, className: "bg-orange-500 text-white" },
    active: { label: t.management.maintenance.timeline.active, className: "bg-green-600 text-white" },
    planned: { label: t.management.maintenance.timeline.planned, className: "bg-muted text-muted-foreground" },
    noPeriod: { label: t.management.maintenance.timeline.noPeriod, className: "bg-muted text-muted-foreground" },
  };
  const c = config[status];
  return <Badge className={c.className}>{c.label}</Badge>;
}

function calculateNextMaintenance(laatsteOnderhoud: string, frequentie: string): Date | null {
  const lastDate = parse(laatsteOnderhoud, "yyyy-MM-dd", new Date());
  const frequencyMap: Record<string, (d: Date) => Date> = {
    "Wekelijks": (d) => addWeeks(d, 1),
    "Tweewekelijks": (d) => addWeeks(d, 2),
    "Maandelijks": (d) => addMonths(d, 1),
    "Per kwartaal": (d) => addMonths(d, 3),
    "Halfjaarlijks": (d) => addMonths(d, 6),
    "Jaarlijks": (d) => addYears(d, 1),
  };
  if (frequencyMap[frequentie]) return frequencyMap[frequentie](lastDate);
  const customMatch = frequentie.match(/^Elke (\d+) (\w+)$/);
  if (customMatch) {
    const amount = parseInt(customMatch[1]);
    const unit = customMatch[2];
    if (unit === "dagen") return addDays(lastDate, amount);
    if (unit === "weken") return addWeeks(lastDate, amount);
    if (unit === "maanden") return addMonths(lastDate, amount);
    if (unit === "jaren") return addYears(lastDate, amount);
  }
  return null;
}

function TimelineCard({ item, onEdit, t, language }: { item: MaintenanceInstruction; onEdit: (i: MaintenanceInstruction) => void; t: any; language: string }) {
  const status = getMaintenanceStatus(item);
  const locale = language === 'nl' ? nl : enUS;

  return (
    <Card 
      className={`group cursor-pointer transition-colors hover:bg-accent/50 ${status === "overdue" ? "border-destructive/50" : ""}`}
      onClick={() => onEdit(item)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm">{item.titel}</h4>
              <MaintenanceStatusBadge
                instructionId={item.id}
                projectId={item.project_id}
                currentStatus={item.status || "Nog doen"}
              />
              <StatusBadge status={status} t={t} />
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
              {item.laatste_onderhoud && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {t.management.maintenance.labels.lastMaintenance}: {format(parse(item.laatste_onderhoud, "yyyy-MM-dd", new Date()), "d MMM yyyy", { locale })}
                </span>
              )}
              {item.laatste_onderhoud && item.frequentie && (() => {
                const next = calculateNextMaintenance(item.laatste_onderhoud, item.frequentie);
                if (!next) return null;
                const today = getToday();
                const isOverdue = isBefore(next, today);
                return (
                  <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                    <CalendarClock className="h-3 w-3" />
                    {t.management.maintenance.labels.nextMaintenance}: {format(next, "d MMM yyyy", { locale })}
                  </span>
                );
              })()}
              {(item.periode_van != null || item.periode_tot != null) && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {item.periode_van != null ? getMonthName(item.periode_van, language) : ""} — {item.periode_tot != null ? getMonthName(item.periode_tot, language) : ""}
                </span>
              )}
              {item.deel_van_huis && (
                <Badge variant="secondary" className="text-xs py-0">{item.deel_van_huis}</Badge>
              )}
              {item.frequentie && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.frequentie}
                </span>
              )}
              {item.contact_naam && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.contact_naam}
                </span>
              )}
              {item.contact_telefoon && (
                <a
                  href={`tel:${item.contact_telefoon}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-3 w-3" />
                  {item.contact_telefoon}
                </a>
              )}
              {(item.bijlage_url || item.document_id) && (
                <span className="flex items-center gap-1 text-primary">
                  <Paperclip className="h-3 w-3" />
                  {t.management.maintenance.labels.attachment}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MaintenanceTimelineView({ instructions, onEdit }: MaintenanceTimelineViewProps) {
  const { t, language } = useLanguage();

  // Separate: overdue, active/planned with period, without period
  const overdue: MaintenanceInstruction[] = [];
  const withPeriod: MaintenanceInstruction[] = [];
  const noPeriod: MaintenanceInstruction[] = [];

  instructions.forEach(item => {
    const status = getMaintenanceStatus(item);
    if (status === "overdue") overdue.push(item);
    else if (status === "noPeriod") noPeriod.push(item);
    else withPeriod.push(item);
  });

  // Sort by periode_van month
  withPeriod.sort((a, b) => (a.periode_van ?? 13) - (b.periode_van ?? 13));

  // Group by start month
  const monthGroups: Record<number, MaintenanceInstruction[]> = {};
  withPeriod.forEach(item => {
    const month = item.periode_van ?? 0;
    if (!monthGroups[month]) monthGroups[month] = [];
    monthGroups[month].push(item);
  });

  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-6">
      {/* Overdue section */}
      {overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">
              {t.management.maintenance.timeline.overdue}
            </h3>
            <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
          </div>
          <div className="space-y-2 border-l-2 border-destructive/30 pl-4">
            {overdue.map(item => (
              <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} />
            ))}
          </div>
        </div>
      )}

      {/* Monthly groups */}
      {Object.entries(monthGroups).map(([monthStr, items]) => {
        const month = parseInt(monthStr);
        const isCurrentMonth = month === currentMonth;

        return (
          <div key={month}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-sm font-semibold capitalize ${isCurrentMonth ? "text-primary" : "text-muted-foreground"}`}>
                {getMonthName(month, language)}
              </h3>
              {isCurrentMonth && (
                <Badge variant="default" className="text-xs">
                  {language === 'nl' ? 'Nu' : 'Now'}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">({items.length})</span>
            </div>
            <div className={`space-y-2 border-l-2 pl-4 ${isCurrentMonth ? "border-primary/40" : "border-muted"}`}>
              {items.map(item => (
                <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} />
              ))}
            </div>
          </div>
        );
      })}

      {/* No period section */}
      {noPeriod.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            {t.management.maintenance.timeline.noPeriod}
          </h3>
          <div className="space-y-2 border-l-2 border-muted pl-4">
            {noPeriod.map(item => (
              <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
