import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, ListTodo, FileText, Image, Users, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProjectOverview from "@/components/project/ProjectOverview";
import ProjectTasksWithDnd from "@/components/project/ProjectTasksWithDnd";
import ProjectContractors from "@/components/project/ProjectContractors";
import ProjectDocuments from "@/components/project/ProjectDocuments";
import ProjectPhotos from "@/components/project/ProjectPhotos";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const PublicProjectView = () => {
  const { shareToken } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-project", shareToken],
    queryFn: async () => {
      const response = await supabase.functions.invoke("get-public-project-data", {
        body: { shareToken },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to load project");
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    enabled: !!shareToken,
    retry: false,
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

  if (error || !data?.project) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertTitle>Link niet geldig</AlertTitle>
            <AlertDescription className="mt-2">
              {error?.message || "Deze link is niet meer geldig of het project bestaat niet."}
            </AlertDescription>
          </Alert>
          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              Terug naar home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { project, tasks, documents, photos, contractors, activity } = data;

  const statusConfig = {
    Gepland: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30", dot: "bg-blue-500" },
    Lopend: { color: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary" },
    Afgerond: { color: "bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30", dot: "bg-green-500" },
  };

  const currentStatus = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.Gepland;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header with read-only badge */}
      <header className="border-b bg-gradient-to-r from-card via-card/95 to-card/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
            <Badge variant="secondary" className="flex items-center gap-1.5 shrink-0">
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alleen lezen</span>
            </Badge>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 animate-fade-in">
        <Tabs defaultValue="overzicht" className="w-full">
          {/* Scrollable tabs container */}
          <div className="relative mb-4 sm:mb-6">
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none sm:hidden" />
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
            
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide relative z-10">
              <TabsList className="inline-flex w-max bg-muted/50 p-1.5 rounded-xl gap-1">
                <TabsTrigger 
                  value="overzicht" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap min-h-[40px]"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="sm:hidden">Home</span>
                  <span className="hidden sm:inline">Overzicht</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="taken" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap min-h-[40px]"
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Taken</span>
                </TabsTrigger>
                {/* No Kosten tab for public view */}
                <TabsTrigger 
                  value="documenten" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap min-h-[40px]"
                >
                  <FileText className="w-4 h-4" />
                  <span className="sm:hidden">Docs</span>
                  <span className="hidden sm:inline">Documenten</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="fotos" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap min-h-[40px]"
                >
                  <Image className="w-4 h-4" />
                  <span className="sm:hidden">Foto</span>
                  <span className="hidden sm:inline">Foto's</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="aannemers" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap min-h-[40px]"
                >
                  <Users className="w-4 h-4" />
                  <span className="sm:hidden">Team</span>
                  <span className="hidden sm:inline">Aannemers</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="overzicht" className="animate-fade-in">
            <ProjectOverview 
              project={project} 
              isAdminOrOwner={false} 
              readOnly
              publicData={{ activity }}
            />
          </TabsContent>

          <TabsContent value="taken" className="animate-fade-in">
            <ProjectTasksWithDnd 
              projectId={project.id} 
              readOnly 
              publicTasks={tasks}
            />
          </TabsContent>

          <TabsContent value="documenten" className="animate-fade-in">
            <ProjectDocuments 
              projectId={project.id} 
              isAdminOrOwner={false} 
              readOnly
              publicDocuments={documents}
            />
          </TabsContent>

          <TabsContent value="fotos" className="animate-fade-in">
            <ProjectPhotos 
              projectId={project.id} 
              readOnly
              publicPhotos={photos}
            />
          </TabsContent>

          <TabsContent value="aannemers" className="animate-fade-in">
            <ProjectContractors 
              projectId={project.id} 
              readOnly
              publicContractors={contractors}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-sm text-muted-foreground">
        <p>Dit is een alleen-lezen weergave van het project</p>
      </footer>
    </div>
  );
};

export default PublicProjectView;
