import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, FileDown, LayoutGrid, List } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import DraggableTaskCard from "./DraggableTaskCard";
import TaskCard from "./TaskCard";
import CreateTaskDialog from "./CreateTaskDialog";
import ImportTasksDialog from "./ImportTasksDialog";
import { ExportTasksDialog } from "./ExportTasksDialog";
import { ExportTask } from "@/lib/excelImport";
import { toast } from "sonner";
import { TaskFilters, TaskFiltersType } from "./TaskFilters";
import { TaskListView } from "./TaskListView";

interface ProjectTasksWithDndProps {
  projectId: string;
}

const STORAGE_KEYS = {
  VIEW_MODE: "tasks-view-mode",
  FILTERS: "tasks-filters",
};

const ProjectTasksWithDnd = ({ projectId }: ProjectTasksWithDndProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (saved as "kanban" | "list") || "kanban";
  });
  const [filters, setFilters] = useState<TaskFiltersType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FILTERS);
    return saved
      ? JSON.parse(saved)
      : {
          search: "",
          statuses: ["Te doen", "Bezig", "Gereed"],
          priorities: ["Laag", "Middel", "Hoog"],
          verantwoordelijke: null,
          deelVanHuis: null,
          begindatumVan: null,
          begindatumTot: null,
          deadlineVan: null,
          deadlineTot: null,
        };
  });
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: tasks, refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, begindatum, deel_van_huis")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
  });

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
  }, [filters]);

  // Get unique values for filter dropdowns
  const availableVerantwoordelijken = useMemo(() => {
    const unique = new Set(tasks?.map((t) => t.verantwoordelijke).filter(Boolean) || []);
    return Array.from(unique).sort();
  }, [tasks]);

  const availableDelenVanHuis = useMemo(() => {
    const unique = new Set(tasks?.map((t) => t.deel_van_huis).filter(Boolean) || []);
    return Array.from(unique).sort();
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    return tasks.filter((task) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesTitle = task.titel?.toLowerCase().includes(searchLower);
        const matchesDescription = task.beschrijving?.toLowerCase().includes(searchLower);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Status filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(task.status || "")) {
        return false;
      }

      // Priority filter
      if (
        filters.priorities.length > 0 &&
        task.prioriteit &&
        !filters.priorities.includes(task.prioriteit)
      ) {
        return false;
      }

      // Verantwoordelijke filter
      if (filters.verantwoordelijke === "none" && task.verantwoordelijke) {
        return false;
      }
      if (
        filters.verantwoordelijke &&
        filters.verantwoordelijke !== "none" &&
        task.verantwoordelijke !== filters.verantwoordelijke
      ) {
        return false;
      }

      // Deel van huis filter
      if (filters.deelVanHuis === "none" && task.deel_van_huis) {
        return false;
      }
      if (
        filters.deelVanHuis &&
        filters.deelVanHuis !== "none" &&
        task.deel_van_huis !== filters.deelVanHuis
      ) {
        return false;
      }

      // Begindatum range filter
      if (filters.begindatumVan && task.begindatum) {
        if (new Date(task.begindatum) < new Date(filters.begindatumVan)) return false;
      }
      if (filters.begindatumTot && task.begindatum) {
        if (new Date(task.begindatum) > new Date(filters.begindatumTot)) return false;
      }

      // Deadline range filter
      if (filters.deadlineVan && task.deadline) {
        if (new Date(task.deadline) < new Date(filters.deadlineVan)) return false;
      }
      if (filters.deadlineTot && task.deadline) {
        if (new Date(task.deadline) > new Date(filters.deadlineTot)) return false;
      }

      return true;
    });
  }, [tasks, filters]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statuses.length < 3) count++;
    if (filters.priorities.length < 3) count++;
    if (filters.verantwoordelijke) count++;
    if (filters.deelVanHuis) count++;
    if (filters.begindatumVan || filters.begindatumTot) count++;
    if (filters.deadlineVan || filters.deadlineTot) count++;
    return count;
  }, [filters]);

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: "Te doen" | "Bezig" | "Gereed" }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      
      queryClient.setQueryData(["tasks", projectId], (old: any) =>
        old?.map((task: any) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
      toast.error("Fout bij bijwerken van taak status");
    },
    onSuccess: () => {
      toast.success("Taak status bijgewerkt");
    },
  });

  const tasksByStatus = {
    "Te doen": filteredTasks?.filter((t) => t.status === "Te doen") || [],
    Bezig: filteredTasks?.filter((t) => t.status === "Bezig") || [],
    Gereed: filteredTasks?.filter((t) => t.status === "Gereed") || [],
  };

  const handleDragStart = (event: any) => {
    const task = filteredTasks?.find((t) => t.id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = filteredTasks?.find((t) => t.id === taskId);
    
    if (!task) return;

    const newStatus = over.id as "Te doen" | "Bezig" | "Gereed";
    
    if (task.status !== newStatus) {
      updateTaskStatus.mutate({ taskId, newStatus });
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  const toggleViewMode = (mode: "kanban" | "list") => {
    setViewMode(mode);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Taken</h2>
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 border border-border rounded-md p-1">
            <Button
              variant={viewMode === "kanban" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleViewMode("kanban")}
              className="h-8"
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              Kanban
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => toggleViewMode("list")}
              className="h-8"
            >
              <List className="w-4 h-4 mr-2" />
              Lijst
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
            <FileDown className="w-4 h-4 mr-2" />
            Exporteren
          </Button>
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importeren
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Taak
          </Button>
        </div>
      </div>

      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableVerantwoordelijken={availableVerantwoordelijken}
        availableDelenVanHuis={availableDelenVanHuis}
        activeCount={activeFiltersCount}
      />

      {viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(Object.keys(tasksByStatus) as Array<keyof typeof tasksByStatus>).map((status) => (
              <SortableContext
                key={status}
                id={status}
                items={tasksByStatus[status].map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      {status}
                      <span className="text-sm font-normal text-muted-foreground">
                        {tasksByStatus[status].length}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent
                    className="space-y-3 min-h-[200px] p-4"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (activeTask && activeTask.status !== status) {
                        updateTaskStatus.mutate({
                          taskId: activeTask.id,
                          newStatus: status,
                        });
                      }
                    }}
                  >
                    {tasksByStatus[status].length > 0 ? (
                      tasksByStatus[status].map((task) => (
                        <DraggableTaskCard key={task.id} task={task} onUpdate={refetch} />
                      ))
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        Sleep taken hierheen
                      </p>
                    )}
                  </CardContent>
                </Card>
              </SortableContext>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} onUpdate={() => {}} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskListView tasks={filteredTasks} onUpdate={refetch} />
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          refetch();
          toast.success("Taak succesvol aangemaakt!");
        }}
      />

      <ImportTasksDialog 
        open={importDialogOpen} 
        onOpenChange={setImportDialogOpen}
        projectId={projectId}
      />
      
      <ExportTasksDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        tasks={(tasks || []).map(task => ({
          begindatum: (task as any).begindatum || null,
          deadline: task.deadline || null,
          deel_van_huis: (task as any).deel_van_huis || null,
          titel: task.titel,
          verantwoordelijke: task.verantwoordelijke || null,
          status: task.status,
          beschrijving: task.beschrijving || null
        } as ExportTask))}
        projectName={project?.naam || 'project'}
      />
    </div>
  );
};

export default ProjectTasksWithDnd;
