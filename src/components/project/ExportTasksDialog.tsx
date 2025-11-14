import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FileDown, Download } from "lucide-react";
import { exportTasksToExcel, ExportTask, ExportFilters } from "@/lib/excelImport";

interface ExportTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: ExportTask[];
  projectName: string;
}

export const ExportTasksDialog = ({ open, onOpenChange, tasks, projectName }: ExportTasksDialogProps) => {
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['Te doen', 'Bezig', 'Gereed']);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const statuses = ['Te doen', 'Bezig', 'Gereed'];

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleSelectAll = () => {
    if (selectedStatuses.length === statuses.length) {
      setSelectedStatuses([]);
    } else {
      setSelectedStatuses([...statuses]);
    }
  };

  const filteredCount = useMemo(() => {
    let count = tasks.length;

    // Filter op status
    if (selectedStatuses.length > 0 && selectedStatuses.length < statuses.length) {
      count = tasks.filter(task => selectedStatuses.includes(task.status)).length;
    }

    // Filter op datumbereik
    let filtered = tasks;
    if (selectedStatuses.length > 0 && selectedStatuses.length < statuses.length) {
      filtered = filtered.filter(task => selectedStatuses.includes(task.status));
    }

    if (dateFrom) {
      filtered = filtered.filter(task => {
        if (!task.deadline) return false;
        return new Date(task.deadline) >= new Date(dateFrom);
      });
    }

    if (dateTo) {
      filtered = filtered.filter(task => {
        if (!task.deadline) return false;
        return new Date(task.deadline) <= new Date(dateTo);
      });
    }

    return filtered.length;
  }, [tasks, selectedStatuses, dateFrom, dateTo, statuses.length]);

  const handleExport = () => {
    const filters: ExportFilters = {
      statuses: selectedStatuses.length === statuses.length ? [] : selectedStatuses,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null
    };

    exportTasksToExcel(tasks, filters, projectName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-primary" />
            <DialogTitle>Taken Exporteren naar Excel</DialogTitle>
          </div>
          <DialogDescription>
            Selecteer filters om taken te exporteren naar een Excel bestand.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Status Filter</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-8 text-xs"
              >
                {selectedStatuses.length === statuses.length ? 'Deselecteer alles' : 'Selecteer alles'}
              </Button>
            </div>
            <div className="space-y-2">
              {statuses.map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={selectedStatuses.includes(status)}
                    onCheckedChange={() => handleStatusToggle(status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Datumbereik Filter */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Datumbereik (Einddatum)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-sm">Van</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-sm">Tot</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Preview Count */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Taken om te exporteren:
              </span>
              <span className="text-lg font-semibold text-foreground">
                {filteredCount} van {tasks.length}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button 
            onClick={handleExport}
            disabled={filteredCount === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exporteren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
