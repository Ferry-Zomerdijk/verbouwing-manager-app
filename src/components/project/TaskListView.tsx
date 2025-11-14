import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import EditTaskDialog from "./EditTaskDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { TaskBulkActions } from "./TaskBulkActions";

interface Task {
  id: string;
  titel: string;
  beschrijving: string | null;
  status: "Te doen" | "Bezig" | "Gereed";
  prioriteit: "Laag" | "Middel" | "Hoog" | null;
  verantwoordelijke: string | null;
  deel_van_huis: string | null;
  begindatum: string | null;
  deadline: string | null;
  project_id: string;
}

interface TaskListViewProps {
  tasks: Task[];
  onUpdate: () => void;
}

type SortKey = "titel" | "status" | "prioriteit" | "verantwoordelijke" | "deel_van_huis" | "begindatum" | "deadline";
type SortDirection = "asc" | "desc";

const statusColors = {
  "Te doen": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
  Bezig: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Gereed: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
};

const priorityColors = {
  Hoog: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  Middel: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  Laag: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
};

export const TaskListView = ({ tasks, onUpdate }: TaskListViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal > bVal ? 1 : -1;
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const toggleTaskSelection = (taskId: string) => {
    const newSelection = new Set(selectedTasks);
    if (newSelection.has(taskId)) {
      newSelection.delete(taskId);
    } else {
      newSelection.add(taskId);
    }
    setSelectedTasks(newSelection);
  };

  const toggleAllTasks = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map((t) => t.id)));
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    try {
      return format(new Date(date), "dd-MM-yyyy", { locale: nl });
    } catch {
      return "-";
    }
  };

  const isDeadlineWarning = (deadline: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isDeadlineOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    return deadlineDate < today;
  };

  const SortButton = ({ column, label }: { column: SortKey; label: string }) => (
    <Button variant="ghost" size="sm" onClick={() => handleSort(column)} className="h-8 -ml-3">
      {label}
      <ArrowUpDown className="ml-2 h-3 w-3" />
    </Button>
  );

  return (
    <div className="space-y-4">
      {selectedTasks.size > 0 && (
        <TaskBulkActions
          selectedTaskIds={Array.from(selectedTasks)}
          onSuccess={() => {
            setSelectedTasks(new Set());
            onUpdate();
          }}
        />
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onCheckedChange={toggleAllTasks}
                />
              </TableHead>
              <TableHead>
                <SortButton column="status" label="Status" />
              </TableHead>
              <TableHead>
                <SortButton column="prioriteit" label="Prioriteit" />
              </TableHead>
              <TableHead>
                <SortButton column="titel" label="Titel" />
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <SortButton column="deel_van_huis" label="Deel" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortButton column="verantwoordelijke" label="Verantwoordelijke" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortButton column="begindatum" label="Begindatum" />
              </TableHead>
              <TableHead>
                <SortButton column="deadline" label="Deadline" />
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Geen taken gevonden
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => toggleTaskSelection(task.id)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusColors[task.status]}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.prioriteit ? (
                      <Badge variant="outline" className={priorityColors[task.prioriteit]}>
                        {task.prioriteit}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">{task.titel}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {task.deel_van_huis || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {task.verantwoordelijke || <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{formatDate(task.begindatum)}</TableCell>
                  <TableCell>
                    <span
                      className={
                        isDeadlineOverdue(task.deadline)
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : isDeadlineWarning(task.deadline)
                          ? "text-orange-600 dark:text-orange-400 font-medium"
                          : ""
                      }
                    >
                      {formatDate(task.deadline)}
                    </span>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTask(task)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteTask(task)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editTask && (
        <EditTaskDialog
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          task={editTask}
          onSuccess={() => {
            setEditTask(null);
            onUpdate();
          }}
        />
      )}

      {deleteTask && (
        <DeleteConfirmationDialog
          open={!!deleteTask}
          onOpenChange={(open) => !open && setDeleteTask(null)}
          onConfirm={async () => {
            const { supabase } = await import("@/integrations/supabase/client");
            await supabase.from("tasks").delete().eq("id", deleteTask.id);
            setDeleteTask(null);
            onUpdate();
          }}
          title="Taak verwijderen"
          itemName={deleteTask.titel}
          description="Deze actie kan niet ongedaan worden gemaakt."
        />
      )}
    </div>
  );
};
