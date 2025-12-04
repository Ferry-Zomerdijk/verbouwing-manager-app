import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Home, LogOut, Keyboard, User, Settings, Users, ChevronDown } from "lucide-react";
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
import AdminUsersDialog from "@/components/AdminUsersDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [usersDialogOpen, setUsersDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");
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

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Home className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">HomeProject</h1>
                <p className="text-sm text-muted-foreground">Jouw renovatieprojecten</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nieuw Project
              </Button>
              <Button variant="outline" size="icon" onClick={() => setShortcutsDialogOpen(true)}>
                <Keyboard className="w-4 h-4" />
              </Button>
              
              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {userInfo.naam ? userInfo.naam[0].toUpperCase() : userInfo.email?.[0].toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline max-w-24 truncate">
                      {userInfo.naam || userInfo.email?.split("@")[0] || "Account"}
                    </span>
                    <ChevronDown className="w-4 h-4" />
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
                    Mijn Account
                  </DropdownMenuItem>
                  {userInfo.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setUsersDialogOpen(true)}>
                        <Users className="w-4 h-4 mr-2" />
                        Gebruikers Beheren
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Uitloggen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={filter} onValueChange={setFilter} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">Alle Projecten</TabsTrigger>
            <TabsTrigger value="Lopend">Lopend</TabsTrigger>
            <TabsTrigger value="Gepland">Gepland</TabsTrigger>
            <TabsTrigger value="Afgerond">Afgerond</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-card rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredProjects && filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <p className="text-muted-foreground mb-4">
                  Begin met het toevoegen van je eerste renovatieproject
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
      />

      <AdminUsersDialog
        open={usersDialogOpen}
        onOpenChange={setUsersDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
