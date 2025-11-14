import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";

interface TaskBulkActionsProps {
  selectedTaskIds: string[];
  onSuccess: () => void;
}

export const TaskBulkActions = ({ selectedTaskIds, onSuccess }: TaskBulkActionsProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleBulkStatusChange = async (status: "Te doen" | "Bezig" | "Gereed") => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .in("id", selectedTaskIds);

      if (error) throw error;

      toast.success(`Status van ${selectedTaskIds.length} taken bijgewerkt`);
      onSuccess();
    } catch (error) {
      toast.error("Fout bij bijwerken van status");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkPriorityChange = async (prioriteit: "Laag" | "Middel" | "Hoog") => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ prioriteit })
        .in("id", selectedTaskIds);

      if (error) throw error;

      toast.success(`Prioriteit van ${selectedTaskIds.length} taken bijgewerkt`);
      onSuccess();
    } catch (error) {
      toast.error("Fout bij bijwerken van prioriteit");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkAssign = async (verantwoordelijke: string) => {
    if (!verantwoordelijke.trim()) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ verantwoordelijke })
        .in("id", selectedTaskIds);

      if (error) throw error;

      toast.success(`${selectedTaskIds.length} taken toegewezen aan ${verantwoordelijke}`);
      onSuccess();
    } catch (error) {
      toast.error("Fout bij toewijzen van verantwoordelijke");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", selectedTaskIds);

      if (error) throw error;

      toast.success(`${selectedTaskIds.length} taken verwijderd`);
      setShowDeleteConfirm(false);
      onSuccess();
    } catch (error) {
      toast.error("Fout bij verwijderen van taken");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <>
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
          <div className="text-sm font-medium">
            {selectedTaskIds.length} {selectedTaskIds.length === 1 ? "taak" : "taken"} geselecteerd
          </div>

          <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <Select onValueChange={handleBulkStatusChange} disabled={isUpdating}>
              <SelectTrigger className="w-full md:w-32 h-9">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Te doen">Te doen</SelectItem>
                <SelectItem value="Bezig">Bezig</SelectItem>
                <SelectItem value="Gereed">Gereed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handleBulkPriorityChange} disabled={isUpdating}>
              <SelectTrigger className="w-full md:w-32 h-9">
                <SelectValue placeholder="Prioriteit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Laag">Laag</SelectItem>
                <SelectItem value="Middel">Middel</SelectItem>
                <SelectItem value="Hoog">Hoog</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 w-full md:w-auto">
              <Input
                placeholder="Toewijzen aan..."
                className="h-9 w-full md:w-40"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleBulkAssign(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                disabled={isUpdating}
              />
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleBulkDelete}
        title="Taken verwijderen"
        itemName={`${selectedTaskIds.length} ${selectedTaskIds.length === 1 ? "taak" : "taken"}`}
        description="Deze actie kan niet ongedaan worden gemaakt."
      />
    </>
  );
};
