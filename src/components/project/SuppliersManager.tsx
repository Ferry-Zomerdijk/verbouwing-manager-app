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
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface Supplier {
  id: string;
  naam: string;
  sort_order: number;
}

interface SuppliersManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuppliersManager({ projectId, open, onOpenChange }: SuppliersManagerProps) {
  const queryClient = useQueryClient();
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      return data as unknown as Supplier[];
    },
    enabled: open,
  });

  useEffect(() => {
    if (open && !isLoading) {
      setLocalSuppliers(suppliers);
      setHasChanges(false);
    }
  }, [open, suppliers, isLoading]);

  const saveSuppliers = useMutation({
    mutationFn: async (suppliersToSave: Omit<Supplier, "id">[]) => {
      const { error: deleteError } = await supabase
        .from("suppliers" as any)
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      if (suppliersToSave.length > 0) {
        const { error: insertError } = await supabase
          .from("suppliers" as any)
          .insert(
            suppliersToSave.map((s, index) => ({
              project_id: projectId,
              naam: s.naam,
              sort_order: index,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", projectId] });
      queryClient.invalidateQueries({ queryKey: ["supplier-names", projectId] });
      toast.success("Leveranciers opgeslagen");
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving suppliers:", error);
      toast.error("Fout bij opslaan leveranciers");
    },
  });

  const handleUpdate = (index: number, naam: string) => {
    const updated = [...localSuppliers];
    updated[index] = { ...updated[index], naam };
    setLocalSuppliers(updated);
    setHasChanges(true);
  };

  const handleAdd = () => {
    setLocalSuppliers([
      ...localSuppliers,
      { id: `new-${Date.now()}`, naam: "", sort_order: localSuppliers.length },
    ]);
    setHasChanges(true);
  };

  const handleDelete = (index: number) => {
    setLocalSuppliers(localSuppliers.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localSuppliers];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalSuppliers(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localSuppliers.length - 1) return;
    const updated = [...localSuppliers];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalSuppliers(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    const valid = localSuppliers.filter(s => s.naam.trim() !== "");
    if (valid.length === 0) {
      toast.error("Voeg minimaal één leverancier toe");
      return;
    }
    // Check for duplicates
    const names = valid.map(s => s.naam.trim().toLowerCase());
    const hasDuplicates = names.length !== new Set(names).size;
    if (hasDuplicates) {
      toast.error("Leveranciersnamen moeten uniek zijn");
      return;
    }
    saveSuppliers.mutate(valid);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leveranciers beheren</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Beheer de leverancierslijst. Deze opties verschijnen in het leveranciersveld bij kosten.
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Laden...</div>
          ) : localSuppliers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Geen leveranciers geconfigureerd.
              <br />
              Voeg er een toe.
            </div>
          ) : (
            localSuppliers.map((supplier, index) => (
              <div
                key={supplier.id}
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
                    disabled={index === localSuppliers.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                <Input
                  value={supplier.naam}
                  onChange={(e) => handleUpdate(index, e.target.value)}
                  placeholder="Naam leverancier"
                  className="flex-1 h-9 bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(index)}
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
            onClick={handleAdd}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe leverancier toevoegen
          </Button>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1 sm:flex-none">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveSuppliers.isPending}
            >
              {saveSuppliers.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to get supplier names for a project
export function useSuppliers(projectId: string) {
  return useQuery({
    queryKey: ["supplier-names", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      return (data as unknown as { naam: string }[]).map(s => s.naam);
    },
  });
}

// Hook to add a supplier if it doesn't exist yet
export function useAddSupplier(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (naam: string) => {
      const { error } = await supabase
        .from("suppliers" as any)
        .insert({ project_id: projectId, naam, sort_order: 0 });

      // Ignore unique constraint violations (supplier already exists)
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers", projectId] });
      queryClient.invalidateQueries({ queryKey: ["supplier-names", projectId] });
    },
  });
}
