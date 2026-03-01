import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const MAINTENANCE_STATUSES = ["Nog doen", "Mee bezig", "Gedaan", "On hold"] as const;
export type MaintenanceStatusValue = typeof MAINTENANCE_STATUSES[number];

const STATUS_CONFIG: Record<MaintenanceStatusValue, { className: string }> = {
  "Nog doen": { className: "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300" },
  "Mee bezig": { className: "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-300" },
  "Gedaan": { className: "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-300" },
  "On hold": { className: "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400" },
};

interface MaintenanceStatusBadgeProps {
  instructionId: string;
  projectId: string;
  currentStatus: string;
}

export function MaintenanceStatusBadge({ instructionId, projectId, currentStatus }: MaintenanceStatusBadgeProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const statusLabels: Record<MaintenanceStatusValue, string> = {
    "Nog doen": t.management.maintenance.status.todo,
    "Mee bezig": t.management.maintenance.status.inProgress,
    "Gedaan": t.management.maintenance.status.done,
    "On hold": t.management.maintenance.status.onHold,
  };

  const status = (MAINTENANCE_STATUSES.includes(currentStatus as MaintenanceStatusValue) 
    ? currentStatus 
    : "Nog doen") as MaintenanceStatusValue;

  const handleStatusChange = async (newStatus: MaintenanceStatusValue) => {
    if (newStatus === status) return;
    
    try {
      const { error } = await supabase
        .from("maintenance_instructions" as any)
        .update({ status: newStatus })
        .eq("id", instructionId);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["maintenance-instructions", projectId] });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || t.errors.generic);
    }
  };

  const config = STATUS_CONFIG[status];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
        <Badge
          className={`cursor-pointer select-none min-h-[32px] sm:min-h-[28px] px-2.5 py-1 text-xs font-medium border-0 ${config.className}`}
        >
          {statusLabels[status]}
          <ChevronDown className="ml-1 h-3 w-3" />
        </Badge>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
        {MAINTENANCE_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onClick={() => handleStatusChange(s)}
            className="min-h-[44px] touch-manipulation"
          >
            <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${
              s === "Nog doen" ? "bg-blue-500" :
              s === "Mee bezig" ? "bg-orange-500" :
              s === "Gedaan" ? "bg-green-500" :
              "bg-gray-400"
            }`} />
            {statusLabels[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
