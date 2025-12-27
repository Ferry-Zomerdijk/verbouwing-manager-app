import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpDown, MoreVertical, Trash2, MessageSquare, Pencil } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import EditTaskDialog from "./EditTaskDialog";
import { TaskBulkActions } from "./TaskBulkActions";
import { InlineEditableCell } from "./InlineEditableCell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  latest_update?: string | null;
}

interface TaskListViewProps {
  tasks: Task[];
  onUpdate: () => void;
  availableDelenVanHuis?: string[];
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
  Middel: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  Laag: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
};

export const TaskListView = ({ tasks, onUpdate, availableDelenVanHuis }: TaskListViewProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("begindatum");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [deleteTask, setDeleteTask] = useState<Task | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) throw error;

      toast.success("Taak bijgewerkt");
      onUpdate();
    } catch (error: any) {
      const message =
        error?.message || error?.error_description || "Fout bij bijwerken van taak";
      toast.error(message);
      console.error("updateTask error:", error);
      throw error;
    }
  };

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
    // Parse de deadline als lokale datum (niet UTC)
    const [year, month, day] = deadline.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return diffDays <= 3 && diffDays >= 0;
  };

  const isDeadlineOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    // Parse de deadline als lokale datum (niet UTC)
    const [year, month, day] = deadline.split('-').map(Number);
    const deadlineDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
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
                <SortButton column="begindatum" label="Begindatum" />
              </TableHead>
              <TableHead>
                <SortButton column="deadline" label="Deadline" />
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
              <TableHead className="hidden xl:table-cell min-w-[150px]">
                Update
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Geen taken gevonden
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="hover:bg-muted/30"
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineEditableCell
                      type="date"
                      value={task.begindatum}
                      onSave={async (value) => {
                        // Auto-fill deadline als die leeg is
                        if (value && !task.deadline) {
                          await updateTask(task.id, { begindatum: value, deadline: value });
                        } else {
                          await updateTask(task.id, { begindatum: value });
                        }
                      }}
                      placeholder="-"
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <InlineEditableCell
                      type="date"
                      value={task.deadline}
                      onSave={async (value) => {
                        // Valideer dat deadline niet voor begindatum ligt
                        if (value && task.begindatum && value < task.begindatum) {
                          toast.error("Deadline kan niet voor begindatum liggen");
                          return;
                        }
                        await updateTask(task.id, { deadline: value });
                      }}
                      placeholder="-"
                      className={
                        isDeadlineOverdue(task.deadline)
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : isDeadlineWarning(task.deadline)
                          ? "text-orange-600 dark:text-orange-400 font-medium"
                          : ""
                      }
                    />
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.status}
                      onValueChange={(value) =>
                        updateTask(task.id, { status: value as Task["status"] })
                      }
                    >
                      <SelectTrigger className="h-8 w-32 border-none shadow-none">
                        <Badge variant="outline" className={statusColors[task.status]}>
                          {task.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Te doen">Te doen</SelectItem>
                        <SelectItem value="Bezig">Bezig</SelectItem>
                        <SelectItem value="Gereed">Gereed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.prioriteit || "none"}
                      onValueChange={(value) =>
                        updateTask(task.id, {
                          prioriteit: value === "none" ? null : (value as Task["prioriteit"]),
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-28 border-none shadow-none">
                        {task.prioriteit ? (
                          <Badge variant="outline" className={priorityColors[task.prioriteit]}>
                            {task.prioriteit}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Geen</SelectItem>
                        <SelectItem value="Hoog">Hoog</SelectItem>
                        <SelectItem value="Middel">Middel</SelectItem>
                        <SelectItem value="Laag">Laag</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => setEditTask({ ...task })}
                        className="text-left font-medium hover:underline hover:text-primary truncate max-w-xs"
                      >
                        {task.titel}
                      </button>
                      {task.beschrijving && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {task.beschrijving}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                    <InlineEditableCell
                      value={task.deel_van_huis}
                      onSave={(value) => updateTask(task.id, { deel_van_huis: value })}
                      placeholder="Deel van huis"
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell" onClick={(e) => e.stopPropagation()}>
                    <InlineEditableCell
                      value={task.verantwoordelijke}
                      onSave={(value) => updateTask(task.id, { verantwoordelijke: value })}
                      placeholder="Verantwoordelijke"
                    />
                  </TableCell>
                  <TableCell className="hidden xl:table-cell" onClick={(e) => e.stopPropagation()}>
                    {task.latest_update ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground max-w-[200px]">
                              <MessageSquare className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {task.latest_update.split("\n")[0].substring(0, 40)}
                                {task.latest_update.length > 40 ? "..." : ""}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p className="whitespace-pre-wrap">{task.latest_update}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => setEditTask({ ...task }), 10);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Details / Updates
                          </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => setDeleteTask(task), 10);
                          }}
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

      {deleteTask && (
        <DeleteConfirmationDialog
          open={!!deleteTask}
          onOpenChange={(open) => !open && setDeleteTask(null)}
          onConfirm={async () => {
            try {
              const { error } = await supabase.from("tasks").delete().eq("id", deleteTask.id);
              if (error) throw error;
              toast.success("Taak verwijderd");
              setDeleteTask(null);
              onUpdate();
            } catch (error) {
              console.error("Delete task error:", error);
              toast.error("Fout bij verwijderen van taak");
              throw error;
            }
          }}
          title="Taak verwijderen"
          itemName={deleteTask.titel}
          description="Deze actie kan niet ongedaan worden gemaakt."
        />
      )}

      {editTask && (
        <EditTaskDialog
          open={!!editTask}
          onOpenChange={(open) => !open && setEditTask(null)}
          task={editTask}
          availableDelenVanHuis={availableDelenVanHuis}
          onSuccess={() => {
            setEditTask(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
};
