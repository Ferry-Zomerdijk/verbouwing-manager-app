import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Euro, MoreVertical, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import EditProjectDialog from "./EditProjectDialog";
import DeleteConfirmationDialog from "./DeleteConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Project {
  id: string;
  naam: string;
  type?: string;
  status: string;
  startdatum?: string;
  einddatum?: string;
  beschrijving?: string;
  totaal_begroting: number;
  werkelijke_kosten: number;
  voortgang: number;
}

interface ProjectCardProps {
  project: Project;
  onUpdate: () => void;
}

const statusColors = {
  Gepland: "bg-blue-500",
  Lopend: "bg-primary",
  Afgerond: "bg-green-600",
};

const ProjectCard = ({ project, onUpdate }: ProjectCardProps) => {
  const navigate = useNavigate();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const budgetPercentage = project.totaal_begroting > 0
    ? (project.werkelijke_kosten / project.totaal_begroting) * 100
    : 0;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("projects").delete().eq("id", project.id);
      if (error) throw error;
      toast.success("Project verwijderd");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="transition-smooth hover:shadow-hover shadow-card group">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
              <CardTitle className="text-xl group-hover:text-primary transition-smooth">
                {project.naam}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${statusColors[project.status as keyof typeof statusColors]} text-white`}>
                {project.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Bewerken
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Verwijderen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {project.type && (
            <p className="text-sm text-muted-foreground">{project.type}</p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4 cursor-pointer" onClick={() => navigate(`/project/${project.id}`)}>
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Voortgang</span>
            <span className="text-sm text-muted-foreground">{project.voortgang}%</span>
          </div>
          <Progress value={project.voortgang} className="h-2" />
        </div>

        {/* Budget */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Euro className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">Budget</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              €{project.werkelijke_kosten.toLocaleString("nl-NL")}
            </span>
            <span className="text-sm text-muted-foreground">
              / €{project.totaal_begroting.toLocaleString("nl-NL")}
            </span>
          </div>
          {budgetPercentage > 90 && (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <TrendingUp className="w-3 h-3" />
              <span>{budgetPercentage.toFixed(0)}% van budget gebruikt</span>
            </div>
          )}
        </div>

        {/* Dates */}
        {(project.startdatum || project.einddatum) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>
              {project.startdatum && format(new Date(project.startdatum), "dd MMM", { locale: nl })}
              {project.startdatum && project.einddatum && " - "}
              {project.einddatum && format(new Date(project.einddatum), "dd MMM yyyy", { locale: nl })}
            </span>
          </div>
        )}
        </CardContent>
      </Card>

      <EditProjectDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        project={project}
        onSuccess={onUpdate}
      />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Project Verwijderen"
        description="Dit kan niet ongedaan worden gemaakt."
        itemName={project.naam}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
};

export default ProjectCard;
