import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Euro, Download, MoreVertical, Trash2, Filter, X, FileSpreadsheet } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line, CartesianGrid } from "recharts";
import * as XLSX from "xlsx";
import CreateCostDialog from "./CreateCostDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { InlineEditableCell } from "./InlineEditableCell";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
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
  const updateCost = async (costId: string, updates: Partial<Database["public"]["Tables"]["costs"]["Update"]>) => {
    try {
      const { error } = await supabase
        .from("costs")
        .update(updates)
        .eq("id", costId);

      if (error) throw error;
      toast.success("Kostenpost bijgewerkt");
      refetch();
    } catch (error) {
      toast.error("Fout bij bijwerken van kostenpost");
      console.error(error);
      throw error;
    }
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

  // Time series data - costs per month
  const timeSeriesData = useMemo(() => {
    if (!filteredCosts.length) return [];
    
    const byMonth = filteredCosts.reduce((acc, cost) => {
      const monthKey = format(new Date(cost.datum), "yyyy-MM");
      if (!acc[monthKey]) {
        acc[monthKey] = { Schatting: 0, Offerte: 0, Factuur: 0, total: 0 };
      }
      const status = cost.status || "Schatting";
      const amount = parseFloat(cost.bedrag.toString());
      acc[monthKey][status] += amount;
      acc[monthKey].total += amount;
      return acc;
    }, {} as Record<string, { Schatting: number; Offerte: number; Factuur: number; total: number }>);

    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: format(new Date(month + "-01"), "MMM yyyy", { locale: nl }),
        ...data
      }));
  }, [filteredCosts]);

  const handleExportToExcel = () => {
    if (filteredCosts.length === 0) {
      toast.error("Geen kostenposten om te exporteren");
      return;
    }

    const exportData = filteredCosts.map(cost => ({
      "Datum": format(new Date(cost.datum), "dd-MM-yyyy"),
      "Status": cost.status || "Schatting",
      "Categorie": cost.categorie,
      "Deel van huis": cost.deel_van_huis || "",
      "Leverancier": cost.leverancier || "",
      "Beschrijving": cost.beschrijving || "",
      "Bedrag (€)": parseFloat(cost.bedrag.toString()),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kosten");
    
    // Auto-size columns
    const colWidths = [
      { wch: 12 }, // Datum
      { wch: 12 }, // Status
      { wch: 18 }, // Categorie
      { wch: 15 }, // Deel van huis
      { wch: 20 }, // Leverancier
      { wch: 40 }, // Beschrijving
      { wch: 12 }, // Bedrag
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `kosten-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success(`${filteredCosts.length} kostenposten geëxporteerd`);
  };

  return <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kosten</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportToExcel} disabled={filteredCosts.length === 0}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exporteer
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe Kostenpost
          </Button>
        </div>
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

      {/* Time Series Chart */}
      {timeSeriesData.length > 1 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base">Kosten over Tijd</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={(value) => `€${value.toLocaleString("nl-NL")}`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString("nl-NL")}`, ""]}
                    labelFormatter={(label) => `Maand: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Schatting" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    dot={{ fill: "#94a3b8", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Offerte" 
                    stroke="#60a5fa" 
                    strokeWidth={2}
                    dot={{ fill: "#60a5fa", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Factuur" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    dot={{ fill: "#22c55e", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
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
                      <InlineEditableCell
                        type="date"
                        value={cost.datum}
                        onSave={async (value) => {
                          await updateCost(cost.id, { datum: value || new Date().toISOString().split('T')[0] });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditableCell
                        type="select"
                        value={cost.status}
                        options={[
                          { value: "Schatting", label: "Schatting" },
                          { value: "Offerte", label: "Offerte" },
                          { value: "Factuur", label: "Factuur" }
                        ]}
                        onSave={async (value) => {
                          await updateCost(cost.id, { status: value as Database["public"]["Enums"]["cost_status"] });
                        }}
                        displayRenderer={(val) => val ? (
                          <Badge variant={val === "Factuur" ? "default" : val === "Offerte" ? "secondary" : "outline"}>
                            {val}
                          </Badge>
                        ) : null}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditableCell
                        type="select"
                        value={cost.categorie}
                        options={[
                          { value: "Materiaal", label: "Materiaal" },
                          { value: "Arbeid", label: "Arbeid" },
                          { value: "Vergunningen", label: "Vergunningen" },
                          { value: "Kluswerkzaamheden", label: "Kluswerkzaamheden" },
                          { value: "Decoratie", label: "Decoratie" },
                          { value: "Meubels", label: "Meubels" },
                          { value: "Overig", label: "Overig" }
                        ]}
                        onSave={async (value) => {
                          await updateCost(cost.id, { categorie: value as Database["public"]["Enums"]["cost_category"] });
                        }}
                        displayRenderer={(val) => val ? (
                          <Badge variant="outline" className={categoryColors[val] ? `${categoryColors[val]} text-white border-0` : ""}>
                            {val}
                          </Badge>
                        ) : null}
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditableCell
                        value={cost.deel_van_huis}
                        onSave={async (value) => {
                          await updateCost(cost.id, { deel_van_huis: value });
                        }}
                        placeholder="-"
                      />
                    </TableCell>
                    <TableCell>
                      <InlineEditableCell
                        value={cost.leverancier}
                        onSave={async (value) => {
                          await updateCost(cost.id, { leverancier: value });
                        }}
                        placeholder="-"
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <InlineEditableCell
                        value={cost.beschrijving}
                        onSave={async (value) => {
                          await updateCost(cost.id, { beschrijving: value });
                        }}
                        placeholder="-"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <InlineEditableCell
                        value={cost.bedrag?.toString()}
                        onSave={async (value) => {
                          const numValue = parseFloat(value?.replace(',', '.') || '0');
                          if (isNaN(numValue)) throw new Error("Ongeldig bedrag");
                          await updateCost(cost.id, { bedrag: numValue });
                        }}
                        placeholder="0"
                        className="text-right font-semibold"
                        displayRenderer={(val) => (
                          <span className="font-semibold">€{parseFloat(val || '0').toLocaleString("nl-NL")}</span>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {cost.factuur_url ? <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(cost.factuur_url!, cost.id)}>
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

      {selectedCost && (
        <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Kosten Verwijderen" description="Dit zal ook de bijbehorende factuur verwijderen indien aanwezig." itemName={`€${parseFloat(selectedCost.bedrag.toString()).toLocaleString("nl-NL")}`} onConfirm={handleDelete} loading={deleting} />
      )}
    </div>;
};
export default ProjectCosts;