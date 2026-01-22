import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, X, Filter, RefreshCw, ChevronDown, PartyPopper, Coffee } from "lucide-react";
import MobileTaskCard from "./MobileTaskCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emptyStateMessages, getRandomCompletionMessage } from "@/lib/builderJokes";
import { addToQueue } from "@/lib/offlineQueue";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

interface TaskType {
  id: string;
  naam: string;
  kleur: string;
}

interface MobileTaskListProps {
  tasks: any[];
  projectId: string;
  onUpdate: () => void;
  canDelete?: boolean;
  onCreateTask?: () => void;
  availableDelenVanHuis?: string[];
  availableTaskTypes?: TaskType[];
  readOnly?: boolean;
}

type StatusFilter = "Te doen" | "Bezig" | "Gereed";

const statusColors: Record<StatusFilter, string> = {
  "Te doen": "bg-muted text-muted-foreground hover:bg-muted/80",
  "Bezig": "bg-primary/20 text-primary hover:bg-primary/30",
  "Gereed": "bg-green-500/20 text-green-700 hover:bg-green-500/30",
};

const getTaskTypeColorClass = (kleur: string) => {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    purple: "bg-purple-500",
    green: "bg-green-500",
    yellow: "bg-yellow-500",
    gray: "bg-gray-500",
    red: "bg-red-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
  };
  return colorMap[kleur] || "bg-gray-500";
};

const MobileTaskList = ({ tasks, projectId, onUpdate, canDelete = true, onCreateTask, availableDelenVanHuis = [], availableTaskTypes = [], readOnly = false }: MobileTaskListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<StatusFilter[]>(["Te doen", "Bezig"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedVerantwoordelijke, setSelectedVerantwoordelijke] = useState<string | null>(null);
  const [selectedDeelVanHuis, setSelectedDeelVanHuis] = useState<string | null>(null);
  const [selectedTaskTypes, setSelectedTaskTypes] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const availableVerantwoordelijken = useMemo(() => {
    return [...new Set(tasks
      .map(t => t.verantwoordelijke)
      .filter(Boolean))] as string[];
  }, [tasks]);

  // Pull-to-refresh functionaliteit
  const performRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    onUpdate();
    toast.success("Lijst vernieuwd");
  };

  const {
    containerRef,
    pullDistance,
    isRefreshing,
    progress,
    shouldTrigger,
  } = usePullToRefresh({
    onRefresh: performRefresh,
    threshold: 80,
    maxPull: 120,
  });

  const handleRefresh = async () => {
    if (isRefreshing) return;
    await performRefresh();
  };

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: StatusFilter }) => {
      // Queue voor offline sync als offline
      if (!navigator.onLine) {
        addToQueue({ type: 'update', table: 'tasks', data: { id: taskId, status: newStatus } });
        return { id: taskId, status: newStatus };
      }

      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      
      if (error) throw error;
      return { id: taskId, status: newStatus };
    },
    onMutate: async ({ taskId, newStatus }) => {
      // Cancel lopende fetches
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      
      // Sla huidige state op voor rollback
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      
      // Optimistic update
      queryClient.setQueryData(["tasks", projectId], (old: any) =>
        old?.map((task: any) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback bij error
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
      toast.error("Fout bij bijwerken van status");
    },
    onSuccess: (_, { taskId, newStatus }) => {
      toast.success(navigator.onLine ? "Status bijgewerkt" : "Status lokaal bijgewerkt (wordt gesync'd)");
    },
  });

  const toggleStatus = (status: StatusFilter) => {
    setActiveStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleTaskType = (typeId: string) => {
    setSelectedTaskTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const clearFilters = () => {
    setActiveStatuses(["Te doen", "Bezig", "Gereed"]);
    setSearchQuery("");
    setSelectedVerantwoordelijke(null);
    setSelectedDeelVanHuis(null);
    setSelectedTaskTypes([]);
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (activeStatuses.length > 0 && !activeStatuses.includes(task.status)) {
          return false;
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          if (!(
            task.titel?.toLowerCase().includes(query) ||
            task.beschrijving?.toLowerCase().includes(query) ||
            task.verantwoordelijke?.toLowerCase().includes(query)
          )) {
            return false;
          }
        }

        // Verantwoordelijke filter
        if (selectedVerantwoordelijke) {
          if (selectedVerantwoordelijke === "none") {
            if (task.verantwoordelijke) return false;
          } else if (task.verantwoordelijke !== selectedVerantwoordelijke) {
            return false;
          }
        }

        // Deel van huis filter
        if (selectedDeelVanHuis) {
          if (selectedDeelVanHuis === "none") {
            if (task.deel_van_huis) return false;
          } else if (task.deel_van_huis !== selectedDeelVanHuis) {
            return false;
          }
        }

        // Taaktype filter
        if (selectedTaskTypes.length > 0) {
          if (!selectedTaskTypes.includes(task.type_id)) {
            return false;
          }
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort by begindatum ascending (old to new), tasks without date at the end
        if (!a.begindatum && !b.begindatum) return 0;
        if (!a.begindatum) return 1;
        if (!b.begindatum) return -1;
        return new Date(a.begindatum).getTime() - new Date(b.begindatum).getTime();
      });
  }, [tasks, activeStatuses, searchQuery, selectedVerantwoordelijke, selectedDeelVanHuis, selectedTaskTypes]);

  const statusCounts = useMemo(() => ({
    "Te doen": tasks.filter(t => t.status === "Te doen").length,
    "Bezig": tasks.filter(t => t.status === "Bezig").length,
    "Gereed": tasks.filter(t => t.status === "Gereed").length,
  }), [tasks]);

  const completedCount = statusCounts["Gereed"];
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStatusChange = (taskId: string, newStatus: StatusFilter) => {
    if (readOnly) return;
    updateTaskStatus.mutate({ taskId, newStatus });
  };

  const activeFilterCount = 
    (3 - activeStatuses.length) + 
    (searchQuery ? 1 : 0) + 
    (selectedVerantwoordelijke ? 1 : 0) + 
    (selectedDeelVanHuis ? 1 : 0) +
    selectedTaskTypes.length;

  return (
    <div ref={containerRef} className="relative">
      {/* Pull-to-refresh indicator */}
      <PullToRefreshIndicator
        pullDistance={pullDistance}
        isRefreshing={isRefreshing}
        progress={progress}
        shouldTrigger={shouldTrigger}
      />
      
      {/* Content met transform voor pull effect */}
      <div 
        className="space-y-4"
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out'
        }}
      >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Taken</h2>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          {!readOnly && onCreateTask && (
            <Button onClick={onCreateTask} size="icon" className="gradient-primary">
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Progress Summary Card - Special 100% Easter Egg */}
      {progressPercentage === 100 && totalCount > 0 ? (
        <Card className="bg-green-500/10 border-green-500/30 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/10 to-green-500/5 animate-pulse" />
          <CardContent className="py-4 relative">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="w-6 h-6 text-green-600 animate-bounce" />
              <span className="text-2xl font-bold text-green-700">100% KLAAR!</span>
              <PartyPopper className="w-6 h-6 text-green-600 animate-bounce" style={{ animationDelay: '0.1s' }} />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {getRandomCompletionMessage()}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Voortgang</span>
              <span className="text-2xl font-bold">
                {completedCount} / {totalCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{progressPercentage}% gereed</p>
          </CardContent>
        </Card>
      )}

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Zoek taken..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9 h-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
            onClick={() => setSearchQuery("")}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Collapsible Filters */}
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{filteredTasks.length} taken</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </div>
          </Button>
        </CollapsibleTrigger>
        
        {/* Actieve filters als verwijderbare chips (zichtbaar wanneer filters ingeklapt) */}
        {activeFilterCount > 0 && !filtersOpen && (
          <div className="flex flex-wrap gap-2 mt-2">
            {activeStatuses.length < 3 && activeStatuses.map(status => (
              <Badge 
                key={status} 
                variant="secondary" 
                className="gap-1 text-xs cursor-pointer hover:bg-secondary/80" 
                onClick={() => toggleStatus(status)}
              >
                {status}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            
            {selectedVerantwoordelijke && (
              <Badge 
                variant="secondary" 
                className="gap-1 text-xs cursor-pointer hover:bg-secondary/80" 
                onClick={() => setSelectedVerantwoordelijke(null)}
              >
                {selectedVerantwoordelijke === "none" ? "Niet toegewezen" : selectedVerantwoordelijke}
                <X className="w-3 h-3" />
              </Badge>
            )}
            
            {selectedDeelVanHuis && (
              <Badge 
                variant="secondary" 
                className="gap-1 text-xs cursor-pointer hover:bg-secondary/80" 
                onClick={() => setSelectedDeelVanHuis(null)}
              >
                {selectedDeelVanHuis === "none" ? "Geen locatie" : selectedDeelVanHuis}
                <X className="w-3 h-3" />
              </Badge>
            )}
            
            {selectedTaskTypes.map(typeId => {
              const taskType = availableTaskTypes.find(t => t.id === typeId);
              return taskType && (
                <Badge 
                  key={typeId}
                  variant="secondary" 
                  className="gap-1 text-xs cursor-pointer hover:bg-secondary/80" 
                  onClick={() => toggleTaskType(typeId)}
                >
                  <div className={`w-2 h-2 rounded-full ${getTaskTypeColorClass(taskType.kleur)}`} />
                  {taskType.naam}
                  <X className="w-3 h-3" />
                </Badge>
              );
            })}
          </div>
        )}
        <CollapsibleContent className="pt-3">
          <div className="space-y-3">
            {/* Status filters */}
            <div className="flex flex-wrap gap-3">
              {(["Te doen", "Bezig", "Gereed"] as StatusFilter[]).map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={`cursor-pointer transition-colors min-h-[40px] px-4 py-2 text-sm ${
                    activeStatuses.includes(status) 
                      ? statusColors[status]
                      : "bg-transparent text-muted-foreground"
                  }`}
                  onClick={() => toggleStatus(status)}
                >
                  {status} ({statusCounts[status]})
                </Badge>
              ))}
            </div>

            {/* Verantwoordelijke & Deel van huis filters */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Verantwoordelijke</Label>
                <Select 
                  value={selectedVerantwoordelijke || "all"} 
                  onValueChange={(val) => setSelectedVerantwoordelijke(val === "all" ? null : val)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="none">Niet toegewezen</SelectItem>
                    {availableVerantwoordelijken.map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Deel van huis</Label>
                <Select 
                  value={selectedDeelVanHuis || "all"} 
                  onValueChange={(val) => setSelectedDeelVanHuis(val === "all" ? null : val)}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Alle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle</SelectItem>
                    <SelectItem value="none">Niet ingevuld</SelectItem>
                    {availableDelenVanHuis.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Taaktype filters */}
            {availableTaskTypes.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type taak</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTaskTypes.map((type) => (
                    <Badge
                      key={type.id}
                      variant="outline"
                      className={`cursor-pointer transition-colors min-h-[36px] px-3 py-1.5 text-sm gap-1.5 ${
                        selectedTaskTypes.includes(type.id)
                          ? "bg-primary/20 text-primary border-primary/30"
                          : "bg-transparent text-muted-foreground"
                      }`}
                      onClick={() => toggleTaskType(type.id)}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${getTaskTypeColorClass(type.kleur)}`} />
                      {type.naam}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {activeFilterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters} className="h-10 text-sm">
                <X className="w-4 h-4 mr-1" />
                Wis filters
              </Button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Task list */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          <>
            {filteredTasks.map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onStatusChange={handleStatusChange}
                canDelete={canDelete}
                availableDelenVanHuis={availableDelenVanHuis}
              />
            ))}
            {/* Swipe hint */}
            <p className="text-xs text-center text-muted-foreground pt-2">
              Swipe rechts om te bewerken, links om te verwijderen
            </p>
          </>
        ) : (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">
              {tasks.length === 0 ? "🏗️" : "🔍"}
            </span>
            <p className="font-medium">
              {tasks.length === 0 ? "Nog geen taken" : "Geen taken gevonden"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {tasks.length === 0 
                ? emptyStateMessages.tasks.noTasks
                : "Probeer andere filters"}
            </p>
            {activeFilterCount > 0 && (
              <Button
                variant="link"
                onClick={clearFilters}
                className="mt-2"
              >
                Filters wissen
              </Button>
            )}
            {tasks.length === 0 && (
              <Button onClick={onCreateTask} className="mt-4 gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Eerste taak toevoegen
              </Button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default MobileTaskList;
