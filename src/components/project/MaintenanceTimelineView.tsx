import { format, parse, isBefore, isAfter, addDays, addWeeks, addMonths, addYears, differenceInDays } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Phone, Paperclip, CalendarDays, AlertTriangle, CheckCircle2, CalendarClock, HelpCircle } from "lucide-react";
import type { MaintenanceInstruction } from "./EditMaintenanceDialog";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";
import { getMonthName } from "./MonthPicker";

interface MaintenanceTimelineViewProps {
  instructions: MaintenanceInstruction[];
  onEdit: (item: MaintenanceInstruction) => void;
  onDelete: (item: MaintenanceInstruction) => void;
  isAdminOrOwner?: boolean;
}

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
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

function getNextDate(item: MaintenanceInstruction): Date | null {
  if (item.laatste_onderhoud && item.frequentie) {
    return calculateNextMaintenance(item.laatste_onderhoud, item.frequentie);
  }
  return null;
}

function formatRelativeDate(date: Date, today: Date, language: string): string {
  const days = differenceInDays(date, today);
  if (days === 0) return language === 'nl' ? 'Vandaag' : 'Today';
  if (days === 1) return language === 'nl' ? 'Morgen' : 'Tomorrow';
  if (days === -1) return language === 'nl' ? 'Gisteren' : 'Yesterday';
  if (days < -1) {
    const absDays = Math.abs(days);
    return language === 'nl' ? `${absDays} dagen te laat` : `${absDays} days overdue`;
  }
  if (days <= 7) return language === 'nl' ? `Over ${days} dagen` : `In ${days} days`;
  return '';
}

function TimelineCard({ 
  item, 
  onEdit, 
  t, 
  language, 
  nextDate, 
  variant 
}: { 
  item: MaintenanceInstruction; 
  onEdit: (i: MaintenanceInstruction) => void; 
  t: any; 
  language: string; 
  nextDate: Date | null;
  variant: 'overdue' | 'scheduled' | 'ifNeeded';
}) {
  const locale = language === 'nl' ? nl : enUS;
  const today = getToday();

  const borderClass = variant === 'overdue' 
    ? 'border-l-4 border-l-destructive' 
    : variant === 'scheduled' 
      ? 'border-l-4 border-l-primary' 
      : 'border-l-4 border-l-muted';

  return (
    <Card 
      className={`group cursor-pointer transition-colors hover:bg-accent/50 ${borderClass}`}
      onClick={() => onEdit(item)}
    >
      <CardContent className="p-3">
        {/* Prominent next date */}
        {nextDate && (
          <div className={`flex items-center gap-2 mb-2 ${variant === 'overdue' ? 'text-destructive' : 'text-primary'}`}>
            <CalendarClock className="h-4 w-4 shrink-0" />
            <span className="font-semibold text-sm">
              {format(nextDate, "d MMMM yyyy", { locale })}
            </span>
            {(() => {
              const rel = formatRelativeDate(nextDate, today, language);
              return rel ? (
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  variant === 'overdue' 
                    ? 'bg-destructive/10 text-destructive' 
                    : 'bg-primary/10 text-primary'
                }`}>
                  {rel}
                </span>
              ) : null;
            })()}
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium text-sm">{item.titel}</h4>
              <MaintenanceStatusBadge
                instructionId={item.id}
                projectId={item.project_id}
                currentStatus={item.status || "Nog doen"}
              />
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
              {item.laatste_onderhoud && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  {t.management.maintenance.labels.lastMaintenance}: {format(parse(item.laatste_onderhoud, "yyyy-MM-dd", new Date()), "d MMM yyyy", { locale })}
                </span>
              )}
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
  const today = getToday();

  const overdue: (MaintenanceInstruction & { _next: Date })[] = [];
  const scheduled: (MaintenanceInstruction & { _next: Date })[] = [];
  const ifNeeded: MaintenanceInstruction[] = [];

  instructions.forEach(item => {
    const next = getNextDate(item);
    if (!next) {
      ifNeeded.push(item);
    } else if (isBefore(next, today)) {
      overdue.push({ ...item, _next: next });
    } else {
      scheduled.push({ ...item, _next: next });
    }
  });

  // Most overdue first
  overdue.sort((a, b) => a._next.getTime() - b._next.getTime());
  // Soonest first
  scheduled.sort((a, b) => a._next.getTime() - b._next.getTime());

  return (
    <div className="space-y-6">
      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">
              {t.management.maintenance.timeline.overdue}
            </h3>
            <Badge variant="destructive" className="text-xs">{overdue.length}</Badge>
          </div>
          <div className="space-y-2">
            {overdue.map(item => (
              <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} nextDate={item._next} variant="overdue" />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled */}
      {scheduled.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              {t.management.maintenance.timeline.planned}
            </h3>
            <span className="text-xs text-muted-foreground">({scheduled.length})</span>
          </div>
          <div className="space-y-2">
            {scheduled.map(item => (
              <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} nextDate={item._next} variant="scheduled" />
            ))}
          </div>
        </div>
      )}

      {/* If needed */}
      {ifNeeded.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">
              {t.management.maintenance.timeline.ifNeeded}
            </h3>
            <span className="text-xs text-muted-foreground">({ifNeeded.length})</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3 ml-6">
            {t.management.maintenance.timeline.ifNeededDescription}
          </p>
          <div className="space-y-2">
            {ifNeeded.map(item => (
              <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} nextDate={null} variant="ifNeeded" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
