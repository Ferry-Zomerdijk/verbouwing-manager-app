import { useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, Filter, RefreshCw } from "lucide-react";
import MobileTaskCard from "./MobileTaskCard";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MobileTaskListProps {
  tasks: any[];
  projectId: string;
  onUpdate: () => void;
  canDelete?: boolean;
  onCreateTask: () => void;
}

type StatusFilter = "Te doen" | "Bezig" | "Gereed";

const MobileTaskList = ({ tasks, projectId, onUpdate, canDelete = true, onCreateTask }: MobileTaskListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatuses, setActiveStatuses] = useState<StatusFilter[]>(["Te doen", "Bezig"]);
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const queryClient = useQueryClient();

  const PULL_THRESHOLD = 80;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop !== 0 || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (diff > 0 && touchStartY.current > 0) {
      // Apply resistance to make pull feel natural
      const distance = Math.min(diff * 0.5, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD);
      
      try {
        await queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
        onUpdate();
        toast.success("Lijst vernieuwd");
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 300);
      }
    } else {
      setPullDistance(0);
    }
    touchStartY.current = 0;
  }, [pullDistance, isRefreshing, queryClient, projectId, onUpdate]);

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

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (activeStatuses.length > 0 && !activeStatuses.includes(task.status)) {
        return false;
      }
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          task.titel?.toLowerCase().includes(query) ||
          task.beschrijving?.toLowerCase().includes(query) ||
          task.verantwoordelijke?.toLowerCase().includes(query)
        );
      }
      
      return true;
    });
  }, [tasks, activeStatuses, searchQuery]);

  const statusCounts = useMemo(() => ({
    "Te doen": tasks.filter(t => t.status === "Te doen").length,
    "Bezig": tasks.filter(t => t.status === "Bezig").length,
    "Gereed": tasks.filter(t => t.status === "Gereed").length,
  }), [tasks]);

  const handleStatusChange = (taskId: string, newStatus: StatusFilter) => {
    updateTaskStatus.mutate({ taskId, newStatus });
  };

  return (
    <div 
      ref={containerRef}
      className="space-y-4 relative overflow-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 pointer-events-none overflow-hidden"
        style={{ 
          height: pullDistance,
          opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
          top: 0,
        }}
      >
        <div className={`flex items-center gap-2 text-sm text-muted-foreground ${isRefreshing ? 'animate-pulse' : ''}`}>
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} style={{ 
            transform: `rotate(${Math.min(pullDistance / PULL_THRESHOLD, 1) * 180}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s'
          }} />
          <span>{isRefreshing ? 'Verversen...' : pullDistance >= PULL_THRESHOLD ? 'Loslaten om te verversen' : 'Trek omlaag'}</span>
        </div>
      </div>

      {/* Content with offset when pulling */}
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: pullDistance === 0 ? 'transform 0.2s' : 'none' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Taken</h2>
          <Button onClick={onCreateTask} size="sm" className="gradient-primary">
            <Plus className="w-4 h-4 mr-1" />
            Nieuw
          </Button>
        </div>

        {/* Search bar */}
        <div className="relative mt-4">
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

        {/* Filter toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full justify-between mt-4"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Status filters
            {activeStatuses.length < 3 && (
              <span className="text-xs bg-primary text-primary-foreground rounded-full px-2">
                {activeStatuses.length}
              </span>
            )}
          </span>
          <span className="text-muted-foreground">{filteredTasks.length} taken</span>
        </Button>

        {/* Status filter chips */}
        {showFilters && (
          <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
            {(["Te doen", "Bezig", "Gereed"] as StatusFilter[]).map((status) => (
              <Button
                key={status}
                variant={activeStatuses.includes(status) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleStatus(status)}
                className="flex-shrink-0"
              >
                {status} ({statusCounts[status]})
              </Button>
            ))}
          </div>
        )}

        {/* Task list */}
        <div className="space-y-3 mt-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <MobileTaskCard
                key={task.id}
                task={task}
                onUpdate={onUpdate}
                onStatusChange={handleStatusChange}
                canDelete={canDelete}
              />
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Geen taken gevonden</p>
              {(searchQuery || activeStatuses.length < 3) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveStatuses(["Te doen", "Bezig", "Gereed"]);
                  }}
                  className="mt-2"
                >
                  Filters wissen
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
