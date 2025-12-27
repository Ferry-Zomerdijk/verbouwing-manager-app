import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Search, X, ChevronDown } from "lucide-react";

export interface TaskFiltersType {
  search: string;
  statuses: string[];
  priorities: string[];
  verantwoordelijke: string | null;
  deelVanHuis: string | null;
  begindatumVan: string | null;
  begindatumTot: string | null;
  deadlineVan: string | null;
  deadlineTot: string | null;
}

interface TaskFiltersProps {
  filters: TaskFiltersType;
  onFiltersChange: (filters: TaskFiltersType) => void;
  availableVerantwoordelijken: string[];
  availableDelenVanHuis: string[];
  activeCount: number;
}

const ALL_STATUSES = ["Te doen", "Bezig", "Gereed"];
const ALL_PRIORITIES = ["Laag", "Middel", "Hoog"];

export const TaskFilters = ({
  filters,
  onFiltersChange,
  availableVerantwoordelijken,
  availableDelenVanHuis,
  activeCount,
}: TaskFiltersProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleReset = () => {
    onFiltersChange({
      search: "",
      statuses: ALL_STATUSES,
      priorities: ALL_PRIORITIES,
      verantwoordelijke: null,
      deelVanHuis: null,
      begindatumVan: null,
      begindatumTot: null,
      deadlineVan: null,
      deadlineTot: null,
    });
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

        <CollapsibleContent>
          <div className="p-4 space-y-4 border-t border-border">
            {/* Search */}
            <div className="space-y-2">
              <Label>Zoeken</Label>
              <Input
                placeholder="Zoek op titel of beschrijving..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-col gap-2">
                  {ALL_STATUSES.map((status) => (
                    <div key={status} className="flex items-center gap-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.statuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <label
                        htmlFor={`status-${status}`}
                        className="text-sm cursor-pointer"
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

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

              {/* Verantwoordelijke */}
              <div className="space-y-2">
                <Label>Verantwoordelijke</Label>
                <Input
                  placeholder="Zoek op naam..."
                  value={filters.verantwoordelijke || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      verantwoordelijke: e.target.value || null,
                    })
                  }
                />
              </div>

              {/* Deel van huis */}
              <div className="space-y-2">
                <Label>Deel van huis</Label>
                <Input
                  placeholder="Zoek op locatie..."
                  value={filters.deelVanHuis || ""}
                  onChange={(e) =>
                    onFiltersChange({
                      ...filters,
                      deelVanHuis: e.target.value || null,
                    })
                  }
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
