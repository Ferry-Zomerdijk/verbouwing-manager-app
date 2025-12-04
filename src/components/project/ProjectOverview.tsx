import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Euro, TrendingUp, CheckCircle2, PartyPopper, RefreshCw } from "lucide-react";
import RecentTaskActivity from "./RecentTaskActivity";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomCompletionMessage, getRandomWisdom } from "@/lib/builderJokes";

interface ProjectOverviewProps {
  project: any;
  onUpdate?: () => void;
  isAdminOrOwner?: boolean;
}

const ProjectOverview = ({ project, onUpdate, isAdminOrOwner = false }: ProjectOverviewProps) => {
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [wisdom, setWisdom] = useState(getRandomWisdom());

  const refreshWisdom = () => {
    setWisdom(getRandomWisdom());
  };

  const { data: taskStats } = useQuery({
    queryKey: ['project-task-stats', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('project_id', project.id);
      
      if (error) throw error;
      
      const total = data?.length || 0;
      const completed = data?.filter(t => t.status === 'Gereed').length || 0;
      
      return { total, completed };
    },
  });

  const budgetPercentage = project.totaal_begroting > 0
    ? (project.werkelijke_kosten / project.totaal_begroting) * 100
    : 0;

  const taskPercentage = taskStats && taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  const handleStatusUpdate = async (newStatus: "Gepland" | "Lopend" | "Afgerond") => {
    setStatusUpdating(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Status bijgewerkt");
      onUpdate?.();
    } catch (error: any) {
      toast.error("Fout bij bijwerken: " + error.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className={`grid grid-cols-2 ${isAdminOrOwner ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
        <Card className={`shadow-card ${taskPercentage === 100 && taskStats && taskStats.total > 0 ? 'bg-green-500/10 border-green-500/30' : ''}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Voortgang</CardTitle>
            {taskPercentage === 100 && taskStats && taskStats.total > 0 ? (
              <PartyPopper className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 animate-bounce" />
            ) : (
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${taskPercentage === 100 && taskStats && taskStats.total > 0 ? 'text-green-700' : ''}`}>
              {taskPercentage}%
            </div>
            <Progress value={taskPercentage} className="mt-2" />
            {taskStats && taskStats.total > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2">
                {taskPercentage === 100 
                  ? "🎉 Alles af!"
                  : `${taskStats.completed}/${taskStats.total} gereed`}
              </p>
            )}
          </CardContent>
        </Card>

        {isAdminOrOwner && (
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
              <CardTitle className="text-xs sm:text-sm font-medium">Budget</CardTitle>
              <Euro className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                €{project.werkelijke_kosten.toLocaleString("nl-NL")}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                van €{project.totaal_begroting.toLocaleString("nl-NL")}
              </p>
              <Progress value={budgetPercentage} className="mt-2" />
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Startdatum</CardTitle>
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {project.startdatum
                ? format(new Date(project.startdatum), "dd MMM", { locale: nl })
                : "N/A"}
            </div>
            {project.startdatum && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                {format(new Date(project.startdatum), "yyyy", { locale: nl })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Status</CardTitle>
            <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {isAdminOrOwner ? (
              <Select
                value={project.status}
                onValueChange={handleStatusUpdate}
                disabled={statusUpdating}
              >
                <SelectTrigger className="text-xl sm:text-2xl font-bold border-none p-0 h-auto hover:text-primary transition-smooth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gepland">Gepland</SelectItem>
                  <SelectItem value="Lopend">Lopend</SelectItem>
                  <SelectItem value="Afgerond">Afgerond</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-xl sm:text-2xl font-bold">{project.status}</div>
            )}
            {project.einddatum && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                Einde: {format(new Date(project.einddatum), "dd MMM", { locale: nl })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bouwer Wijsheid */}
      <Card 
        className="shadow-card bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200/50 cursor-pointer hover:shadow-md transition-shadow"
        onClick={refreshWisdom}
      >
        <CardContent className="py-3 sm:py-4 px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">💡</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-200">
                Wijsheid van de dag
              </p>
              <p className="text-xs sm:text-sm text-amber-700/80 dark:text-amber-300/80 italic truncate sm:whitespace-normal">
                "{wisdom}"
              </p>
            </div>
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 text-amber-600/50 hover:text-amber-600 transition-colors shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Task Activity */}
      <RecentTaskActivity projectId={project.id} />
    </div>
  );
};

export default ProjectOverview;
