import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Euro, TrendingUp, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import InlineEditableField from "./InlineEditableField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface ProjectOverviewProps {
  project: any;
  onUpdate?: () => void;
}

const ProjectOverview = ({ project, onUpdate }: ProjectOverviewProps) => {
  const [statusUpdating, setStatusUpdating] = useState(false);

  const budgetPercentage = project.totaal_begroting > 0
    ? (project.werkelijke_kosten / project.totaal_begroting) * 100
    : 0;

  const handleVoortgangUpdate = async (value: string) => {
    const voortgang = parseInt(value);
    if (isNaN(voortgang) || voortgang < 0 || voortgang > 100) {
      toast.error("Voortgang moet tussen 0 en 100 zijn");
      throw new Error("Invalid value");
    }

    const { error } = await supabase
      .from("projects")
      .update({ voortgang })
      .eq("id", project.id);

    if (error) {
      toast.error("Fout bij bijwerken: " + error.message);
      throw error;
    }

    toast.success("Voortgang bijgewerkt");
    onUpdate?.();
  };

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

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Voortgang</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <InlineEditableField
              value={project.voortgang}
              onSave={handleVoortgangUpdate}
              type="number"
              displayClassName="text-2xl font-bold"
            />
            <Progress value={project.voortgang} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget Gebruikt</CardTitle>
            <Euro className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{project.werkelijke_kosten.toLocaleString("nl-NL")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              van €{project.totaal_begroting.toLocaleString("nl-NL")}
            </p>
            <Progress value={budgetPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Startdatum</CardTitle>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.startdatum
                ? format(new Date(project.startdatum), "dd MMM", { locale: nl })
                : "Niet ingesteld"}
            </div>
            {project.startdatum && (
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(project.startdatum), "yyyy", { locale: nl })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Select
              value={project.status}
              onValueChange={handleStatusUpdate}
              disabled={statusUpdating}
            >
              <SelectTrigger className="text-2xl font-bold border-none p-0 h-auto hover:text-primary transition-smooth">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Gepland">Gepland</SelectItem>
                <SelectItem value="Lopend">Lopend</SelectItem>
                <SelectItem value="Afgerond">Afgerond</SelectItem>
              </SelectContent>
            </Select>
            {project.einddatum && (
              <p className="text-xs text-muted-foreground mt-1">
                Gepland einde: {format(new Date(project.einddatum), "dd MMM yyyy", { locale: nl })}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {project.beschrijving && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Beschrijving</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.beschrijving}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProjectOverview;
