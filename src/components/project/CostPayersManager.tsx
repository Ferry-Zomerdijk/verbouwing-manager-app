import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, RotateCcw, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface CostPayer {
  id: string;
  naam: string;
  sort_order: number;
}

interface CostPayersManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_PAYERS = [
  { naam: "Ron", sort_order: 0 },
  { naam: "Monique", sort_order: 1 },
  { naam: "Gezamenlijk", sort_order: 2 },
  { naam: "Ntb", sort_order: 3 },
];

export function CostPayersManager({ projectId, open, onOpenChange }: CostPayersManagerProps) {
  const queryClient = useQueryClient();
  const [localPayers, setLocalPayers] = useState<CostPayer[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: payers = [], isLoading } = useQuery({
    queryKey: ["cost-payers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_payers")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      return data as CostPayer[];
    },
    enabled: open,
  });

  // Update local state when dialog opens or payers load
  useEffect(() => {
    if (open && !isLoading) {
      if (payers && payers.length > 0) {
        setLocalPayers(payers);
      } else {
        // If no payers exist, show defaults
        setLocalPayers(DEFAULT_PAYERS.map((p, i) => ({ ...p, id: `default-${i}` })));
      }
      setHasChanges(false);
    }
  }, [open, payers, isLoading]);

  const savePayers = useMutation({
    mutationFn: async (payersToSave: Omit<CostPayer, "id">[]) => {
      // Delete all existing payers for this project
      const { error: deleteError } = await supabase
        .from("cost_payers")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      // Insert new payers
      if (payersToSave.length > 0) {
        const { error: insertError } = await supabase
          .from("cost_payers")
          .insert(
            payersToSave.map((p, index) => ({
              project_id: projectId,
              naam: p.naam,
              sort_order: index,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-payers", projectId] });
      queryClient.invalidateQueries({ queryKey: ["cost-payer-names", projectId] });
      toast.success("Betalers opgeslagen");
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving payers:", error);
      toast.error("Fout bij opslaan betalers");
    },
  });

  const handleUpdatePayer = (index: number, naam: string) => {
    const updated = [...localPayers];
    updated[index] = { ...updated[index], naam };
    setLocalPayers(updated);
    setHasChanges(true);
  };

  const handleAddPayer = () => {
    setLocalPayers([
      ...localPayers,
      {
        id: `new-${Date.now()}`,
        naam: "",
        sort_order: localPayers.length,
      },
    ]);
    setHasChanges(true);
  };

  const handleDeletePayer = (index: number) => {
    const updated = localPayers.filter((_, i) => i !== index);
    setLocalPayers(updated);
    setHasChanges(true);
  };

  const handleResetToDefault = () => {
    setLocalPayers(DEFAULT_PAYERS.map((p, i) => ({ ...p, id: `default-${i}` })));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Filter out empty names
    const validPayers = localPayers.filter(p => p.naam.trim() !== "");
    if (validPayers.length === 0) {
      toast.error("Voeg minimaal één betaler toe");
      return;
    }
    savePayers.mutate(validPayers);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localPayers];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalPayers(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localPayers.length - 1) return;
    const updated = [...localPayers];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalPayers(updated);
    setHasChanges(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Betalers beheren</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Configureer wie kosten kan betalen. Deze opties verschijnen in de 'Betaald door' dropdown bij kosten.
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Laden...</div>
          ) : localPayers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Geen betalers geconfigureerd.
              <br />
              Voeg er een toe of reset naar standaard.
            </div>
          ) : (
            localPayers.map((payer, index) => (
              <div
                key={payer.id}
                className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30"
              >
                <div className="flex flex-col gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === localPayers.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={payer.naam}
                  onChange={(e) => handleUpdatePayer(index, e.target.value)}
                  placeholder="Naam betaler"
                  className="flex-1 h-9 bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => handleDeletePayer(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleAddPayer}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe betaler toevoegen
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleResetToDefault}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Standaard
          </Button>
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || savePayers.isPending}
            >
              {savePayers.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to get payer options for a project
export function useCostPayers(projectId: string) {
  return useQuery({
    queryKey: ["cost-payer-names", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_payers")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      
      // If no custom payers, return defaults
      if (data.length === 0) {
        return DEFAULT_PAYERS.map(p => p.naam);
      }
      
      return data.map(p => p.naam);
    },
  });
}
