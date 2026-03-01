import { format, parse, isAfter, isBefore, addDays, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { nl, enUS } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Phone, Paperclip, CalendarDays, AlertTriangle } from "lucide-react";
import type { MaintenanceInstruction } from "./EditMaintenanceDialog";

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

function getMaintenanceStatus(item: MaintenanceInstruction): MaintenanceStatus {
  if (!item.periode_van && !item.periode_tot) return "noPeriod";
  
  const today = getToday();
  const endDate = item.periode_tot ? parse(item.periode_tot, "yyyy-MM-dd", new Date()) : null;
  const startDate = item.periode_van ? parse(item.periode_van, "yyyy-MM-dd", new Date()) : null;

  if (endDate && isBefore(endDate, today)) return "overdue";
  
  const weekFromNow = addDays(today, 7);
  if (startDate && isBefore(startDate, weekFromNow) && (!endDate || !isBefore(endDate, today))) {
    if (endDate && isBefore(endDate, weekFromNow)) return "thisWeek";
    if (!endDate && isBefore(startDate, weekFromNow)) return "thisWeek";
    if (startDate && !isAfter(startDate, today)) return "active";
    if (startDate && isAfter(startDate, today) && isBefore(startDate, weekFromNow)) return "thisWeek";
  }
  
  if (startDate && !isAfter(startDate, today) && endDate && !isBefore(endDate, today)) return "active";
  if (startDate && isAfter(startDate, today)) return "planned";
  
  return "noPeriod";
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

function TimelineCard({ item, onEdit, t, language }: { item: MaintenanceInstruction; onEdit: (i: MaintenanceInstruction) => void; t: any; language: string }) {
  const status = getMaintenanceStatus(item);
  const locale = language === 'nl' ? nl : enUS;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return format(parse(dateStr, "yyyy-MM-dd", new Date()), "d MMM", { locale });
  };

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
              <StatusBadge status={status} t={t} />
            </div>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
              {(item.periode_van || item.periode_tot) && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(item.periode_van)} — {formatDate(item.periode_tot)}
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
  const locale = language === 'nl' ? nl : enUS;
  const today = getToday();

  // Separate: overdue, with period, without period
  const overdue: MaintenanceInstruction[] = [];
  const withPeriod: MaintenanceInstruction[] = [];
  const noPeriod: MaintenanceInstruction[] = [];

  instructions.forEach(item => {
    const status = getMaintenanceStatus(item);
    if (status === "overdue") overdue.push(item);
    else if (status === "noPeriod") noPeriod.push(item);
    else withPeriod.push(item);
  });

  // Sort by periode_van
  withPeriod.sort((a, b) => {
    const aDate = a.periode_van || "9999-12-31";
    const bDate = b.periode_van || "9999-12-31";
    return aDate.localeCompare(bDate);
  });

  overdue.sort((a, b) => {
    const aDate = a.periode_tot || "0000-01-01";
    const bDate = b.periode_tot || "0000-01-01";
    return aDate.localeCompare(bDate);
  });

  // Group withPeriod by month
  const monthGroups: Record<string, MaintenanceInstruction[]> = {};
  
  if (withPeriod.length > 0) {
    const firstDate = parse(withPeriod[0].periode_van || format(today, "yyyy-MM-dd"), "yyyy-MM-dd", new Date());
    const lastItem = withPeriod[withPeriod.length - 1];
    const lastDate = parse(lastItem.periode_tot || lastItem.periode_van || format(today, "yyyy-MM-dd"), "yyyy-MM-dd", new Date());
    
    const months = eachMonthOfInterval({ start: firstDate < today ? firstDate : today, end: lastDate });
    months.forEach(month => {
      const key = format(month, "yyyy-MM");
      monthGroups[key] = [];
    });

    withPeriod.forEach(item => {
      const startDate = item.periode_van ? parse(item.periode_van, "yyyy-MM-dd", new Date()) : today;
      const key = format(startOfMonth(startDate), "yyyy-MM");
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push(item);
    });
  }

  const currentMonthKey = format(today, "yyyy-MM");

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
      {Object.entries(monthGroups).map(([monthKey, items]) => {
        const monthDate = parse(monthKey + "-01", "yyyy-MM-dd", new Date());
        const isCurrentMonth = monthKey === currentMonthKey;

        return (
          <div key={monthKey}>
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`text-sm font-semibold capitalize ${isCurrentMonth ? "text-primary" : "text-muted-foreground"}`}>
                {format(monthDate, "MMMM yyyy", { locale })}
              </h3>
              {isCurrentMonth && (
                <Badge variant="default" className="text-xs">
                  {language === 'nl' ? 'Nu' : 'Now'}
                </Badge>
              )}
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground">({items.length})</span>
              )}
            </div>
            <div className={`space-y-2 border-l-2 pl-4 ${isCurrentMonth ? "border-primary/40" : "border-muted"}`}>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground py-1 italic">{t.management.maintenance.timeline.noTasks}</p>
              ) : (
                items.map(item => (
                  <TimelineCard key={item.id} item={item} onEdit={onEdit} t={t} language={language} />
                ))
              )}
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
