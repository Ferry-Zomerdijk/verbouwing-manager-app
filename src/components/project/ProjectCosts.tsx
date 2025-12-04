import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Euro, Download, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import CreateCostDialog from "./CreateCostDialog";
import EditCostDialog from "./EditCostDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { toast } from "sonner";
interface ProjectCostsProps {
  projectId: string;
}
const categoryColors: Record<string, string> = {
  Materiaal: "bg-blue-500",
  Arbeid: "bg-purple-500",
  Vergunningen: "bg-orange-500",
  Kluswerkzaamheden: "bg-green-500",
  Decoratie: "bg-pink-500",
  Meubels: "bg-amber-500",
  Overig: "bg-gray-500"
};
const ProjectCosts = ({
  projectId
}: ProjectCostsProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const {
    data: costs,
    refetch
  } = useQuery({
    queryKey: ["costs", projectId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("costs").select("*").eq("project_id", projectId).order("datum", {
        ascending: false
      });
      if (error) throw error;
      return data;
    }
  });
  const handleDownloadInvoice = async (filePath: string, costId: string) => {
    try {
      const {
        data,
        error
      } = await supabase.storage.from('invoices').download(filePath);
      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factuur-${costId}.${filePath.split('.').pop()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Factuur gedownload");
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Fout bij downloaden factuur");
    }
  };
  const handleDelete = async () => {
    if (!selectedCost) return;
    setDeleting(true);
    try {
      // Delete invoice file if exists
      if (selectedCost.factuur_url) {
        await supabase.storage.from("invoices").remove([selectedCost.factuur_url]);
      }
      const {
        error
      } = await supabase.from("costs").delete().eq("id", selectedCost.id);
      if (error) throw error;
      toast.success("Kosten verwijderd");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
    }
  };
  const totalCosts = costs?.reduce((sum, cost) => sum + parseFloat(cost.bedrag.toString()), 0) || 0;
  const costsByCategory = costs?.reduce((acc, cost) => {
    const category = cost.categorie;
    if (!acc[category]) acc[category] = 0;
    acc[category] += parseFloat(cost.bedrag.toString());
    return acc;
  }, {} as Record<string, number>);
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kosten</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">Nieuwe factuur<Plus className="w-4 h-4 mr-2" />
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

        {costsByCategory && Object.entries(costsByCategory).map(([category, amount]) => <Card key={category} className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">
                €{amount.toLocaleString("nl-NL")}
              </div>
            </CardContent>
          </Card>)}
      </div>

      {/* Costs Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Kostenposten</CardTitle>
        </CardHeader>
        <CardContent>
          {costs && costs.length > 0 ? <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Categorie</TableHead>
                  <TableHead>Deel van huis</TableHead>
                  <TableHead>Leverancier</TableHead>
                  <TableHead>Beschrijving</TableHead>
                  <TableHead className="text-right">Bedrag</TableHead>
                  <TableHead className="w-[100px]">Factuur</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map(cost => <TableRow key={cost.id}>
                    <TableCell>
                      {format(new Date(cost.datum), "dd MMM yyyy", {
                  locale: nl
                })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cost.categorie}</Badge>
                    </TableCell>
                    <TableCell>{cost.deel_van_huis || "-"}</TableCell>
                    <TableCell>{cost.leverancier || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {(cost as any).beschrijving || "-"}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      €{parseFloat(cost.bedrag.toString()).toLocaleString("nl-NL")}
                    </TableCell>
                    <TableCell>
                      {cost.factuur_url ? <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(cost.factuur_url, cost.id)}>
                          <Download className="w-4 h-4" />
                        </Button> : <span className="text-muted-foreground text-sm">-</span>}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                      setSelectedCost(cost);
                      setEditDialogOpen(true);
                    }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                      setSelectedCost(cost);
                      setDeleteDialogOpen(true);
                    }} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>)}
              </TableBody>
            </Table> : <p className="text-center text-muted-foreground py-8">
              Nog geen kostenposten toegevoegd
            </p>}
        </CardContent>
      </Card>

      <CreateCostDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} projectId={projectId} onSuccess={() => {
      refetch();
      toast.success("Kosten succesvol toegevoegd!");
    }} />

      {selectedCost && <>
          <EditCostDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} cost={selectedCost} onSuccess={() => {
        refetch();
        toast.success("Kosten bijgewerkt!");
      }} />

          <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Kosten Verwijderen" description="Dit zal ook de bijbehorende factuur verwijderen indien aanwezig." itemName={`€${parseFloat(selectedCost.bedrag.toString()).toLocaleString("nl-NL")}`} onConfirm={handleDelete} loading={deleting} />
        </>}
    </div>;
};
export default ProjectCosts;