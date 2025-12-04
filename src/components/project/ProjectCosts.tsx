import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Euro, Download, MoreVertical, Edit, Trash2, Filter, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
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

const CATEGORY_CHART_COLORS: Record<string, string> = {
  Materiaal: "#3b82f6",
  Arbeid: "#a855f7",
  Vergunningen: "#f97316",
  Kluswerkzaamheden: "#22c55e",
  Decoratie: "#ec4899",
  Meubels: "#f59e0b",
  Overig: "#6b7280"
};

const STATUS_CHART_COLORS: Record<string, string> = {
  Schatting: "#94a3b8",
  Offerte: "#60a5fa",
  Factuur: "#22c55e"
};
const ProjectCosts = ({
  projectId
}: ProjectCostsProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deelVanHuisFilter, setDeelVanHuisFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
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

  // Get unique "deel van huis" values for filter
  const uniqueDeelVanHuis = useMemo(() => {
    if (!costs) return [];
    const values = costs
      .map(c => c.deel_van_huis)
      .filter((v): v is string => !!v);
    return [...new Set(values)].sort();
  }, [costs]);

  // Filter costs based on selected filters
  const filteredCosts = useMemo(() => {
    if (!costs) return [];
    return costs.filter(cost => {
      const matchCategory = categoryFilter === "all" || cost.categorie === categoryFilter;
      const matchDeelVanHuis = deelVanHuisFilter === "all" || cost.deel_van_huis === deelVanHuisFilter;
      const matchStatus = statusFilter === "all" || cost.status === statusFilter;
      return matchCategory && matchDeelVanHuis && matchStatus;
    });
  }, [costs, categoryFilter, deelVanHuisFilter, statusFilter]);

  const hasActiveFilters = categoryFilter !== "all" || deelVanHuisFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setCategoryFilter("all");
    setDeelVanHuisFilter("all");
    setStatusFilter("all");
  };
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
  const totalCosts = filteredCosts.reduce((sum, cost) => sum + parseFloat(cost.bedrag.toString()), 0);
  const costsByCategory = filteredCosts.reduce((acc, cost) => {
    const category = cost.categorie;
    if (!acc[category]) acc[category] = 0;
    acc[category] += parseFloat(cost.bedrag.toString());
    return acc;
  }, {} as Record<string, number>);

  // Chart data
  const categoryChartData = useMemo(() => {
    return Object.entries(costsByCategory).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_CHART_COLORS[name] || "#6b7280"
    }));
  }, [costsByCategory]);

  const statusChartData = useMemo(() => {
    const byStatus = filteredCosts.reduce((acc, cost) => {
      const status = cost.status || "Schatting";
      if (!acc[status]) acc[status] = 0;
      acc[status] += parseFloat(cost.bedrag.toString());
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(byStatus).map(([name, value]) => ({
      name,
      value,
      fill: STATUS_CHART_COLORS[name] || "#6b7280"
    }));
  }, [filteredCosts]);
  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kosten</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Kostenpost
        </Button>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle categorieën</SelectItem>
                <SelectItem value="Materiaal">Materiaal</SelectItem>
                <SelectItem value="Arbeid">Arbeid</SelectItem>
                <SelectItem value="Vergunningen">Vergunningen</SelectItem>
                <SelectItem value="Kluswerkzaamheden">Kluswerkzaamheden</SelectItem>
                <SelectItem value="Decoratie">Decoratie</SelectItem>
                <SelectItem value="Meubels">Meubels</SelectItem>
                <SelectItem value="Overig">Overig</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deelVanHuisFilter} onValueChange={setDeelVanHuisFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Deel van huis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle delen</SelectItem>
                {uniqueDeelVanHuis.map(deel => (
                  <SelectItem key={deel} value={deel}>{deel}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="Schatting">Schatting</SelectItem>
                <SelectItem value="Offerte">Offerte</SelectItem>
                <SelectItem value="Factuur">Factuur</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Wis filters
              </Button>
            )}

            {hasActiveFilters && (
              <span className="text-sm text-muted-foreground ml-auto">
                {filteredCosts.length} van {costs?.length || 0} resultaten
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      {filteredCosts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Kosten per Categorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString("nl-NL")}`, "Bedrag"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Kosten per Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusChartData} layout="vertical">
                    <XAxis type="number" tickFormatter={(value) => `€${value.toLocaleString("nl-NL")}`} />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString("nl-NL")}`, "Bedrag"]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          {filteredCosts.length > 0 ? <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Status</TableHead>
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
                {filteredCosts.map(cost => <TableRow key={cost.id}>
                    <TableCell>
                      {format(new Date(cost.datum), "dd MMM yyyy", {
                  locale: nl
                })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={cost.status === "Factuur" ? "default" : cost.status === "Offerte" ? "secondary" : "outline"}>
                        {cost.status}
                      </Badge>
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