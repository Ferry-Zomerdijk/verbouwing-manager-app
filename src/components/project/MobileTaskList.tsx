import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Plus, X, Filter, RefreshCw, ChevronDown, PartyPopper, Coffee } from "lucide-react";
import MobileTaskCard from "./MobileTaskCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { emptyStateMessages, getRandomCompletionMessage } from "@/lib/builderJokes";

interface MobileTaskListProps {
  tasks: any[];
  projectId: string;
  onUpdate: () => void;
  canDelete?: boolean;
  onCreateTask: () => void;
}

type StatusFilter = "Te doen" | "Bezig" | "Gereed";

const statusColors: Record<StatusFilter, string> = {
  "Te doen": "bg-muted text-muted-foreground hover:bg-muted/80",
  "Bezig": "bg-primary/20 text-primary hover:bg-primary/30",
  "Gereed": "bg-green-500/20 text-green-700 hover:bg-green-500/30",
};

const MobileTaskList = ({ tasks, projectId, onUpdate, canDelete = true, onCreateTask }: MobileTaskListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<StatusFilter[]>(["Te doen", "Bezig"]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      onUpdate();
      toast.success("Lijst vernieuwd");
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const updateTaskStatus = useMutation({
    mutationFn: async ({ taskId, newStatus }: { taskId: string; newStatus: StatusFilter }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      
      if (error) throw error;
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      
      queryClient.setQueryData(["tasks", projectId], (old: any) =>
        old?.map((task: any) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
      toast.error("Fout bij bijwerken van status");
    },
    onSuccess: () => {
      toast.success("Status bijgewerkt");
    },
  });

  const toggleStatus = (status: StatusFilter) => {
    setActiveStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setActiveStatuses(["Te doen", "Bezig", "Gereed"]);
    setSearchQuery("");
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        if (activeStatuses.length > 0 && !activeStatuses.includes(task.status)) {
          return false;
        }
        
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            task.titel?.toLowerCase().includes(query) ||
            task.beschrijving?.toLowerCase().includes(query) ||
            task.verantwoordelijke?.toLowerCase().includes(query)
          );
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
  }, [tasks, activeStatuses, searchQuery]);

  const statusCounts = useMemo(() => ({
    "Te doen": tasks.filter(t => t.status === "Te doen").length,
    "Bezig": tasks.filter(t => t.status === "Bezig").length,
    "Gereed": tasks.filter(t => t.status === "Gereed").length,
  }), [tasks]);

  const completedCount = statusCounts["Gereed"];
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleStatusChange = (taskId: string, newStatus: StatusFilter) => {
    updateTaskStatus.mutate({ taskId, newStatus });
  };

  const activeFilterCount = 3 - activeStatuses.length + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Taken</h2>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={onCreateTask} size="icon" className="gradient-primary">
            <Plus className="w-4 h-4" />
          </Button>
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
        <CollapsibleContent className="pt-3">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(["Te doen", "Bezig", "Gereed"] as StatusFilter[]).map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={`cursor-pointer transition-colors ${
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
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs">
                <X className="w-3 h-3 mr-1" />
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
  );
};

export default MobileTaskList;
