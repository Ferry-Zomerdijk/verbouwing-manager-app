import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Home, LogOut, Keyboard, Settings, Users, ChevronDown, AlertCircle, RefreshCw, Crown, Mail, Smartphone, X, Globe } from "lucide-react";
import { PwaInstallButton } from "@/components/PwaInstallButton";
import CoffeeBreakTimer from "@/components/CoffeeBreakTimer";
import WeatherExcuseButton from "@/components/WeatherExcuseButton";
import { getRandomWisdom, emptyStateMessages } from "@/lib/builderJokes";
import ProjectCard from "@/components/ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import { toast } from "sonner";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import AccountSettingsDialog from "@/components/AccountSettingsDialog";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ContactMessagesDialog } from "@/components/ContactMessagesDialog";
import AiUsageWidget from "@/components/AiUsageWidget";
import TodayAttendanceWidget from "@/components/TodayAttendanceWidget";
import { useLanguage } from "@/contexts/LanguageContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { language, setLanguage, t } = useLanguage();
  const { currentTier, limits } = useSubscription();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [contactMessagesOpen, setContactMessagesOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(() => {
    return localStorage.getItem('upgradeBannerDismissed') !== 'true';
  });
  const [userInfo, setUserInfo] = useState<{ naam: string | null; email: string | null; isAdmin: boolean }>({
    naam: null,
    email: null,
    isAdmin: false,
  });

  const handleDismissUpgradeBanner = () => {
    setShowUpgradeBanner(false);
    localStorage.setItem('upgradeBannerDismissed', 'true');
  };

  // Reset upgrade banner when user downgrades from Pro
  useEffect(() => {
    const previousTier = localStorage.getItem('previousSubscriptionTier');
    
    // If user had Pro and now has Basis or Free, reset the banner
    if (previousTier === 'pro' && (currentTier === 'basis' || currentTier === 'free')) {
      localStorage.removeItem('upgradeBannerDismissed');
      setShowUpgradeBanner(true);
    }
    // If user had Basis and now has Free, also reset the banner
    if (previousTier === 'basis' && currentTier === 'free') {
      localStorage.removeItem('upgradeBannerDismissed');
      setShowUpgradeBanner(true);
    }
    
    // Store current tier for next comparison
    localStorage.setItem('previousSubscriptionTier', currentTier);
  }, [currentTier]);

  // Load user info and check onboarding status
  useEffect(() => {
    const loadUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("naam, onboarding_completed")
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

        // Show onboarding if not completed
        if (profile && !profile.onboarding_completed) {
          setShowOnboarding(true);
        }
      }
    };
    loadUserInfo();
  }, []);

  const handleOnboardingComplete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", user.id);
    }
    setShowOnboarding(false);
    toast.success("Welkom! Je bent klaar om te beginnen.");
  };

  useKeyboardShortcuts([
    {
      key: "n",
      ctrlKey: true,
      callback: () => setCreateDialogOpen(true),
    },
    {
      key: "?",
      shiftKey: true,
      callback: () => setShortcutsDialogOpen(true),
    },
    {
      key: "1",
      altKey: true,
      callback: () => setFilter("all"),
    },
    {
      key: "2",
      altKey: true,
      callback: () => setFilter("Lopend"),
    },
    {
      key: "3",
      altKey: true,
      callback: () => setFilter("Gepland"),
    },
    {
      key: "4",
      altKey: true,
      callback: () => setFilter("Afgerond"),
    },
  ]);

  const { data: projects, isLoading, error, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldTrigger,
  } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const filteredProjects = projects?.filter((project) => {
    if (filter === "all") return true;
    return project.status === filter;
  });

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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold">De Renovatie App</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Jouw renovatieprojecten</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <CoffeeBreakTimer />
                <WeatherExcuseButton />
              </div>
              <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary" size="sm">
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nieuw Project</span>
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShortcutsDialogOpen(true)} className="hidden sm:flex">
                <Keyboard className="w-4 h-4" />
              </Button>
              <PwaInstallButton />
              
              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                    <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {userInfo.naam ? userInfo.naam[0].toUpperCase() : userInfo.email?.[0].toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-24 truncate">
                      {userInfo.naam || userInfo.email?.split("@")[0] || "Account"}
                    </span>
                    <ChevronDown className="w-4 h-4 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-popover">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{userInfo.naam || "Onbekend"}</p>
                    <p className="text-xs text-muted-foreground">{userInfo.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAccountDialogOpen(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t.navigation.settings}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLanguage(language === 'nl' ? 'en' : 'nl')}>
                    <Globe className="w-4 h-4 mr-2" />
                    {language === 'nl' ? '🇬🇧 English' : '🇳🇱 Nederlands'}
                  </DropdownMenuItem>
                  {userInfo.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate("/users")}>
                        <Users className="w-4 h-4 mr-2" />
                        Gebruikers Beheren
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setContactMessagesOpen(true)}>
                        <Mail className="w-4 h-4 mr-2" />
                        Contactberichten
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate("/app-store-screenshots")}>
                        <Smartphone className="w-4 h-4 mr-2" />
                        App Store Screenshots
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t.navigation.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* AI Usage Widget & Upgrade Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <AiUsageWidget />
          <TodayAttendanceWidget />
          
          {/* Upgrade Banner for Free and Basis Users */}
          {(currentTier === "free" || currentTier === "basis") && showUpgradeBanner && (
            <div className="sm:col-span-1 lg:col-span-2 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 relative">
              <button 
                onClick={handleDismissUpgradeBanner}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Sluiten"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 h-full pr-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {currentTier === "free" ? "Upgrade naar Basis of Pro" : "Upgrade naar Pro"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentTier === "free" 
                        ? "Krijg toegang tot meer projecten, AI factuurscanning en extra features"
                        : "Krijg onbeperkte projecten, prioriteit support en alle premium features"
                      }
                    </p>
                  </div>
                </div>
                <Button onClick={() => navigate("/pricing")} className="gradient-primary shrink-0">
                  Bekijk plannen
                </Button>
              </div>
            </div>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6">
            <TabsList className="inline-flex w-auto min-w-full sm:w-auto">
              <TabsTrigger value="all" className="text-xs sm:text-sm">Alle</TabsTrigger>
              <TabsTrigger value="Lopend" className="text-xs sm:text-sm">Lopend</TabsTrigger>
              <TabsTrigger value="Gepland" className="text-xs sm:text-sm">Gepland</TabsTrigger>
              <TabsTrigger value="Afgerond" className="text-xs sm:text-sm">Afgerond</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={filter}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Fout bij laden projecten</h3>
                <p className="text-muted-foreground mb-4">
                  Er is een probleem met de verbinding naar de database. Probeer het opnieuw.
                </p>
                <Button onClick={() => refetch()} className="gradient-primary">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Opnieuw proberen
                </Button>
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} onUpdate={refetch} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent flex items-center justify-center">
                  <Home className="w-8 h-8 text-accent-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Geen projecten gevonden</h3>
                <p className="text-muted-foreground mb-2">
                  {emptyStateMessages.projects.noProjects}
                </p>
                <p className="text-xs text-muted-foreground italic mb-4">
                  💡 "{getRandomWisdom()}"
                </p>
                <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Nieuw Project
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <CreateProjectDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refetch();
          toast.success("Project succesvol aangemaakt!");
        }}
      />

      <Dialog open={shortcutsDialogOpen} onOpenChange={setShortcutsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Toetsenbord Sneltoetsen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Nieuw project</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + N</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Sneltoetsen tonen</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Shift + ?</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Filter: Alle projecten</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + 1</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Filter: Lopend</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + 2</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Filter: Gepland</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + 3</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Filter: Afgerond</span>
              <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + 4</kbd>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AccountSettingsDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        onRestartOnboarding={() => setShowOnboarding(true)}
      />

      <OnboardingModal
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      <ContactMessagesDialog
        open={contactMessagesOpen}
        onOpenChange={setContactMessagesOpen}
      />
    </div>
  );
};

export default Dashboard;
