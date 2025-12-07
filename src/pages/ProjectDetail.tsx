import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, UserPlus, LayoutGrid, ListTodo, Euro, FileText, Image, Users, Home } from "lucide-react";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-muted-foreground">Project laden...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <h2 className="text-2xl font-bold mb-2">Project niet gevonden</h2>
          <Button onClick={() => navigate("/dashboard")}>Terug naar Dashboard</Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    Gepland: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30", dot: "bg-blue-500" },
    Lopend: { color: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary" },
    Afgerond: { color: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30", dot: "bg-green-500" },
  };

  const currentStatus = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.Gepland;

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
      
      {/* Modern Header with Gradient */}
      <header className="border-b bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-2 hidden sm:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate("/dashboard")}
                >
                  <Home className="w-3 h-3" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium truncate max-w-[200px]">
                  {project.naam}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors" 
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 sm:gap-3">
                  <h1 className="text-lg sm:text-2xl font-bold truncate">{project.naam}</h1>
                  <Badge 
                    variant="outline" 
                    className={`${currentStatus.color} shrink-0 text-xs font-medium flex items-center gap-1.5`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`} />
                    {project.status}
                  </Badge>
                </div>
                {project.type && (
                  <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{project.type}</p>
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
                    <Button variant="outline" size="icon" className="hover:border-primary/50 transition-colors">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="animate-scale-in">
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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 animate-fade-in">
        <Tabs defaultValue="overzicht" className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6">
            {/* Modern Pill-style Tabs */}
            <TabsList className="inline-flex w-auto min-w-full sm:w-auto bg-muted/50 p-1 rounded-xl gap-1">
              <TabsTrigger 
                value="overzicht" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-xs sm:text-sm transition-all"
              >
                <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Overzicht</span>
              </TabsTrigger>
              <TabsTrigger 
                value="taken" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-xs sm:text-sm transition-all"
              >
                <ListTodo className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Taken</span>
              </TabsTrigger>
              {isAdminOrOwner && (
                <TabsTrigger 
                  value="kosten" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-xs sm:text-sm transition-all"
                >
                  <Euro className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Kosten</span>
                </TabsTrigger>
              )}
              <TabsTrigger 
                value="documenten" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-xs sm:text-sm transition-all"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Documenten</span>
              </TabsTrigger>
              <TabsTrigger 
                value="fotos" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-xs sm:text-sm transition-all"
              >
                <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Foto's</span>
              </TabsTrigger>
              <TabsTrigger 
                value="aannemers" 
                className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 py-2 text-xs sm:text-sm transition-all"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Aannemers</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overzicht" className="animate-fade-in">
            <ProjectOverview project={project} onUpdate={() => refetch()} isAdminOrOwner={isAdminOrOwner} />
          </TabsContent>

          <TabsContent value="taken" className="animate-fade-in">
            <ProjectTasksWithDnd projectId={project.id} />
          </TabsContent>

          {isAdminOrOwner && (
            <TabsContent value="kosten" className="animate-fade-in">
              <ProjectCosts projectId={project.id} totalBudget={project.totaal_begroting || 0} />
            </TabsContent>
          )}

          <TabsContent value="documenten" className="animate-fade-in">
            <ProjectDocuments projectId={project.id} isAdminOrOwner={isAdminOrOwner} />
          </TabsContent>

          <TabsContent value="fotos" className="animate-fade-in">
            <ProjectPhotos projectId={project.id} />
          </TabsContent>

          <TabsContent value="aannemers" className="animate-fade-in">
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