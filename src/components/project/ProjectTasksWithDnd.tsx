import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileSpreadsheet } from "lucide-react";
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
import { toast } from "sonner";

interface ProjectTasksWithDndProps {
  projectId: string;
}

const ProjectTasksWithDnd = ({ projectId }: ProjectTasksWithDndProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [activeTask, setActiveTask] = useState<any>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: tasks, refetch } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

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
    "Te doen": tasks?.filter((t) => t.status === "Te doen") || [],
    Bezig: tasks?.filter((t) => t.status === "Bezig") || [],
    Gereed: tasks?.filter((t) => t.status === "Gereed") || [],
  };

  const handleDragStart = (event: any) => {
    const task = tasks?.find((t) => t.id === event.active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks?.find((t) => t.id === taskId);
    
    if (!task) return;

    const newStatus = over.id as "Te doen" | "Bezig" | "Gereed";
    
    if (task.status !== newStatus) {
      updateTaskStatus.mutate({ taskId, newStatus });
    }
  };

  const handleDragCancel = () => {
    setActiveTask(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Taken</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Importeren uit Excel
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Taak
          </Button>
        </div>
      </div>

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
    </div>
  );
};

export default ProjectTasksWithDnd;
