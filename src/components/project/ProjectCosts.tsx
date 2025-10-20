import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Euro } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import CreateCostDialog from "./CreateCostDialog";
import { toast } from "sonner";

interface ProjectCostsProps {
  projectId: string;
}

const categoryColors = {
  Materiaal: "bg-blue-500",
  Arbeid: "bg-purple-500",
  Vergunningen: "bg-orange-500",
  Overig: "bg-gray-500",
};

const ProjectCosts = ({ projectId }: ProjectCostsProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: costs, refetch } = useQuery({
    queryKey: ["costs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costs")
        .select("*")
        .eq("project_id", projectId)
        .order("datum", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const totalCosts = costs?.reduce((sum, cost) => sum + parseFloat(cost.bedrag.toString()), 0) || 0;

  const costsByCategory = costs?.reduce((acc, cost) => {
    const category = cost.categorie;
    if (!acc[category]) acc[category] = 0;
    acc[category] += parseFloat(cost.bedrag.toString());
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kosten</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Kostenpost
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Totaal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <Euro className="w-5 h-5" />
              {totalCosts.toLocaleString("nl-NL")}
            </div>
          </CardContent>
        </Card>

        {costsByCategory && Object.entries(costsByCategory).map(([category, amount]) => (
          <Card key={category} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                €{amount.toLocaleString("nl-NL")}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Costs Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Kostenposten</CardTitle>
        </CardHeader>
        <CardContent>
          {costs && costs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Leverancier</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell>
                      {format(new Date(cost.datum), "dd MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${categoryColors[cost.categorie as keyof typeof categoryColors]} text-white`}>
                        {cost.categorie}
                      </Badge>
                    </TableCell>
                    <TableCell>{cost.leverancier || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">
                      €{parseFloat(cost.bedrag.toString()).toLocaleString("nl-NL")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nog geen kostenposten toegevoegd
            </p>
          )}
        </CardContent>
      </Card>

      <CreateCostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          refetch();
          toast.success("Kostenpost succesvol toegevoegd!");
        }}
      />
    </div>
  );
};

export default ProjectCosts;
