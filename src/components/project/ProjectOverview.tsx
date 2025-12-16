import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Euro, TrendingUp, CheckCircle2, PartyPopper, RefreshCw, Target, Clock } from "lucide-react";
import RecentTaskActivity from "./RecentTaskActivity";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRandomWisdom } from "@/lib/builderJokes";

interface ProjectOverviewProps {
  project: any;
  onUpdate?: () => void;
  isAdminOrOwner?: boolean;
}

const ProjectOverview = ({ project, onUpdate, isAdminOrOwner = false }: ProjectOverviewProps) => {
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [wisdom, setWisdom] = useState(getRandomWisdom());
  const [wisdomAnimating, setWisdomAnimating] = useState(false);

  const refreshWisdom = () => {
    setWisdomAnimating(true);
    setTimeout(() => {
      setWisdom(getRandomWisdom());
      setWisdomAnimating(false);
    }, 150);
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

  const isComplete = taskPercentage === 100 && taskStats && taskStats.total > 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid with Modern Cards */}
      <div className={`grid grid-cols-2 ${isAdminOrOwner ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-3 sm:gap-4`}>
        
        {/* Progress Card */}
        <Card className={`shadow-card overflow-hidden relative group hover:shadow-hover transition-all duration-300 ${isComplete ? 'bg-green-500/5 border-green-500/20' : ''}`}>
          {/* Background decoration */}
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Voortgang</CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-lg ${isComplete ? 'bg-green-500/10' : 'bg-primary/10'}`}>
              {isComplete ? (
                <PartyPopper className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 animate-bounce" />
              ) : (
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 relative z-10">
            <div className={`text-2xl sm:text-3xl font-bold ${isComplete ? 'text-green-600' : ''}`}>
              {taskPercentage}%
            </div>
            <Progress value={taskPercentage} className="mt-2 h-1.5" />
            {taskStats && taskStats.total > 0 && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                {isComplete 
                  ? "🎉 Alles af!"
                  : `${taskStats.completed} van ${taskStats.total} taken gereed`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Budget Card - Only for Admin/Owner */}
        {isAdminOrOwner && (
          <Card className="shadow-card overflow-hidden relative group hover:shadow-hover transition-all duration-300">
            <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-300" />
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Budget</CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 relative z-10">
              <div className="text-2xl sm:text-3xl font-bold">
                €{project.werkelijke_kosten?.toLocaleString("nl-NL") || 0}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                van €{project.totaal_begroting?.toLocaleString("nl-NL") || 0}
              </p>
              <Progress 
                value={Math.min(budgetPercentage, 100)} 
                className={`mt-2 h-1.5 ${budgetPercentage > 100 ? '[&>div]:bg-destructive' : ''}`} 
              />
            </CardContent>
          </Card>
        )}

        {/* Start Date Card */}
        <Card className="shadow-card overflow-hidden relative group hover:shadow-hover transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Startdatum</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 relative z-10">
            <div className="text-2xl sm:text-3xl font-bold">
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

        {/* Status Card */}
        <Card className="shadow-card overflow-hidden relative group hover:shadow-hover transition-all duration-300">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-green-500/5 group-hover:bg-green-500/10 transition-colors duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Status</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0 relative z-10">
            {isAdminOrOwner ? (
              <Select
                value={project.status}
                onValueChange={handleStatusUpdate}
                disabled={statusUpdating}
              >
                <SelectTrigger className="text-2xl sm:text-3xl font-bold border-none p-0 h-auto hover:text-primary transition-colors [&>svg]:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gepland">Gepland</SelectItem>
                  <SelectItem value="Lopend">Lopend</SelectItem>
                  <SelectItem value="Afgerond">Afgerond</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="text-2xl sm:text-3xl font-bold">{project.status}</div>
            )}
            {project.einddatum && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Einde: {format(new Date(project.einddatum), "dd MMM yyyy", { locale: nl })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bouwer Wijsheid - Modern Card */}
      <Card 
        className="shadow-card overflow-hidden cursor-pointer hover:shadow-hover transition-all duration-300 group border-gray-200/50 dark:border-gray-700/50"
        onClick={refreshWisdom}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 dark:from-gray-900/30 dark:via-slate-900/20 dark:to-gray-900/30" />
        <CardContent className="py-3 sm:py-4 px-3 sm:px-6 relative">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-gray-500 to-slate-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
              <span className="text-lg sm:text-2xl">💡</span>
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-150 ${wisdomAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <p className="text-xs sm:text-sm font-semibold text-gray-800 dark:text-gray-200">
                Wijsheid van de dag
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 italic line-clamp-2">
                "{wisdom}"
              </p>
            </div>
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 group-hover:rotate-180 transition-all duration-500 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Task Activity */}
      <RecentTaskActivity projectId={project.id} />
    </div>
  );
};

export default ProjectOverview;