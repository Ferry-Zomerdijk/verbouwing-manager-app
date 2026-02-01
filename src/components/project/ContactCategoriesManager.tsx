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

interface ContactCategory {
  id: string;
  naam: string;
  volgorde: number;
}

interface ContactCategoriesManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CATEGORIES = [
  { naam: "Alarm & Beveiliging", volgorde: 0 },
  { naam: "Hekwerk & Toegang", volgorde: 1 },
  { naam: "Tuinonderhoud", volgorde: 2 },
  { naam: "Schilderwerk", volgorde: 3 },
  { naam: "Loodgieter", volgorde: 4 },
  { naam: "Elektricien", volgorde: 5 },
  { naam: "Jacuzzi & Wellness", volgorde: 6 },
  { naam: "Schoonmaak", volgorde: 7 },
  { naam: "Verwarming & Airco", volgorde: 8 },
  { naam: "Dakwerk", volgorde: 9 },
];

export function ContactCategoriesManager({ projectId, open, onOpenChange }: ContactCategoriesManagerProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [localCategories, setLocalCategories] = useState<ContactCategory[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["contact-categories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde");

      if (error) throw error;
      return data as ContactCategory[];
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
    mutationFn: async (categoriesToSave: Omit<ContactCategory, "id">[]) => {
      // Delete all existing categories for this project
      const { error: deleteError } = await supabase
        .from("contact_categories")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      // Insert new categories
      if (categoriesToSave.length > 0) {
        const { error: insertError } = await supabase
          .from("contact_categories")
          .insert(
            categoriesToSave.map((c, index) => ({
              project_id: projectId,
              naam: c.naam,
              volgorde: index,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-categories", projectId] });
      toast.success(t.contacts.messages.categoriesSaved);
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving categories:", error);
      toast.error(t.errors.generic);
    },
  });

  const handleUpdateCategory = (index: number, naam: string) => {
    const updated = [...localCategories];
    updated[index] = { ...updated[index], naam };
    setLocalCategories(updated);
    setHasChanges(true);
  };

  const handleAddCategory = () => {
    setLocalCategories([
      ...localCategories,
      {
        id: `new-${Date.now()}`,
        naam: "",
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
      toast.error(t.contacts.messages.minOneCategory);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.contacts.dialogs.categoriesManagerTitle}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t.contacts.dialogs.categoriesManagerDescription}
        </p>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto py-2">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">{t.actions.loading}</div>
          ) : localCategories.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              {t.contacts.messages.noContacts}
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
                <Input
                  value={category.naam}
                  onChange={(e) => handleUpdateCategory(index, e.target.value)}
                  placeholder={t.contacts.buttons.newCategory}
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
            {t.contacts.buttons.newCategory}
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
              {t.actions.cancel}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!hasChanges || saveCategories.isPending}
            >
              {saveCategories.isPending ? t.actions.saving : t.actions.save}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
