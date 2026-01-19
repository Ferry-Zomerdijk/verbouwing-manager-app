import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, MapPin, User, Pencil, Trash2, MessageSquare } from "lucide-react";
import { format, isPast, isWithinInterval, addDays } from "date-fns";
import { nl } from "date-fns/locale";
import { useSwipeable } from "react-swipeable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditTaskDialog from "./EditTaskDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MobileTaskCardProps {
  task: any;
  onUpdate: () => void;
  onStatusChange: (taskId: string, newStatus: "Te doen" | "Bezig" | "Gereed") => void;
  canDelete?: boolean;
  availableDelenVanHuis?: string[];
}

const priorityConfig = {
  Laag: { color: "bg-blue-500", textColor: "text-blue-500" },
  Middel: { color: "bg-amber-500", textColor: "text-amber-500" },
  Hoog: { color: "bg-red-500", textColor: "text-red-500" },
};

const statusConfig = {
  "Te doen": { color: "bg-muted text-muted-foreground" },
  "Bezig": { color: "bg-primary/20 text-primary" },
  "Gereed": { color: "bg-green-500/20 text-green-700" },
};

const getTaskTypeColorClass = (kleur: string | null) => {
  if (!kleur) return "bg-gray-500";
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500", orange: "bg-orange-500", purple: "bg-purple-500",
    green: "bg-green-500", yellow: "bg-yellow-500", gray: "bg-gray-500",
    red: "bg-red-500", pink: "bg-pink-500", cyan: "bg-cyan-500",
  };
  return colorMap[kleur] || "bg-gray-500";
};

const MobileTaskCard = ({ task, onUpdate, onStatusChange, canDelete = true, availableDelenVanHuis = [] }: MobileTaskCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (canDelete) {
        setSwiped("left");
        setTimeout(() => setDeleteDialogOpen(true), 100);
        setTimeout(() => setSwiped(null), 300);
      }
    },
    onSwipedRight: () => {
      setSwiped("right");
      setTimeout(() => setEditDialogOpen(true), 100);
      setTimeout(() => setSwiped(null), 300);
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", task.id);
      if (error) throw error;
      toast.success("Taak verwijderd");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
    }
  };

  const getDeadlineStatus = () => {
    if (!task.deadline) return null;
    if (task.status === "Gereed") return null;
    
    // Parse deadline als lokale datum (YYYY-MM-DD)
    const [year, month, day] = task.deadline.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day); // Middernacht van deadline dag
    
    // Vandaag om middernacht (start van de dag)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Overdue: deadline datum is VOOR vandaag
    if (deadlineDate < today) return "overdue";
    
    // Soon: deadline is vandaag of binnen 3 dagen
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    if (deadlineDate <= threeDaysFromNow) return "soon";
    
    return null;
  };

  const deadlineStatus = getDeadlineStatus();

  const getLatestUpdatePreview = () => {
    if (!task.latest_update) return null;
    const firstLine = task.latest_update.split("\n")[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + "..." : firstLine;
  };

  const latestUpdatePreview = getLatestUpdatePreview();
  const priority = task.prioriteit as keyof typeof priorityConfig;

  return (
    <>
      <Card 
        {...swipeHandlers}
        className={`p-4 transition-all duration-150 touch-pan-y active:bg-muted/50 ${
          swiped === "left" ? "translate-x-[-20px] bg-destructive/5" : ""
        } ${swiped === "right" ? "translate-x-[20px] bg-primary/5" : ""}`}
      >
        {/* Header row: Priority badge, Type badge & Status selector */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${priorityConfig[priority]?.color || "bg-muted"} text-white text-xs px-3 py-1`}>
              {task.prioriteit || "Geen"}
            </Badge>
            {task.task_type && (
              <Badge className={`${getTaskTypeColorClass(task.task_type.kleur)} text-white text-xs px-2 py-1`}>
                {task.task_type.naam}
              </Badge>
            )}
          </div>
          
          <Select
            value={task.status}
            onValueChange={(value) => onStatusChange(task.id, value as "Te doen" | "Bezig" | "Gereed")}
          >
            <SelectTrigger className={`w-auto h-10 text-sm font-medium border-0 px-3 ${statusConfig[task.status as keyof typeof statusConfig]?.color || ""}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Te doen">Te doen</SelectItem>
              <SelectItem value="Bezig">Bezig</SelectItem>
              <SelectItem value="Gereed">Gereed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Title with expand button */}
        <div 
          className="flex items-start justify-between gap-2 cursor-pointer min-h-[44px]"
          onClick={() => setExpanded(!expanded)}
        >
          <h4 className="font-semibold text-base leading-tight flex-1 py-2">
            {task.titel}
          </h4>
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0">
            <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Deadline & Verantwoordelijke grid */}
        {(task.deadline || task.verantwoordelijke) && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {task.deadline && (
              <div className={`flex items-center gap-2 text-sm ${
                deadlineStatus === "overdue" ? "text-destructive font-medium" :
                deadlineStatus === "soon" ? "text-orange-500" :
                "text-muted-foreground"
              }`}>
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {deadlineStatus === "overdue" && "⚠️ "}
                  {format(new Date(task.deadline), "d MMM yyyy", { locale: nl })}
                </span>
              </div>
            )}
            {task.verantwoordelijke && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{task.verantwoordelijke}</span>
              </div>
            )}
          </div>
        )}

        {/* Latest Update Preview (always visible) */}
        {latestUpdatePreview && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t border-border/50">
            <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{latestUpdatePreview}</span>
          </div>
        )}

        {/* Expanded details */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {task.deel_van_huis && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{task.deel_van_huis}</span>
              </div>
            )}

            {task.beschrijving && (
              <p className="text-sm text-muted-foreground mt-2">
                {task.beschrijving}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 mt-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 h-11"
                onClick={() => setEditDialogOpen(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Bewerken
              </Button>
              {canDelete && (
                <Button 
                  variant="outline" 
                  size="icon"
                  className="text-destructive hover:text-destructive h-11 w-11"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        onSuccess={onUpdate}
        availableDelenVanHuis={availableDelenVanHuis}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Taak Verwijderen"
        description="Dit kan niet ongedaan worden gemaakt."
        itemName={task.titel}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

export default MobileTaskCard;
