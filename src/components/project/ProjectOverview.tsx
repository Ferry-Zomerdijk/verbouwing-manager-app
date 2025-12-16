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
        <Card className={`shadow-sm hover:shadow-md overflow-hidden relative group transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-background via-background to-muted/20 border-border/50 ${isComplete ? 'from-green-500/5 to-green-500/10 border-green-500/30' : ''}`}>
          {/* Background decoration */}
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-primary/5 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-500" />
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-primary/3 group-hover:bg-primary/8 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Voortgang</CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-lg shadow-sm group-hover:shadow transition-shadow ${isComplete ? 'bg-green-500/15' : 'bg-primary/10'}`}>
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
          <Card className="shadow-sm hover:shadow-md overflow-hidden relative group transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-background via-background to-blue-500/5 border-border/50">
            <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 group-hover:scale-110 transition-all duration-500" />
            <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-blue-500/3 group-hover:bg-blue-500/8 transition-all duration-300" />
            <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Budget</CardTitle>
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/15 shadow-sm group-hover:shadow transition-shadow">
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
        <Card className="shadow-sm hover:shadow-md overflow-hidden relative group transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-background via-background to-indigo-500/5 border-border/50">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 group-hover:scale-110 transition-all duration-500" />
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-indigo-500/3 group-hover:bg-indigo-500/8 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Startdatum</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-500/15 shadow-sm group-hover:shadow transition-shadow">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
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
        <Card className="shadow-sm hover:shadow-md overflow-hidden relative group transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-background via-background to-emerald-500/5 border-border/50">
          <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all duration-500" />
          <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-emerald-500/3 group-hover:bg-emerald-500/8 transition-all duration-300" />
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-6 relative z-10">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Status</CardTitle>
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-500/15 shadow-sm group-hover:shadow transition-shadow">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
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
        className="shadow-sm hover:shadow-md overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group border-border/50 bg-gradient-to-br from-background via-muted/10 to-muted/30"
        onClick={refreshWisdom}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-500/3 via-transparent to-slate-500/3 dark:from-slate-400/5 dark:to-slate-400/5" />
        <CardContent className="py-3 sm:py-4 px-3 sm:px-6 relative">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
              <span className="text-lg sm:text-2xl">💡</span>
            </div>
            <div className={`flex-1 min-w-0 transition-opacity duration-150 ${wisdomAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <p className="text-xs sm:text-sm font-semibold text-foreground/90">
                Wijsheid van de dag
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground italic line-clamp-2">
                "{wisdom}"
              </p>
            </div>
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:rotate-180 transition-all duration-500 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Task Activity */}
      <RecentTaskActivity projectId={project.id} />
    </div>
  );
};

export default ProjectOverview;