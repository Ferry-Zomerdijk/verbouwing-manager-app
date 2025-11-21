import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, MoreVertical, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useSwipeable } from "react-swipeable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import EditTaskDialog from "./EditTaskDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskCardProps {
  task: any;
  onUpdate: () => void;
  canDelete?: boolean;
}

const priorityColors = {
  Laag: "bg-blue-500",
  Middel: "bg-yellow-500",
  Hoog: "bg-red-500",
};

const TaskCard = ({ task, onUpdate, canDelete = true }: TaskCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [swiped, setSwiped] = useState<"left" | "right" | null>(null);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setSwiped("left");
      setTimeout(() => setDeleteDialogOpen(true), 100);
      setTimeout(() => setSwiped(null), 300);
    },
    onSwipedRight: () => {
      setSwiped("right");
      setTimeout(() => setEditDialogOpen(true), 100);
      setTimeout(() => setSwiped(null), 300);
    },
    trackMouse: false,
    trackTouch: true,
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

  return (
    <>
      <Card 
        {...swipeHandlers}
        className={`p-4 hover:shadow-md transition-all group relative ${
          swiped === "left" ? "translate-x-[-100px] opacity-50" : 
          swiped === "right" ? "translate-x-[100px] opacity-50" : ""
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 cursor-pointer" onClick={() => setEditDialogOpen(true)}>
              <h4 className="font-semibold mb-1">{task.titel}</h4>
              {task.beschrijving && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.beschrijving}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerken
                </DropdownMenuItem>
                {canDelete && (
                  <DropdownMenuItem
                    onClick={() => setDeleteDialogOpen(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Verwijderen
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        <div className="flex items-center gap-2">
          <Badge className={`${priorityColors[task.prioriteit as keyof typeof priorityColors]} text-white text-xs`}>
            {task.prioriteit}
          </Badge>
        </div>

        {task.deadline && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{format(new Date(task.deadline), "dd MMM yyyy", { locale: nl })}</span>
          </div>
        )}

          {task.verantwoordelijke && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="w-3 h-3" />
              <span>{task.verantwoordelijke}</span>
            </div>
          )}
        </div>
      </Card>

      <EditTaskDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        task={task}
        onSuccess={onUpdate}
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

export default TaskCard;
