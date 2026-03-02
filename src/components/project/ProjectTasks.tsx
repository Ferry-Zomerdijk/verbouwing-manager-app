import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import CreateTaskDialog from "./CreateTaskDialog";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProjectTasksProps {
  projectId: string;
}

const ProjectTasks = ({ projectId }: ProjectTasksProps) => {
  const { t } = useLanguage();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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

  const tasksByStatus = {
    "Te doen": tasks?.filter((t) => t.status === "Te doen") || [],
    Bezig: tasks?.filter((t) => t.status === "Bezig") || [],
    Gereed: tasks?.filter((t) => t.status === "Gereed") || [],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t.tasks.title}</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          {t.tasks.buttons.new}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(tasksByStatus) as Array<keyof typeof tasksByStatus>).map((status) => (
          <Card key={status} className="shadow-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                {status}
                <span className="text-sm font-normal text-muted-foreground">
                  {tasksByStatus[status].length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasksByStatus[status].length > 0 ? (
                tasksByStatus[status].map((task) => (
                  <TaskCard key={task.id} task={task} onUpdate={refetch} />
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">
                  {t.tasks.messages.noTasks}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          refetch();
          toast.success(t.tasks.messages.created);
        }}
      />
    </div>
  );
};

export default ProjectTasks;
