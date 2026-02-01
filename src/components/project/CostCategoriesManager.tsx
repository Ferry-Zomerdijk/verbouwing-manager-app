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
import { Plus, Trash2, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface CostCategory {
  id: string;
  naam: string;
  kleur: string;
  volgorde: number;
}

interface CostCategoriesManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CATEGORIES = [
  { naam: "Materiaal", kleur: "blue", volgorde: 0 },
  { naam: "Arbeid", kleur: "purple", volgorde: 1 },
  { naam: "Vergunningen", kleur: "orange", volgorde: 2 },
  { naam: "Kluswerkzaamheden", kleur: "green", volgorde: 3 },
  { naam: "Decoratie", kleur: "pink", volgorde: 4 },
  { naam: "Meubels", kleur: "amber", volgorde: 5 },
  { naam: "Overig", kleur: "gray", volgorde: 6 },
];

// Color to hex mapping for charts
export const CATEGORY_COLOR_MAP: Record<string, string> = {
  blue: "#3b82f6",
  purple: "#a855f7",
  orange: "#f97316",
  green: "#22c55e",
  pink: "#ec4899",
  amber: "#f59e0b",
  gray: "#6b7280",
  red: "#ef4444",
  cyan: "#06b6d4",
  yellow: "#eab308",
};

export function CostCategoriesManager({ projectId, open, onOpenChange }: CostCategoriesManagerProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [localCategories, setLocalCategories] = useState<CostCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["cost-categories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde");

      if (error) throw error;
      return data as CostCategory[];
    },
    enabled: open,
  });

  // Update local state when dialog opens or categories load
  useEffect(() => {
    if (open) {
      if (categories.length > 0) {
        setLocalCategories(categories);
      } else {
        // If no categories exist, show defaults
        setLocalCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `default-${i}` })));
      }
      setHasChanges(false);
    }
  }, [open, categories]);

  const saveCategories = useMutation({
    mutationFn: async (categoriesToSave: Omit<CostCategory, "id">[]) => {
      // Delete all existing categories for this project
      const { error: deleteError } = await supabase
        .from("cost_categories")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      // Insert new categories
      if (categoriesToSave.length > 0) {
        const { error: insertError } = await supabase
          .from("cost_categories")
          .insert(
            categoriesToSave.map((c, index) => ({
              project_id: projectId,
              naam: c.naam,
              kleur: c.kleur,
              volgorde: index,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cost-categories", projectId] });
      toast.success(t.costs.messages.updated);
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving categories:", error);
      toast.error(t.errors.generic);
    },
  });

  const handleUpdateCategory = (index: number, field: keyof CostCategory, value: string) => {
    const updated = [...localCategories];
    updated[index] = { ...updated[index], [field]: value };
    setLocalCategories(updated);
    setHasChanges(true);
  };

  const handleAddCategory = () => {
    setLocalCategories([
      ...localCategories,
      {
        id: `new-${Date.now()}`,
        naam: "",
        kleur: "gray",
        volgorde: localCategories.length,
      },
    ]);
    setHasChanges(true);
  };

  const handleDeleteCategory = (index: number) => {
    const updated = localCategories.filter((_, i) => i !== index);
    setLocalCategories(updated);
    setHasChanges(true);
  };

  const handleResetToDefault = () => {
    setLocalCategories(DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: `default-${i}` })));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Filter out empty names
    const validCategories = localCategories.filter(c => c.naam.trim() !== "");
    if (validCategories.length === 0) {
      toast.error("Voeg minimaal één rubriek toe");
      return;
    }
    saveCategories.mutate(validCategories);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localCategories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalCategories(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localCategories.length - 1) return;
    const updated = [...localCategories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalCategories(updated);
    setHasChanges(true);
  };

  const colorOptions = Object.keys(CATEGORY_COLOR_MAP);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rubrieken beheren</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Configureer rubrieken voor je kosten. Deze verschijnen in de categorie dropdown en bepalen de kleuren in grafieken.
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Laden...</div>
          ) : localCategories.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Geen rubrieken geconfigureerd.
              <br />
              Voeg er een toe of reset naar standaard.
            </div>
          ) : (
            localCategories.map((category, index) => (
              <div
                key={category.id}
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
                    disabled={index === localCategories.length - 1}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Color indicator */}
                <div 
                  className="w-4 h-4 rounded-full flex-shrink-0 cursor-pointer"
                  style={{ backgroundColor: CATEGORY_COLOR_MAP[category.kleur] || CATEGORY_COLOR_MAP.gray }}
                  onClick={() => {
                    const currentIndex = colorOptions.indexOf(category.kleur);
                    const nextIndex = (currentIndex + 1) % colorOptions.length;
                    handleUpdateCategory(index, 'kleur', colorOptions[nextIndex]);
                  }}
                  title="Klik om kleur te wijzigen"
                />
                
                <Input
                  value={category.naam}
                  onChange={(e) => handleUpdateCategory(index, 'naam', e.target.value)}
                  placeholder="Naam rubriek"
                  className="flex-1 h-9 bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive"
                  onClick={() => handleDeleteCategory(index)}
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
            onClick={handleAddCategory}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe rubriek toevoegen
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
              disabled={!hasChanges || saveCategories.isPending}
            >
              {saveCategories.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook to get category options for a project
export function useCostCategories(projectId: string) {
  return useQuery({
    queryKey: ["cost-categories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde");

      if (error) throw error;
      
      // If no custom categories, return defaults
      if (data.length === 0) {
        return DEFAULT_CATEGORIES.map(c => ({
          naam: c.naam,
          kleur: c.kleur,
          chartColor: CATEGORY_COLOR_MAP[c.kleur] || CATEGORY_COLOR_MAP.gray,
        }));
      }
      
      return data.map(c => ({
        naam: c.naam,
        kleur: c.kleur,
        chartColor: CATEGORY_COLOR_MAP[c.kleur] || CATEGORY_COLOR_MAP.gray,
      }));
    },
  });
}
