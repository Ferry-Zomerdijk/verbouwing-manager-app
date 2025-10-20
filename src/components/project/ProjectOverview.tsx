import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, Euro, TrendingUp, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ProjectOverviewProps {
  project: any;
}

const ProjectOverview = ({ project }: ProjectOverviewProps) => {
  const budgetPercentage = project.totaal_begroting > 0
    ? (project.werkelijke_kosten / project.totaal_begroting) * 100
    : 0;

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
            <div className="text-2xl font-bold">{project.voortgang}%</div>
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
            <div className="text-2xl font-bold">{project.status}</div>
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
