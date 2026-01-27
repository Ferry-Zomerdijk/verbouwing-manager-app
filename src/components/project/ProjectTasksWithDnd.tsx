import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet, FileDown, LayoutGrid, List, ClipboardList } from "lucide-react";
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
import { ApplyTemplateDialog } from "./ApplyTemplateDialog";
import { ExportTask } from "@/lib/excelImport";
import { toast } from "sonner";
import { TaskFilters, TaskFiltersType } from "./TaskFilters";
import { TaskListView } from "./TaskListView";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileTaskList from "./MobileTaskList";

interface ProjectTasksWithDndProps {
  projectId: string;
  isProjectUserView?: boolean;
  readOnly?: boolean;
  publicTasks?: any[];
}

const STORAGE_KEYS = {
  VIEW_MODE: "tasks-view-mode",
  FILTERS: "tasks-filters",
};

const ProjectTasksWithDnd = ({ projectId, isProjectUserView = false, readOnly = false, publicTasks }: ProjectTasksWithDndProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">(() => {
    if (readOnly) return "kanban"; // Default for public view
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return (saved as "kanban" | "list") || "kanban";
  });
  const [filters, setFilters] = useState<TaskFiltersType>(() => {
    if (readOnly) {
      return {
        search: "",
        statuses: ["Te doen", "Bezig", "Gereed"],
        priorities: ["Laag", "Middel", "Hoog"],
        taskTypes: [],
        verantwoordelijke: null,
        deelVanHuis: null,
        begindatumVan: null,
        begindatumTot: null,
        deadlineVan: null,
        deadlineTot: null,
      };
    }
    const saved = localStorage.getItem(STORAGE_KEYS.FILTERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure taskTypes exists for backward compatibility
      if (!parsed.taskTypes) parsed.taskTypes = [];
      return parsed;
    }
    return {
      search: "",
      statuses: ["Te doen", "Bezig", "Gereed"],
      priorities: ["Laag", "Middel", "Hoog"],
      taskTypes: [],
      verantwoordelijke: null,
      deelVanHuis: null,
      begindatumVan: null,
      begindatumTot: null,
      deadlineVan: null,
      deadlineTot: null,
    };
  });
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

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
    enabled: !readOnly,
  });

  const { data: tasks, refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      // Fetch tasks with task_type join
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*, begindatum, deel_van_huis, type_id, verwachte_leverdatum, task_type:task_types(id, naam, kleur, icoon)")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (tasksError) throw tasksError;

      // Fetch latest update for each task
      const taskIds = tasksData?.map(t => t.id) || [];
      if (taskIds.length === 0) return tasksData as any[];

      const { data: updatesData } = await supabase
        .from("task_updates")
        .select("task_id, content, created_at")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });

      // Group updates by task_id and get the latest one
      const latestUpdateByTask: Record<string, string> = {};
      updatesData?.forEach(update => {
        if (!latestUpdateByTask[update.task_id]) {
          latestUpdateByTask[update.task_id] = update.content;
        }
      });

      // Merge latest_update into tasks
      return tasksData?.map(task => ({
        ...task,
        latest_update: latestUpdateByTask[task.id] || null
      })) as any[];
    },
    enabled: !readOnly,
  });

  // Fetch task types for filtering
  const { data: taskTypes = [] } = useQuery({
    queryKey: ["task-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_types")
        .select("id, naam, kleur, icoon")
        .order("volgorde", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Use public tasks in readOnly mode
  const displayTasks = readOnly && publicTasks ? publicTasks : tasks;

  const { data: userRole } = useQuery({
    queryKey: ['user-role', projectId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: isAdmin } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (isAdmin) return 'admin';

      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (project?.user_id === user.id) return 'owner';

      return 'project_user';
    },
    enabled: !isProjectUserView && !readOnly,
  });

  const canDelete = readOnly ? false : (userRole === 'admin' || userRole === 'owner');
  const canImportExport = readOnly ? false : (userRole === 'admin' || userRole === 'owner');

  // Save preferences to localStorage (only when not in readOnly mode)
  useEffect(() => {
    if (!readOnly) {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
    }
  }, [viewMode, readOnly]);

  useEffect(() => {
    if (!readOnly) {
      localStorage.setItem(STORAGE_KEYS.FILTERS, JSON.stringify(filters));
    }
  }, [filters, readOnly]);

  // Get unique values for filter dropdowns
  const availableVerantwoordelijken = useMemo(() => {
    const unique = new Set(displayTasks?.map((t) => t.verantwoordelijke).filter(Boolean) || []);
    return Array.from(unique).sort();
  }, [displayTasks]);

  const availableDelenVanHuis = useMemo(() => {
    const unique = new Set(displayTasks?.map((t) => t.deel_van_huis).filter(Boolean) || []);
    return Array.from(unique).sort();
  }, [displayTasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!displayTasks) return [];

    return displayTasks.filter((task) => {
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

      // Verantwoordelijke filter - partial match
      if (filters.verantwoordelijke) {
        const searchTerm = filters.verantwoordelijke.toLowerCase();
        const taskVerantwoordelijke = task.verantwoordelijke?.toLowerCase() || "";
        if (!taskVerantwoordelijke.includes(searchTerm)) {
          return false;
        }
      }

      // Deel van huis filter - partial match
      if (filters.deelVanHuis) {
        const searchTerm = filters.deelVanHuis.toLowerCase();
        const taskDeelVanHuis = task.deel_van_huis?.toLowerCase() || "";
        if (!taskDeelVanHuis.includes(searchTerm)) {
          return false;
        }
      }

      // Begindatum range filter
      if (filters.begindatumVan && task.begindatum) {
        if (new Date(task.begindatum) < new Date(filters.begindatumVan)) return false;
      }
      if (filters.begindatumTot && task.begindatum) {
        if (new Date(task.begindatum) > new Date(filters.begindatumTot)) return false;
      }

      // Task type filter
      if (filters.taskTypes.length > 0 && !filters.taskTypes.includes(task.type_id || "")) {
        return false;
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
  }, [displayTasks, filters]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.statuses.length < 3) count++;
    if (filters.priorities.length < 3) count++;
    if (filters.taskTypes.length > 0) count++;
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
    if (readOnly) return;
    const task = filteredTasks?.find((t) => t.id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (readOnly || !over) return;

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

  // Mobile view
  if (isMobile) {
    return (
      <>
        <MobileTaskList
          tasks={displayTasks || []}
          projectId={projectId}
          onUpdate={readOnly ? () => {} : refetch}
          canDelete={canDelete}
          onCreateTask={readOnly ? undefined : () => setCreateDialogOpen(true)}
          availableDelenVanHuis={availableDelenVanHuis}
          availableTaskTypes={taskTypes}
          readOnly={readOnly}
        />
        
        {!readOnly && (
          <CreateTaskDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            projectId={projectId}
            availableDelenVanHuis={availableDelenVanHuis}
            onSuccess={() => {
              refetch();
              toast.success("Taak succesvol aangemaakt!");
            }}
          />
        )}
      </>
    );
  }

  // Desktop view
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
          {!readOnly && !isProjectUserView && canImportExport && (
            <>
              <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(true)}>
                <ClipboardList className="w-4 h-4 mr-2" />
                Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                <FileDown className="w-4 h-4 mr-2" />
                Exporteren
              </Button>
              <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Importeren
              </Button>
            </>
          )}
          {!readOnly && (
          <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe taak
          </Button>
          )}
        </div>
      </div>

      <TaskFilters
        filters={filters}
        onFiltersChange={setFilters}
        availableVerantwoordelijken={availableVerantwoordelijken}
        availableDelenVanHuis={availableDelenVanHuis}
        availableTaskTypes={taskTypes}
        activeCount={activeFiltersCount}
      />

      {viewMode === "kanban" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
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
                        <DraggableTaskCard key={task.id} task={task} onUpdate={refetch} canDelete={canDelete} availableDelenVanHuis={availableDelenVanHuis} />
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
            {activeTask ? <TaskCard task={activeTask} onUpdate={() => {}} canDelete={canDelete} availableDelenVanHuis={availableDelenVanHuis} /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <TaskListView tasks={filteredTasks} onUpdate={refetch} availableDelenVanHuis={availableDelenVanHuis} />
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        availableDelenVanHuis={availableDelenVanHuis}
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

      <ApplyTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        projectId={projectId}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default ProjectTasksWithDnd;
