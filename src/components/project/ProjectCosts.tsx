import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Euro, Download, MoreVertical, Trash2, Filter, X, FileSpreadsheet, Search, Pencil, BarChart3, ChevronDown, Settings } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
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
import { CostPayersManager, useCostPayers } from "./CostPayersManager";
import { CostCategoriesManager, useCostCategories, CATEGORY_COLOR_MAP } from "./CostCategoriesManager";
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
  const [leverancierFilter, setLeverancierFilter] = useState<string>("all");
  const [betaaldDoorFilter, setBetaaldDoorFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chartsOpen, setChartsOpen] = useState(() => {
    const saved = localStorage.getItem("costs-charts-open");
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [payersManagerOpen, setPayersManagerOpen] = useState(false);
  const [categoriesManagerOpen, setCategoriesManagerOpen] = useState(false);
  
  // Get custom payer options for this project
  const { data: payerOptions = [] } = useCostPayers(projectId);
  
  // Get custom category options for this project
  const { data: categoryOptions = [] } = useCostCategories(projectId);
  
  // Build dynamic chart colors from categories
  const dynamicCategoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    categoryOptions.forEach(cat => {
      colors[cat.naam] = cat.chartColor;
    });
    return colors;
  }, [categoryOptions]);
  
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

  // Get unique leveranciers from costs
  const availableLeveranciers = useMemo(() => {
    const leveranciers = costs?.map(c => c.leverancier).filter((v): v is string => !!v && v.trim() !== "") || [];
    return [...new Set(leveranciers)].sort();
  }, [costs]);

  // Filter costs based on selected filters and search query
  const filteredCosts = useMemo(() => {
    if (!costs) return [];
    return costs.filter(cost => {
      const matchCategory = categoryFilter === "all" || cost.categorie === categoryFilter;
      const matchDeelVanHuis = deelVanHuisFilter === "all" || cost.deel_van_huis === deelVanHuisFilter;
      const matchStatus = statusFilter === "all" || cost.status === statusFilter;
      const matchLeverancier = leverancierFilter === "all" || cost.leverancier === leverancierFilter;
      const matchBetaaldDoor = betaaldDoorFilter === "all" || cost.betaald_door === betaaldDoorFilter;
      
      // Search filter - search across all text fields
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || [
        cost.beschrijving,
        cost.leverancier,
        cost.deel_van_huis,
        cost.categorie,
        cost.status,
        cost.betaald_door,
        cost.koppeling_begrotingspost,
        cost.bedrag?.toString()
      ].some(field => field?.toLowerCase().includes(query));
      
      return matchCategory && matchDeelVanHuis && matchStatus && matchLeverancier && matchBetaaldDoor && matchSearch;
    });
  }, [costs, categoryFilter, deelVanHuisFilter, statusFilter, leverancierFilter, betaaldDoorFilter, searchQuery]);

  const hasActiveFilters = categoryFilter !== "all" || deelVanHuisFilter !== "all" || statusFilter !== "all" || leverancierFilter !== "all" || betaaldDoorFilter !== "all" || searchQuery.trim() !== "";

  const clearFilters = () => {
    setCategoryFilter("all");
    setDeelVanHuisFilter("all");
    setStatusFilter("all");
    setLeverancierFilter("all");
    setBetaaldDoorFilter("all");
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

  // Chart data - use dynamic colors from categories
  const categoryChartData = useMemo(() => {
    return Object.entries(costsByCategory).map(([name, value]) => ({
      name,
      value,
      color: dynamicCategoryColors[name] || CATEGORY_CHART_COLORS[name] || "#6b7280"
    }));
  }, [costsByCategory, dynamicCategoryColors]);

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

  // Betaald door chart data
  // Generate colors for payers dynamically
  const BETAALD_DOOR_COLORS: Record<string, string> = useMemo(() => {
    const defaultColors: Record<string, string> = {
      Ron: "#3b82f6",
      Monique: "#ec4899",
      Gezamenlijk: "#8b5cf6",
      Ntb: "#94a3b8"
    };
    const colorPalette = ["#3b82f6", "#ec4899", "#8b5cf6", "#22c55e", "#f97316", "#06b6d4", "#eab308", "#94a3b8"];
    const colors: Record<string, string> = {};
    payerOptions.forEach((payer, index) => {
      colors[payer] = defaultColors[payer] || colorPalette[index % colorPalette.length];
    });
    return colors;
  }, [payerOptions]);

  const betaaldDoorChartData = useMemo(() => {
    const byBetaaldDoor = filteredCosts.reduce((acc, cost) => {
      const betaaldDoor = cost.betaald_door || "Ntb";
      if (!acc[betaaldDoor]) acc[betaaldDoor] = 0;
      acc[betaaldDoor] += parseFloat(cost.bedrag.toString());
      return acc;
    }, {} as Record<string, number>);
    
    // Use payerOptions order, then any other values
    const order = payerOptions.length > 0 ? payerOptions : ["Ron", "Monique", "Gezamenlijk", "Ntb"];
    const allPayers = [...new Set([...order, ...Object.keys(byBetaaldDoor)])];
    return allPayers
      .filter(name => byBetaaldDoor[name] > 0)
      .map(name => ({
        name,
        value: byBetaaldDoor[name],
        color: BETAALD_DOOR_COLORS[name] || "#6b7280"
      }));
  }, [filteredCosts, payerOptions, BETAALD_DOOR_COLORS]);

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
      "Betaald door": cost.betaald_door || "Ntb",
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
      { wch: 12 }, // Betaald door
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
      <>
        <MobileCostList
          costs={filteredCosts}
          projectId={projectId}
          availableDelenVanHuis={availableDelenVanHuis}
          totalBudget={totalBudget}
          onUpdate={refetch}
          onExport={handleExportToExcel}
          payerOptions={payerOptions}
          categoryOptions={categoryOptions}
          onOpenPayersManager={() => setPayersManagerOpen(true)}
          onOpenCategoriesManager={() => setCategoriesManagerOpen(true)}
        />
        <CostPayersManager
          projectId={projectId}
          open={payersManagerOpen}
          onOpenChange={setPayersManagerOpen}
        />
        <CostCategoriesManager
          projectId={projectId}
          open={categoriesManagerOpen}
          onOpenChange={setCategoriesManagerOpen}
        />
      </>
    );
  }

  // Desktop view
  return <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-2xl font-bold">Kosten</h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => setCategoriesManagerOpen(true)} className="h-8 sm:h-9">
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Categorieën</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPayersManagerOpen(true)} className="h-8 sm:h-9">
            <Settings className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Betalers</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToExcel} disabled={filteredCosts.length === 0} className="h-8 sm:h-9">
            <FileSpreadsheet className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Exporteer</span>
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary h-8 sm:h-9" size="sm">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Nieuwe kostenpost</span>
          </Button>
        </div>
      </div>


      {/* Charts Section - Collapsible */}
      {filteredCosts.length > 0 && (
        <Collapsible 
          open={chartsOpen} 
          onOpenChange={(open) => {
            setChartsOpen(open);
            localStorage.setItem("costs-charts-open", JSON.stringify(open));
          }}
        >
          <Card className="shadow-card overflow-hidden">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors flex flex-row items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Kosten Dashboards</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Visualisaties per categorie, status en over tijd
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-200",
                  chartsOpen && "rotate-180"
                )} />
              </CardHeader>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-6">
                {/* Pie and Bar Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm font-medium mb-3 sm:mb-4">Kosten per Categorie</h4>
                    <div className="h-[220px] lg:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
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
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm font-medium mb-3 sm:mb-4">Betaald door</h4>
                    <div className="h-[220px] lg:h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={betaaldDoorChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                            labelLine={false}
                          >
                            {betaaldDoorChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`€${value.toLocaleString("nl-NL")}`, "Bedrag"]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Summary cards under the pie chart */}
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {betaaldDoorChartData.map(item => (
                        <div key={item.name} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: item.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground truncate">{item.name}</p>
                            <p className="text-sm font-medium">€{item.value.toLocaleString("nl-NL")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status Chart - full width */}
                <div className="border rounded-lg p-3 sm:p-4">
                  <h4 className="text-sm font-medium mb-3 sm:mb-4">Kosten per Status</h4>
                  <div className="h-[180px] lg:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusChartData} layout="vertical">
                        <XAxis type="number" tickFormatter={(value) => `€${value.toLocaleString("nl-NL")}`} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value: number) => [`€${value.toLocaleString("nl-NL")}`, "Bedrag"]}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Time Series Chart */}
                {timeSeriesData.length > 1 && (
                  <div className="border rounded-lg p-3 sm:p-4">
                    <h4 className="text-sm font-medium mb-3 sm:mb-4">Kosten over Tijd</h4>
                    <div className="h-[220px] lg:h-[300px]">
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
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Summary Cards - Responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        <Card className="shadow-card col-span-2 sm:col-span-1">
          <CardHeader className="pb-1 p-3 sm:p-4 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Totaal</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
            <div className="text-base sm:text-lg font-bold flex items-center gap-1">
              <span className="text-muted-foreground text-xs">€</span>
              {totalCosts.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        {["Arbeid", "Materiaal", "Kluswerkzaamheden", "Meubels", "Decoratie", "Overig"].map((category) => (
          <Card key={category} className="shadow-card">
            <CardHeader className="pb-1 p-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground truncate">{category}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
              <div className="text-sm sm:text-base font-bold flex items-center gap-1">
                <span className="text-muted-foreground text-xs">€</span>
                {(costsByCategory[category] || 0).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Costs Table */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <CardTitle>Kostenposten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Filters */}
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Zoek..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9"
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
            
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[130px] lg:w-[160px] h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="Categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle categorieën</SelectItem>
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat.naam} value={cat.naam}>{cat.naam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={deelVanHuisFilter} onValueChange={setDeelVanHuisFilter}>
                  <SelectTrigger className="w-[120px] lg:w-[150px] h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="Deel huis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle delen</SelectItem>
                    {availableDelenVanHuis.map(deel => (
                      <SelectItem key={deel} value={deel}>{deel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[110px] lg:w-[130px] h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="Schatting">Schatting</SelectItem>
                    <SelectItem value="Offerte">Offerte</SelectItem>
                    <SelectItem value="Factuur">Factuur</SelectItem>
                  </SelectContent>
                </Select>

                {availableLeveranciers.length > 0 && (
                  <Select value={leverancierFilter} onValueChange={setLeverancierFilter}>
                    <SelectTrigger className="w-[120px] lg:w-[150px] h-8 text-xs sm:text-sm">
                      <SelectValue placeholder="Leverancier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle leveranciers</SelectItem>
                      {availableLeveranciers.map(leverancier => (
                        <SelectItem key={leverancier} value={leverancier}>{leverancier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Select value={betaaldDoorFilter} onValueChange={setBetaaldDoorFilter}>
                  <SelectTrigger className="w-[120px] lg:w-[140px] h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="Betaald door" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle betalers</SelectItem>
                    {payerOptions.map(payer => (
                      <SelectItem key={payer} value={payer}>{payer}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 px-2">
                    <X className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Wis</span>
                  </Button>
                )}
              </div>

              {hasActiveFilters && (
                <span className="text-xs sm:text-sm text-muted-foreground sm:ml-auto">
                  {filteredCosts.length} van {costs?.length || 0}
                </span>
              )}
            </div>
          </div>

          {filteredCosts.length > 0 ? <div className="overflow-x-auto -mx-4 sm:mx-0">
            <Table className="min-w-[700px] sm:min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Datum</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Categorie</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Betaald door</TableHead>
                  <TableHead className="hidden lg:table-cell whitespace-nowrap">Deel van huis</TableHead>
                  <TableHead className="hidden md:table-cell whitespace-nowrap">Leverancier</TableHead>
                  <TableHead className="hidden lg:table-cell">Beschrijving</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Bedrag</TableHead>
                  <TableHead className="w-[80px] sm:w-[100px]">Factuur</TableHead>
                  <TableHead className="w-[50px] sm:w-[60px]"></TableHead>
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
                        options={categoryOptions.map(cat => ({ value: cat.naam, label: cat.naam }))}
                        onSave={async (value) => {
                          await updateCost(cost.id, { categorie: value as string });
                        }}
                        displayRenderer={(val) => {
                          const catColor = categoryOptions.find(c => c.naam === val)?.kleur;
                          const bgClass = catColor ? `bg-${catColor}-500` : categoryColors[val];
                          return val ? (
                            <Badge 
                              variant="outline" 
                              className="text-white border-0"
                              style={{ backgroundColor: categoryOptions.find(c => c.naam === val)?.chartColor || CATEGORY_COLOR_MAP[catColor || ''] || categoryColors[val]?.replace('bg-', '#') }}
                            >
                              {val}
                            </Badge>
                          ) : null;
                        }}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <InlineEditableCell
                        type="select"
                        value={cost.betaald_door || "Ntb"}
                        options={payerOptions.map(p => ({ value: p, label: p }))}
                        onSave={async (value) => {
                          await updateCost(cost.id, { betaald_door: value || "Ntb" });
                        }}
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
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
                    <TableCell className="hidden md:table-cell">
                      <InlineEditableCell
                        value={cost.leverancier}
                        onSave={async (value) => {
                          await updateCost(cost.id, { leverancier: value });
                        }}
                        placeholder="-"
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-[200px]">
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
            </Table>
          </div> : <p className="text-center text-muted-foreground py-8">
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
      
      <CostPayersManager
        projectId={projectId}
        open={payersManagerOpen}
        onOpenChange={setPayersManagerOpen}
      />
      
      <CostCategoriesManager
        projectId={projectId}
        open={categoriesManagerOpen}
        onOpenChange={setCategoriesManagerOpen}
      />
    </div>;
};
export default ProjectCosts;