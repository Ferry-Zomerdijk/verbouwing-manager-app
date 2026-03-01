import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Euro, Filter, ChevronDown, ChevronUp, FileSpreadsheet, RefreshCw, AlertTriangle, Search, X, Settings } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { emptyStateMessages } from "@/lib/builderJokes";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MobileCostCard from "./MobileCostCard";
import CreateCostDialog from "./CreateCostDialog";
import type { Database } from "@/integrations/supabase/types";

type Cost = Database["public"]["Tables"]["costs"]["Row"];

interface CategoryOption {
  naam: string;
  kleur: string;
  chartColor: string;
}

interface MobileCostListProps {
  costs: Cost[];
  projectId: string;
  availableDelenVanHuis: string[];
  totalBudget?: number;
  onUpdate: () => void;
  onExport: () => void;
  payerOptions?: string[];
  categoryOptions?: CategoryOption[];
  onOpenPayersManager?: () => void;
  onOpenCategoriesManager?: () => void;
  onOpenSuppliersManager?: () => void;
}

const DEFAULT_CATEGORY_CHART_COLORS: Record<string, string> = {
  Materiaal: "#3b82f6",
  Arbeid: "#a855f7",
  Vergunningen: "#f97316",
  Kluswerkzaamheden: "#22c55e",
  Decoratie: "#ec4899",
  Meubels: "#f59e0b",
  Overig: "#6b7280"
};

const statusOptions = ["Schatting", "Offerte", "Factuur"] as const;
const defaultCategoryOptions = ["Materiaal", "Arbeid", "Vergunningen", "Kluswerkzaamheden", "Decoratie", "Meubels", "Overig"] as const;
const defaultBetaaldDoorOptions = ["Ron", "Monique", "Gezamenlijk", "Ntb"] as const;

export const MobileCostList = ({
  costs,
  projectId,
  availableDelenVanHuis,
  totalBudget = 0,
  onUpdate,
  onExport,
  payerOptions = [],
  categoryOptions = [],
  onOpenPayersManager,
  onOpenCategoriesManager,
  onOpenSuppliersManager
}: MobileCostListProps) => {
  const betaaldDoorOptions = payerOptions.length > 0 ? payerOptions : [...defaultBetaaldDoorOptions];
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [betaaldDoorFilter, setBetaaldDoorFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filter costs with search
  const filteredCosts = useMemo(() => {
    return costs.filter(cost => {
      const matchStatus = !statusFilter || cost.status === statusFilter;
      const matchCategory = !categoryFilter || cost.categorie === categoryFilter;
      const matchBetaaldDoor = !betaaldDoorFilter || cost.betaald_door === betaaldDoorFilter;
      
      // Search filter - search across all text fields including formatted date
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || [
        cost.beschrijving,
        cost.leverancier,
        cost.deel_van_huis,
        cost.categorie,
        cost.status,
        cost.betaald_door,
        cost.koppeling_begrotingspost,
        cost.bedrag?.toString(),
        format(new Date(cost.datum), "dd-MM-yyyy"),
        format(new Date(cost.datum), "MMMM yyyy", { locale: nl }),
      ].some(field => field?.toLowerCase().includes(query));
      
      return matchStatus && matchCategory && matchBetaaldDoor && matchSearch;
    });
  }, [costs, statusFilter, categoryFilter, betaaldDoorFilter, searchQuery]);

  const totalCosts = filteredCosts.reduce((sum, cost) => sum + parseFloat(cost.bedrag.toString()), 0);

  // Build dynamic chart colors from categories
  const dynamicCategoryColors = useMemo(() => {
    const colors: Record<string, string> = {};
    categoryOptions.forEach(cat => {
      colors[cat.naam] = cat.chartColor;
    });
    return colors;
  }, [categoryOptions]);

  // Chart data - use dynamic colors
  const categoryChartData = useMemo(() => {
    const byCategory = filteredCosts.reduce((acc, cost) => {
      const category = cost.categorie;
      if (!acc[category]) acc[category] = 0;
      acc[category] += parseFloat(cost.bedrag.toString());
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byCategory).map(([name, value]) => ({
      name,
      value,
      color: dynamicCategoryColors[name] || DEFAULT_CATEGORY_CHART_COLORS[name] || "#6b7280"
    }));
  }, [filteredCosts, dynamicCategoryColors]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onUpdate();
    setTimeout(() => setRefreshing(false), 500);
  };

  const hasActiveFilters = statusFilter || categoryFilter || betaaldDoorFilter || searchQuery.trim();

  const clearFilters = () => {
    setStatusFilter(null);
    setCategoryFilter(null);
    setBetaaldDoorFilter(null);
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Kosten</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          {onOpenSuppliersManager && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenSuppliersManager}
              title="Leveranciers beheren"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {onOpenCategoriesManager && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenCategoriesManager}
              title="Categorieën beheren"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          {onOpenPayersManager && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={onOpenPayersManager}
              title="Betalers beheren"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="icon"
            onClick={onExport}
            disabled={filteredCosts.length === 0}
          >
            <FileSpreadsheet className="w-4 h-4" />
          </Button>
          <Button 
            onClick={() => setCreateDialogOpen(true)} 
            size="icon"
            className="gradient-primary"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek in beschrijving, leverancier, datum..."
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
      {searchQuery && (
        <p className="text-xs text-muted-foreground -mt-2">
          {filteredCosts.length} resultaten gevonden
        </p>
      )}

      {/* Total Amount Card */}
      <Card className={`${totalBudget > 0 && totalCosts > totalBudget ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Totaal</span>
            <div className="flex items-center gap-1 text-2xl font-bold">
              <Euro className="w-5 h-5" />
              {totalCosts.toLocaleString("nl-NL")}
            </div>
          </div>
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground mt-1">
              {filteredCosts.length} van {costs.length} kostenposten
            </p>
          )}
          {totalBudget > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Budget</span>
                <span>€{totalBudget.toLocaleString("nl-NL")}</span>
              </div>
              <Progress 
                value={Math.min((totalCosts / totalBudget) * 100, 100)} 
                className={`h-2 ${totalCosts > totalBudget ? '[&>div]:bg-destructive' : ''}`}
              />
              {totalCosts > totalBudget && (
                <div className="flex items-center gap-1 text-xs text-destructive mt-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Budget overschreden met €{(totalCosts - totalBudget).toLocaleString("nl-NL")}
                </div>
              )}
              {totalCosts <= totalBudget && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nog €{(totalBudget - totalCosts).toLocaleString("nl-NL")} beschikbaar
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters - Collapsible */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {(statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (betaaldDoorFilter ? 1 : 0)}
                </Badge>
              )}
            </div>
            {filtersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-3">
          {/* Status Filter Chips */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
            <div className="flex flex-wrap gap-3">
              {statusOptions.map(status => (
                <Badge
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  className="cursor-pointer min-h-[40px] px-4 py-2 text-sm"
                  onClick={() => setStatusFilter(statusFilter === status ? null : status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Categorie</p>
            <div className="flex flex-wrap gap-3">
              {(categoryOptions.length > 0 ? categoryOptions.map(c => c.naam) : defaultCategoryOptions).map(category => (
                <Badge
                  key={category}
                  variant={categoryFilter === category ? "default" : "outline"}
                  className="cursor-pointer min-h-[40px] px-4 py-2 text-sm"
                  onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>

          {/* Betaald door Filter Chips */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Betaald door</p>
            <div className="flex flex-wrap gap-3">
              {betaaldDoorOptions.map(option => (
                <Badge
                  key={option}
                  variant={betaaldDoorFilter === option ? "default" : "outline"}
                  className="cursor-pointer min-h-[40px] px-4 py-2 text-sm"
                  onClick={() => setBetaaldDoorFilter(betaaldDoorFilter === option ? null : option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="w-full h-11">
              Wis filters
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Stats - Collapsible Pie Chart */}
      {filteredCosts.length > 0 && (
        <Collapsible open={statsOpen} onOpenChange={setStatsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span>Statistieken</span>
              {statsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <Card>
              <CardContent className="py-4">
                <p className="text-sm font-medium mb-2">Kosten per Categorie</p>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
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
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mt-2 justify-center">
                  {categoryChartData.map(item => (
                    <div key={item.name} className="flex items-center gap-1 text-xs">
                      <div 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Cost Cards List */}
      <div className="space-y-3">
        {filteredCosts.length > 0 ? (
          filteredCosts.map(cost => (
            <MobileCostCard 
              key={cost.id} 
              cost={cost} 
              onUpdate={onUpdate} 
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <span className="text-4xl mb-3 block">
                {hasActiveFilters ? "🔍" : "💰"}
              </span>
              <p className="font-medium">
                {hasActiveFilters ? "Geen kostenposten gevonden" : "Nog geen kosten"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters 
                  ? "Probeer andere filters"
                  : emptyStateMessages.costs.noCosts}
              </p>
              {hasActiveFilters && (
                <Button variant="link" onClick={clearFilters} className="mt-2">
                  Filters wissen
                </Button>
              )}
              {!hasActiveFilters && (
                <Button onClick={() => setCreateDialogOpen(true)} className="mt-4 gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Eerste kost toevoegen
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Swipe Hint */}
      {filteredCosts.length > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Swipe rechts om te bewerken, links om te verwijderen
        </p>
      )}

      <CreateCostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        availableDelenVanHuis={availableDelenVanHuis}
        onSuccess={() => {
          onUpdate();
        }}
      />
    </div>
  );
};

export default MobileCostList;
