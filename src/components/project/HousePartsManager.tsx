import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Link } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { HousePartDetailDialog } from "./HousePartDetailDialog";

interface HousePart {
  id: string;
  naam: string;
  volgorde: number;
}

interface HousePartsManagerProps {
  projectId: string;
}

async function checkHousePartUsage(projectId: string, naam: string) {
  const [tasks, costs, photos, maintenance, keys] = await Promise.all([
    (supabase as any).from("tasks").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("deel_van_huis", naam),
    (supabase as any).from("costs").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("deel_van_huis", naam),
    (supabase as any).from("photos").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("deel_van_huis", naam),
    (supabase as any).from("maintenance_instructions").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("deel_van_huis", naam),
    (supabase as any).from("keys").select("*", { count: "exact", head: true }).eq("project_id", projectId).eq("deel_van_huis", naam),
  ]);

  return {
    tasks: tasks.count || 0,
    costs: costs.count || 0,
    photos: photos.count || 0,
    maintenance: maintenance.count || 0,
    keys: keys.count || 0,
  };
}

export function HousePartsManager({ projectId }: HousePartsManagerProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [localParts, setLocalParts] = useState<HousePart[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [checkingUsage, setCheckingUsage] = useState<number | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["house-parts", projectId],
    queryFn: async () => {
      await supabase.rpc("initialize_house_parts", { p_project_id: projectId });

      const { data, error } = await (supabase as any)
        .from("house_parts")
        .select("*")
        .eq("project_id", projectId)
        .order("naam");

      if (error) throw error;
      return (data || []) as HousePart[];
    },
  });

  useEffect(() => {
    setLocalParts([...parts].sort((a, b) => a.naam.localeCompare(b.naam)));
    setHasChanges(false);
  }, [parts]);

  // Fetch counts for each existing part
  const { data: partCounts = {} } = useQuery({
    queryKey: ["house-part-counts", projectId, parts.map((p) => p.naam).join(",")],
    queryFn: async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        parts.map(async (part) => {
          const usage = await checkHousePartUsage(projectId, part.naam);
          counts[part.naam] = usage.tasks + usage.costs + usage.photos + usage.maintenance + usage.keys;
        })
      );
      return counts;
    },
    enabled: parts.length > 0,
  });

  const saveParts = useMutation({
    mutationFn: async (partsToSave: HousePart[]) => {
      // Check if any removed parts are still in use
      const removedNames = parts
        .map((p) => p.naam)
        .filter((naam) => !partsToSave.some((s) => s.naam === naam));

      for (const naam of removedNames) {
        const usage = await checkHousePartUsage(projectId, naam);
        const total = usage.tasks + usage.costs + usage.photos + usage.maintenance + usage.keys;
        if (total > 0) {
          const details = formatUsageDetails(usage, t);
          throw new Error(
            t.management.houseParts.messages.inUse
              .replace("{name}", naam)
              .replace("{details}", details)
          );
        }
      }

      const { error: deleteError } = await (supabase as any)
        .from("house_parts")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      if (partsToSave.length > 0) {
        const { error: insertError } = await (supabase as any)
          .from("house_parts")
          .insert(
            partsToSave.map((p) => ({
              project_id: projectId,
              naam: p.naam,
              volgorde: 0,
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
      toast.error(error.message || t.errors.generic);
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
    const updated = [
      ...localParts,
      { id: `new-${Date.now()}`, naam: name, volgorde: 0 },
    ].sort((a, b) => a.naam.localeCompare(b.naam));
    setLocalParts(updated);
    setNewPartName("");
    setHasChanges(true);
  };

  const handleDelete = async (index: number) => {
    const part = localParts[index];
    // Only check usage for existing parts (not newly added ones)
    if (!part.id.startsWith("new-")) {
      setCheckingUsage(index);
      try {
        const usage = await checkHousePartUsage(projectId, part.naam);
        const total = usage.tasks + usage.costs + usage.photos + usage.maintenance + usage.keys;
        if (total > 0) {
          const details = formatUsageDetails(usage, t);
          toast.error(
            t.management.houseParts.messages.inUse
              .replace("{name}", part.naam)
              .replace("{details}", details)
          );
          return;
        }
      } finally {
        setCheckingUsage(null);
      }
    }
    setLocalParts(localParts.filter((_, i) => i !== index));
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
              <button
                type="button"
                className="flex-1 flex items-center gap-2 text-left min-w-0"
                onClick={() => !part.id.startsWith("new-") && setSelectedPart(part.naam)}
              >
                <Input
                  value={part.naam}
                  onChange={(e) => { e.stopPropagation(); handleUpdateName(index, e.target.value); }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 h-9 bg-background"
                />
                {!part.id.startsWith("new-") && (partCounts[part.naam] ?? 0) > 0 && (
                  <Badge
                    variant="secondary"
                    className="shrink-0 cursor-pointer text-xs gap-1"
                  >
                    <Link className="h-3 w-3" />
                    {partCounts[part.naam]}
                  </Badge>
                )}
              </button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-destructive hover:text-destructive"
                onClick={() => handleDelete(index)}
                disabled={checkingUsage === index}
              >
                {checkingUsage === index ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
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

      <HousePartDetailDialog
        projectId={projectId}
        partName={selectedPart || ""}
        open={!!selectedPart}
        onOpenChange={(open) => !open && setSelectedPart(null)}
      />
    </div>
  );
}

function formatUsageDetails(
  usage: { tasks: number; costs: number; photos: number; maintenance: number; keys: number },
  t: any
) {
  const parts: string[] = [];
  const e = t.management.houseParts.entities;
  if (usage.tasks > 0) parts.push(`${usage.tasks} ${e.tasks}`);
  if (usage.costs > 0) parts.push(`${usage.costs} ${e.costs}`);
  if (usage.photos > 0) parts.push(`${usage.photos} ${e.photos}`);
  if (usage.maintenance > 0) parts.push(`${usage.maintenance} ${e.maintenance}`);
  if (usage.keys > 0) parts.push(`${usage.keys} ${e.keys}`);
  return parts.join(", ");
}