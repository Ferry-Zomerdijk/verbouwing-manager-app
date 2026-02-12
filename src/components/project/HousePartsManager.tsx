import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface HousePart {
  id: string;
  naam: string;
  volgorde: number;
}

interface HousePartsManagerProps {
  projectId: string;
}

export function HousePartsManager({ projectId }: HousePartsManagerProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [localParts, setLocalParts] = useState<HousePart[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newPartName, setNewPartName] = useState("");

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["house-parts", projectId],
    queryFn: async () => {
      // Initialize if needed
      await supabase.rpc("initialize_house_parts", { p_project_id: projectId });

      const { data, error } = await (supabase as any)
        .from("house_parts")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde");

      if (error) throw error;
      return (data || []) as HousePart[];
    },
  });

  useEffect(() => {
    setLocalParts(parts);
    setHasChanges(false);
  }, [parts]);

  const saveParts = useMutation({
    mutationFn: async (partsToSave: HousePart[]) => {
      // Delete all existing
      const { error: deleteError } = await (supabase as any)
        .from("house_parts")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      if (partsToSave.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from("house_parts")
          .insert(
            partsToSave.map((p, index) => ({
              project_id: projectId,
              naam: p.naam,
              volgorde: index,
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["house-parts", projectId] });
      toast.success(t.management.houseParts.messages.saved);
      setHasChanges(false);
    },
    onError: (error) => {
      console.error("Error saving house parts:", error);
      toast.error(t.errors.generic);
    },
  });

  const handleUpdateName = (index: number, naam: string) => {
    const updated = [...localParts];
    updated[index] = { ...updated[index], naam };
    setLocalParts(updated);
    setHasChanges(true);
  };

  const handleAdd = () => {
    const name = newPartName.trim();
    if (!name) return;
    if (localParts.some((p) => p.naam.toLowerCase() === name.toLowerCase())) {
      toast.error(t.management.houseParts.messages.duplicate);
      return;
    }
    setLocalParts([
      ...localParts,
      { id: `new-${Date.now()}`, naam: name, volgorde: localParts.length },
    ]);
    setNewPartName("");
    setHasChanges(true);
  };

  const handleDelete = (index: number) => {
    setLocalParts(localParts.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localParts];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalParts(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localParts.length - 1) return;
    const updated = [...localParts];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalParts(updated);
    setHasChanges(true);
  };

  const handleSave = () => {
    const valid = localParts.filter((p) => p.naam.trim() !== "");
    if (valid.length === 0) {
      toast.error(t.management.houseParts.messages.minOne);
      return;
    }
    saveParts.mutate(valid);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t.management.houseParts.description}
      </p>

      <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">{t.actions.loading}</div>
        ) : (
          localParts.map((part, index) => (
            <div
              key={part.id}
              className="flex items-center gap-1.5 p-1.5 rounded-lg border bg-muted/30"
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
                  disabled={index === localParts.length - 1}
                >
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </div>

              <Input
                value={part.naam}
                onChange={(e) => handleUpdateName(index, e.target.value)}
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
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <Input
          value={newPartName}
          onChange={(e) => setNewPartName(e.target.value)}
          placeholder={t.management.houseParts.placeholder}
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button type="button" variant="outline" onClick={handleAdd} disabled={!newPartName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          {t.actions.add}
        </Button>
      </div>

      {/* Save button */}
      {hasChanges && (
        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saveParts.isPending}>
            {saveParts.isPending ? t.actions.saving : t.actions.save}
          </Button>
        </div>
      )}
    </div>
  );
}
