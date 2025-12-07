import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Euro, Download, MoreVertical, Trash2, Filter, X, FileSpreadsheet, Search, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, CartesianGrid, ReferenceLine } from "recharts";
import * as XLSX from "xlsx";
import CreateCostDialog from "./CreateCostDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import EditCostDialog from "./EditCostDialog";
import { InlineEditableCell } from "./InlineEditableCell";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileCostList from "./MobileCostList";
import type { Database } from "@/integrations/supabase/types";

interface ProjectCostsProps {
  projectId: string;
  totalBudget?: number;
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
  projectId,
  totalBudget = 0
}: ProjectCostsProps) => {
  const isMobile = useIsMobile();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCost, setSelectedCost] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [deelVanHuisFilter, setDeelVanHuisFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
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

  // Fetch deel_van_huis values from tasks
  const { data: tasks } = useQuery({
    queryKey: ["tasks-deel-van-huis", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("deel_van_huis")
        .eq("project_id", projectId);
      if (error) throw error;
      return data;
    }
  });

  // Get unique "deel van huis" values combining tasks and costs
  const availableDelenVanHuis = useMemo(() => {
    const taskValues = tasks?.map(t => t.deel_van_huis).filter((v): v is string => !!v) || [];
    const costValues = costs?.map(c => c.deel_van_huis).filter((v): v is string => !!v) || [];
    return [...new Set([...taskValues, ...costValues])].sort();
  }, [tasks, costs]);

  // Filter costs based on selected filters and search query
  const filteredCosts = useMemo(() => {
    if (!costs) return [];
    return costs.filter(cost => {
      const matchCategory = categoryFilter === "all" || cost.categorie === categoryFilter;
      const matchDeelVanHuis = deelVanHuisFilter === "all" || cost.deel_van_huis === deelVanHuisFilter;
      const matchStatus = statusFilter === "all" || cost.status === statusFilter;
      
      // Search filter - search across all text fields
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || [
        cost.beschrijving,
        cost.leverancier,
        cost.deel_van_huis,
        cost.categorie,
        cost.status,
        cost.koppeling_begrotingspost,
        cost.bedrag?.toString()
      ].some(field => field?.toLowerCase().includes(query));
      
      return matchCategory && matchDeelVanHuis && matchStatus && matchSearch;
    });
  }, [costs, categoryFilter, deelVanHuisFilter, statusFilter, searchQuery]);

  const hasActiveFilters = categoryFilter !== "all" || deelVanHuisFilter !== "all" || statusFilter !== "all" || searchQuery.trim() !== "";

  const clearFilters = () => {
    setCategoryFilter("all");
    setDeelVanHuisFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
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

    const sortedMonths = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
    
    let cumulativeTotal = 0;
    return sortedMonths.map(([month, data]) => {
      cumulativeTotal += data.total;
      return {
        month: format(new Date(month + "-01"), "MMM yyyy", { locale: nl }),
        ...data,
        cumulativeTotal
      };
    });
  }, [filteredCosts]);

  // Calculate max Y value for chart including budget
  const maxYValue = useMemo(() => {
    const maxCumulative = timeSeriesData.length > 0 
      ? Math.max(...timeSeriesData.map(d => d.cumulativeTotal))
      : 0;
    // Take maximum of cumulative costs and budget, with 10% padding
    return Math.ceil(Math.max(maxCumulative, totalBudget) * 1.1);
  }, [timeSeriesData, totalBudget]);

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

  // Mobile view
  if (isMobile) {
    return (
      <MobileCostList
        costs={filteredCosts}
        projectId={projectId}
        availableDelenVanHuis={availableDelenVanHuis}
        totalBudget={totalBudget}
        onUpdate={refetch}
        onExport={handleExportToExcel}
      />
    );
  }

  // Desktop view
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
        <CardContent className="pt-4 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoek in beschrijving, leverancier, categorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          
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
                {availableDelenVanHuis.map(deel => (
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                <ComposedChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, maxYValue]} tickFormatter={(value) => `€${value.toLocaleString("nl-NL")}`} tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: number) => [`€${value.toLocaleString("nl-NL")}`, ""]}
                    labelFormatter={(label) => `Maand: ${label}`}
                  />
                  <Legend />
                  {totalBudget > 0 && (
                    <ReferenceLine 
                      y={totalBudget} 
                      stroke="#f59e0b" 
                      strokeDasharray="8 4"
                      strokeWidth={2}
                      label={{ 
                        value: `Budget: €${totalBudget.toLocaleString("nl-NL")}`,
                        position: 'insideTopRight',
                        fill: '#f59e0b',
                        fontSize: 12,
                        fontWeight: 500
                      }}
                    />
                  )}
                  <Bar dataKey="Schatting" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Offerte" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Factuur" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeTotal" 
                    name="Cumulatief Totaal"
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={{ fill: "#ef4444", strokeWidth: 2 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards - All categories on one row */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        <div className="inline-flex gap-3 sm:gap-4 min-w-full sm:grid sm:grid-cols-7">
          <Card className="shadow-card min-w-[140px] sm:min-w-0 flex-shrink-0">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Totaal</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold flex items-center gap-1">
                <span className="text-muted-foreground text-sm">€</span>
                {totalCosts.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          {["Arbeid", "Materiaal", "Kluswerkzaamheden", "Meubels", "Decoratie", "Overig"].map((category) => (
            <Card key={category} className="shadow-card min-w-[140px] sm:min-w-0 flex-shrink-0">
              <CardHeader className="pb-2 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                <div className="text-lg sm:text-xl font-bold">
                  €{(costsByCategory[category] || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
                        displayRenderer={(val) => {
                          if (!val) return <span className="text-muted-foreground">-</span>;
                          const date = new Date(val);
                          return <span>{date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}</span>;
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
                        type="select"
                        value={cost.deel_van_huis}
                        options={availableDelenVanHuis.map(d => ({ value: d, label: d }))}
                        onSave={async (value) => {
                          await updateCost(cost.id, { deel_van_huis: value || null });
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
                            setEditDialogOpen(true);
                          }}>
                            <Pencil className="w-4 h-4 mr-2" />
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

      <CreateCostDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} projectId={projectId} availableDelenVanHuis={availableDelenVanHuis} onSuccess={() => {
      refetch();
      toast.success("Kosten succesvol toegevoegd!");
    }} />

      {selectedCost && (
        <>
          <EditCostDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            cost={selectedCost}
            onSuccess={() => {
              refetch();
              setEditDialogOpen(false);
            }}
          />
          <DeleteConfirmationDialog 
            open={deleteDialogOpen} 
            onOpenChange={setDeleteDialogOpen} 
            title="Kosten Verwijderen" 
            description="Dit zal ook de bijbehorende factuur verwijderen indien aanwezig." 
            itemName={`€${parseFloat(selectedCost.bedrag.toString()).toLocaleString("nl-NL")}`} 
            onConfirm={handleDelete} 
            loading={deleting} 
          />
        </>
      )}
    </div>;
};
export default ProjectCosts;