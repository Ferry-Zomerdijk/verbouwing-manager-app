import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, UserPlus, LayoutGrid, ListTodo, Euro, FileText, Image, BookUser, Users, Home, ChevronDown, LogOut, Share2, Key, CalendarDays, Globe } from "lucide-react";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useCallback, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AccountSettingsDialog from "@/components/AccountSettingsDialog";
import CoffeeBreakTimer from "@/components/CoffeeBreakTimer";
import WeatherExcuseButton from "@/components/WeatherExcuseButton";
import ProjectOverview from "@/components/project/ProjectOverview";
import ProjectTasksWithDnd from "@/components/project/ProjectTasksWithDnd";
import ProjectCosts from "@/components/project/ProjectCosts";
import ProjectContacts from "@/components/project/ProjectContacts";
import ProjectDocuments from "@/components/project/ProjectDocuments";
import ProjectPhotos from "@/components/project/ProjectPhotos";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import SharePublicLinkDialog from "@/components/SharePublicLinkDialog";
import { KeyManagement } from "@/components/admin/KeyManagement";
import ProjectAttendance from "@/components/project/ProjectAttendance";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { language, setLanguage, t } = useLanguage();
  const [userInfo, setUserInfo] = useState<{ naam: string | null; email: string | null; isAdmin: boolean }>({
    naam: null,
    email: null,
    isAdmin: false,
  });

  // Load user info
  useEffect(() => {
    const loadUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("naam")
          .eq("id", user.id)
          .maybeSingle();

        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        setUserInfo({
          naam: profile?.naam || null,
          email: user.email || null,
          isAdmin: !!adminRole,
        });
      }
    };
    loadUserInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

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
              queryClient.invalidateQueries({ queryKey: ['contacts', id] }),
              queryClient.invalidateQueries({ queryKey: ['contact-categories', id] }),
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
                <PwaInstallButton />
                {isAdminOrOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShareDialogOpen(true)}
                    className="hidden sm:flex"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Delen
                  </Button>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent/50 transition-colors px-2 sm:px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {userInfo.naam?.charAt(0)?.toUpperCase() || userInfo.email?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                      {userInfo.naam || "Gebruiker"}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 animate-scale-in">
                  <div className="px-3 py-2 border-b">
                    <p className="font-medium text-sm">{userInfo.naam || "Gebruiker"}</p>
                    <p className="text-xs text-muted-foreground truncate">{userInfo.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t.navigation.settings}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}>
                    <Globe className="w-4 h-4 mr-2" />
                    {language === 'nl' ? '🇬🇧 English' : '🇳🇱 Nederlands'}
                  </DropdownMenuItem>
                  {(userInfo.isAdmin || isAdminOrOwner) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate(`/users?project=${id}`)}>
                        <Users className="w-4 h-4 mr-2" />
                        {t.users.dialogs.projectUsersTitle}
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.navigation.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 animate-fade-in">
        <Tabs defaultValue="overzicht" className="w-full">
          {/* Scrollable tabs container with fade indicators */}
          <div className="relative mb-4 sm:mb-6">
            {/* Left fade indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent pointer-events-none sm:hidden" />
            {/* Right fade indicator */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
            
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide relative z-10">
              {/* Modern Pill-style Tabs */}
              <TabsList className="inline-flex w-max bg-muted/50 p-1.5 rounded-xl gap-1">
                <TabsTrigger 
                  value="overzicht" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="sm:hidden">Home</span>
                  <span className="hidden sm:inline">Overzicht</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="taken" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                >
                  <ListTodo className="w-4 h-4" />
                  <span>Taken</span>
                </TabsTrigger>
                {isAdminOrOwner && (
                  <TabsTrigger 
                    value="kosten" 
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                  >
                    <Euro className="w-4 h-4" />
                    <span className="sm:hidden">€</span>
                    <span className="hidden sm:inline">Kosten</span>
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="documenten" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                >
                  <FileText className="w-4 h-4" />
                  <span className="sm:hidden">Docs</span>
                  <span className="hidden sm:inline">Documenten</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="fotos" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                >
                  <Image className="w-4 h-4" />
                  <span className="sm:hidden">Foto</span>
                  <span className="hidden sm:inline">Foto's</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="contacten" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                >
                  <BookUser className="w-4 h-4" />
                  <span>Contacten</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="aanwezigheid" 
                  className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                >
                  <CalendarDays className="w-4 h-4" />
                  <span className="sm:hidden">Rooster</span>
                  <span className="hidden sm:inline">Aanwezigheid</span>
                </TabsTrigger>
                {isAdminOrOwner && (
                  <TabsTrigger 
                    value="sleutels" 
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all whitespace-nowrap active:scale-[0.98] min-h-[40px]"
                  >
                    <Key className="w-4 h-4" />
                    <span>Sleutels</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
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

          <TabsContent value="contacten" className="animate-fade-in">
            <ProjectContacts projectId={project.id} />
          </TabsContent>

          <TabsContent value="aanwezigheid" className="animate-fade-in">
            <ProjectAttendance projectId={project.id} />
          </TabsContent>

          {isAdminOrOwner && (
            <TabsContent value="sleutels" className="animate-fade-in">
              <KeyManagement projectId={project.id} />
            </TabsContent>
          )}
        </Tabs>
      </main>

      <AccountSettingsDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
      />

      <SharePublicLinkDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        projectId={project.id}
        projectName={project.naam}
      />
    </div>
  );
};

export default ProjectDetail;