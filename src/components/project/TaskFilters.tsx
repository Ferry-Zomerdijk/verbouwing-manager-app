import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronDown } from "lucide-react";
import { AutocompleteInput } from "./AutocompleteInput";
import { taskTypeIconMap, getTaskTypeIconColor, DefaultTaskTypeIcon } from "@/lib/taskTypeUtils";

export interface TaskFiltersType {
  search: string;
  statuses: string[];
  priorities: string[];
  taskTypes: string[];
  verantwoordelijke: string | null;
  deelVanHuis: string | null;
  begindatumVan: string | null;
  begindatumTot: string | null;
  deadlineVan: string | null;
  deadlineTot: string | null;
}

interface TaskType {
  id: string;
  naam: string;
  kleur: string;
  icoon: string;
}

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  availableVerantwoordelijken: string[];
  availableDelenVanHuis: string[];
  availableTaskTypes?: TaskType[];
  activeCount: number;
}

const ALL_STATUSES = ["Te doen", "Bezig", "Gereed"];
const ALL_PRIORITIES = ["Laag", "Middel", "Hoog"];

export const TaskFilters = ({
  filters,
  onFiltersChange,
  availableVerantwoordelijken,
  availableDelenVanHuis,
  availableTaskTypes = [],
  activeCount,
}: TaskFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true);

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

  const handleReset = () => {
    onFiltersChange({
      search: "",
      statuses: ALL_STATUSES,
      priorities: ALL_PRIORITIES,
      taskTypes: [],
      verantwoordelijke: null,
      deelVanHuis: null,
      begindatumVan: null,
      begindatumTot: null,
      deadlineVan: null,
      deadlineTot: null,
    });
  };

  const toggleTaskType = (typeId: string) => {
    const newTypes = filters.taskTypes.includes(typeId)
      ? filters.taskTypes.filter((t) => t !== typeId)
      : [...filters.taskTypes, typeId];
    onFiltersChange({ ...filters, taskTypes: newTypes });
  };

  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const togglePriority = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <CollapsibleTrigger asChild>
          <div className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Actieve filters als verwijderbare chips */}
        {(activeCount > 0 || filters.search || filters.taskTypes.length > 0) && (
          <div className="flex flex-wrap gap-2 px-4 py-2 border-t border-border bg-muted/30">
            {/* Zoekterm chip */}
            {filters.search && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80" 
                onClick={() => onFiltersChange({ ...filters, search: "" })}
              >
                Zoeken: "{filters.search}"
                <X className="w-3 h-3" />
              </Badge>
            )}

            {/* Taaktype chips */}
            {filters.taskTypes.map(typeId => {
              const taskType = availableTaskTypes.find(t => t.id === typeId);
              if (!taskType) return null;
              const IconComponent = taskTypeIconMap[taskType.icoon] || DefaultTaskTypeIcon;
              return (
                <Badge 
                  key={typeId}
                  variant="secondary" 
                  className="gap-1 cursor-pointer hover:bg-secondary/80" 
                  onClick={() => toggleTaskType(typeId)}
                >
                  <IconComponent className={`h-3 w-3 ${getTaskTypeIconColor(taskType.kleur)}`} />
                  {taskType.naam}
                  <X className="w-3 h-3" />
                </Badge>
              );
            })}

            {ALL_PRIORITIES.filter(p => !filters.priorities.includes(p)).map(excludedPriority => (
              <Badge 
                key={excludedPriority} 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80" 
                onClick={() => togglePriority(excludedPriority)}
              >
                Zonder: {excludedPriority}
                <X className="w-3 h-3" />
              </Badge>
            ))}
            
            {filters.verantwoordelijke && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80" 
                onClick={() => onFiltersChange({ ...filters, verantwoordelijke: null })}
              >
                Verantwoordelijke: {filters.verantwoordelijke}
                <X className="w-3 h-3" />
              </Badge>
            )}
            
            {filters.deelVanHuis && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80" 
                onClick={() => onFiltersChange({ ...filters, deelVanHuis: null })}
              >
                Locatie: {filters.deelVanHuis}
                <X className="w-3 h-3" />
              </Badge>
            )}
            
            {(filters.begindatumVan || filters.begindatumTot) && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80" 
                onClick={() => onFiltersChange({ ...filters, begindatumVan: null, begindatumTot: null })}
              >
                Begindatum: {filters.begindatumVan || "..."} - {filters.begindatumTot || "..."}
                <X className="w-3 h-3" />
              </Badge>
            )}
            
            {(filters.deadlineVan || filters.deadlineTot) && (
              <Badge 
                variant="secondary" 
                className="gap-1 cursor-pointer hover:bg-secondary/80" 
                onClick={() => onFiltersChange({ ...filters, deadlineVan: null, deadlineTot: null })}
              >
                Deadline: {filters.deadlineVan || "..."} - {filters.deadlineTot || "..."}
                <X className="w-3 h-3" />
              </Badge>
            )}
          </div>
        )}

        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t border-border">
            {/* Zoeken */}
            <div className="space-y-2">
              <Label>Zoeken</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Zoek op titel of beschrijving..."
                  value={filters.search}
                  onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
                {filters.search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => onFiltersChange({ ...filters, search: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="space-y-2">
                <Label>Prioriteit</Label>
                <div className="flex flex-col gap-2">
                  {ALL_PRIORITIES.map((priority) => (
                    <div key={priority} className="flex items-center gap-2">
                      <Checkbox
                        id={`priority-${priority}`}
                        checked={filters.priorities.includes(priority)}
                        onCheckedChange={() => togglePriority(priority)}
                      />
                      <label
                        htmlFor={`priority-${priority}`}
                        className="text-sm cursor-pointer"
                      >
                        {priority}
                      </label>
                    </div>
                  ))}
                </div>
              </div>


              {/* Taaktype */}
              {availableTaskTypes.length > 0 && (
                <div className="space-y-2">
                  <Label>Taaktype</Label>
                  <div className="flex flex-col gap-2">
                    {availableTaskTypes.map((taskType) => {
                      const IconComponent = taskTypeIconMap[taskType.icoon] || DefaultTaskTypeIcon;
                      return (
                        <div key={taskType.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`type-${taskType.id}`}
                            checked={filters.taskTypes.includes(taskType.id)}
                            onCheckedChange={() => toggleTaskType(taskType.id)}
                          />
                          <IconComponent className={`h-4 w-4 ${getTaskTypeIconColor(taskType.kleur)}`} />
                          <label
                            htmlFor={`type-${taskType.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {taskType.naam}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verantwoordelijke */}
              <div className="space-y-2">
                <Label>Verantwoordelijke</Label>
                <AutocompleteInput
                  placeholder="Zoek op naam..."
                  value={filters.verantwoordelijke || ""}
                  onChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      verantwoordelijke: value || null,
                    })
                  }
                  suggestions={availableVerantwoordelijken}
                />
              </div>

              {/* Deel van huis */}
              <div className="space-y-2">
                <Label>Deel van huis</Label>
                <AutocompleteInput
                  placeholder="Zoek op locatie..."
                  value={filters.deelVanHuis || ""}
                  onChange={(value) =>
                    onFiltersChange({
                      ...filters,
                      deelVanHuis: value || null,
                    })
                  }
                  suggestions={availableDelenVanHuis}
                />
              </div>

              {/* Begindatum */}
              <div className="space-y-2">
                <Label>Begindatum</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={filters.begindatumVan || ""}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, begindatumVan: e.target.value || null })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={filters.begindatumTot || ""}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, begindatumTot: e.target.value || null })
                    }
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-2">
                <Label>Deadline</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    type="date"
                    value={filters.deadlineVan || ""}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, deadlineVan: e.target.value || null })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground">-</span>
                  <Input
                    type="date"
                    value={filters.deadlineTot || ""}
                    onChange={(e) =>
                      onFiltersChange({ ...filters, deadlineTot: e.target.value || null })
                    }
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
