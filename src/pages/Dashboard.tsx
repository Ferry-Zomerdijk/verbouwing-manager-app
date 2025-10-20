import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Home, LogOut } from "lucide-react";
import ProjectCard from "@/components/ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

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
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
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
                  <ProjectCard key={project.id} project={project} />
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
    </div>
  );
};

export default Dashboard;
