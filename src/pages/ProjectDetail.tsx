import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useCallback } from "react";
import CoffeeBreakTimer from "@/components/CoffeeBreakTimer";
import WeatherExcuseButton from "@/components/WeatherExcuseButton";
import ProjectOverview from "@/components/project/ProjectOverview";
import ProjectTasksWithDnd from "@/components/project/ProjectTasksWithDnd";
import ProjectCosts from "@/components/project/ProjectCosts";
import ProjectContractors from "@/components/project/ProjectContractors";
import ProjectDocuments from "@/components/project/ProjectDocuments";
import ProjectPhotos from "@/components/project/ProjectPhotos";
import { ProjectUsersManager } from "@/components/project/ProjectUsersManager";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { useIsMobile } from "@/hooks/use-mobile";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usersManagerOpen, setUsersManagerOpen] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: isAdminOrOwner } = useQuery({
    queryKey: ['user-admin-or-owner', project?.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !project) return false;

      if (project.user_id === user.id) return true;

      const { data } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      return data || false;
    },
    enabled: !!project,
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([
      refetch(),
      queryClient.invalidateQueries({ queryKey: ['tasks', id] }),
      queryClient.invalidateQueries({ queryKey: ['costs', id] }),
      queryClient.invalidateQueries({ queryKey: ['contractors', id] }),
      queryClient.invalidateQueries({ queryKey: ['documents', id] }),
      queryClient.invalidateQueries({ queryKey: ['photos', id] }),
    ]);
  }, [refetch, queryClient, id]);

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldTrigger,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-muted-foreground">Project laden...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project niet gevonden</h2>
          <Button onClick={() => navigate("/dashboard")}>Terug naar Dashboard</Button>
        </div>
      </div>
    );
  }

  const statusColors = {
    Gepland: "bg-blue-500",
    Lopend: "bg-primary",
    Afgerond: "bg-green-600",
  };

  return (
    <div ref={isMobile ? containerRef : undefined} className="min-h-screen bg-gradient-subtle relative">
      {isMobile && (
        <PullToRefreshIndicator
          pullDistance={pullDistance}
          isRefreshing={isRefreshing}
          progress={progress}
          shouldTrigger={shouldTrigger}
        />
      )}
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">{project.naam}</h1>
                  <Badge className={`${statusColors[project.status as keyof typeof statusColors]} text-white shrink-0 text-xs`}>
                    {project.status}
                  </Badge>
                </div>
                {project.type && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.type}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <div className="flex items-center gap-1 sm:gap-2">
                <WeatherExcuseButton />
                <CoffeeBreakTimer />
              </div>
              {isAdminOrOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setUsersManagerOpen(true)}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Gebruikers Beheren
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="overzicht" className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6">
            <TabsList className="inline-flex w-auto min-w-full sm:w-auto">
              <TabsTrigger value="overzicht" className="text-xs sm:text-sm">Overzicht</TabsTrigger>
              <TabsTrigger value="taken" className="text-xs sm:text-sm">Taken</TabsTrigger>
              {isAdminOrOwner && <TabsTrigger value="kosten" className="text-xs sm:text-sm">Kosten</TabsTrigger>}
              <TabsTrigger value="documenten" className="text-xs sm:text-sm">Documenten</TabsTrigger>
              <TabsTrigger value="fotos" className="text-xs sm:text-sm">Foto's</TabsTrigger>
              <TabsTrigger value="aannemers" className="text-xs sm:text-sm">Aannemers</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overzicht">
            <ProjectOverview project={project} onUpdate={() => refetch()} isAdminOrOwner={isAdminOrOwner} />
          </TabsContent>

          <TabsContent value="taken">
            <ProjectTasksWithDnd projectId={project.id} />
          </TabsContent>

          {isAdminOrOwner && (
            <TabsContent value="kosten">
              <ProjectCosts projectId={project.id} totalBudget={project.totaal_begroting || 0} />
            </TabsContent>
          )}

          <TabsContent value="documenten">
            <ProjectDocuments projectId={project.id} isAdminOrOwner={isAdminOrOwner} />
          </TabsContent>

          <TabsContent value="fotos">
            <ProjectPhotos projectId={project.id} />
          </TabsContent>

          <TabsContent value="aannemers">
            <ProjectContractors projectId={project.id} />
          </TabsContent>
        </Tabs>
      </main>

      <ProjectUsersManager
        open={usersManagerOpen}
        onOpenChange={setUsersManagerOpen}
        projectId={id!}
      />
    </div>
  );
};

export default ProjectDetail;
