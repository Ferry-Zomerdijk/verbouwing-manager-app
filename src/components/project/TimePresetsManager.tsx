import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, RotateCcw, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimePreset {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
  color: string;
}

interface TimePresetsManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PRESET_COLORS = {
  lightgreen: { label: "Licht Groen", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-400" },
  green: { label: "Groen (Aanwezig)", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-300", dot: "bg-green-500" },
  blue: { label: "Blauw", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-300", dot: "bg-blue-500" },
  yellow: { label: "Geel", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-300", dot: "bg-yellow-500" },
  orange: { label: "Oranje", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-800 dark:text-orange-300", dot: "bg-orange-500" },
  purple: { label: "Paars", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-300", dot: "bg-purple-500" },
  pink: { label: "Roze", bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-800 dark:text-pink-300", dot: "bg-pink-500" },
  gray: { label: "Grijs", bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-300", dot: "bg-gray-500" },
};

const DEFAULT_PRESETS = [
  { label: "Ochtend", start_time: "07:30", end_time: "12:00", sort_order: 0, color: "lightgreen" },
  { label: "Middag", start_time: "12:30", end_time: "16:30", sort_order: 1, color: "lightgreen" },
  { label: "Hele dag", start_time: "07:30", end_time: "16:30", sort_order: 2, color: "green" },
  { label: "Korte dag", start_time: "07:30", end_time: "14:00", sort_order: 3, color: "blue" },
  { label: "Avond", start_time: "16:30", end_time: "21:00", sort_order: 4, color: "purple" },
];

export function TimePresetsManager({ projectId, open, onOpenChange }: TimePresetsManagerProps) {
  const queryClient = useQueryClient();
  const [localPresets, setLocalPresets] = useState<TimePreset[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: presets = [], isLoading } = useQuery({
    queryKey: ["attendance-presets", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("attendance_time_presets")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order");

      if (error) throw error;
      return data as TimePreset[];
    },
    enabled: open,
  });

  // Sync local state when presets load
  useState(() => {
    if (presets.length > 0 && localPresets.length === 0) {
      setLocalPresets(presets);
    }
  });

  // Update local state when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalPresets(presets.length > 0 ? presets : []);
      setHasChanges(false);
    }
    onOpenChange(newOpen);
  };

  const savePresets = useMutation({
    mutationFn: async (presetsToSave: Omit<TimePreset, "id">[]) => {
      // Delete all existing presets for this project
      const { error: deleteError } = await supabase
        .from("attendance_time_presets")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) throw deleteError;

      // Insert new presets
      if (presetsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from("attendance_time_presets")
          .insert(
            presetsToSave.map((p, index) => ({
              project_id: projectId,
              label: p.label,
              start_time: p.start_time,
              end_time: p.end_time,
              sort_order: index,
              color: p.color || "gray",
            }))
          );

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-presets", projectId] });
      toast.success("Werktijden opgeslagen");
      setHasChanges(false);
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving presets:", error);
      toast.error("Fout bij opslaan werktijden");
    },
  });

  const handleUpdatePreset = (index: number, field: keyof TimePreset, value: string) => {
    const updated = [...localPresets];
    updated[index] = { ...updated[index], [field]: value };
    setLocalPresets(updated);
    setHasChanges(true);
  };

  const handleAddPreset = () => {
    setLocalPresets([
      ...localPresets,
      {
        id: `new-${Date.now()}`,
        label: "Nieuwe tijd",
        start_time: "08:00",
        end_time: "16:00",
        sort_order: localPresets.length,
        color: "gray",
      },
    ]);
    setHasChanges(true);
  };

  const handleDeletePreset = (index: number) => {
    const updated = localPresets.filter((_, i) => i !== index);
    setLocalPresets(updated);
    setHasChanges(true);
  };

  const handleResetToDefault = () => {
    setLocalPresets(
      DEFAULT_PRESETS.map((p, index) => ({
        ...p,
        id: `default-${index}`,
        color: p.color,
      }))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    savePresets.mutate(localPresets);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localPresets];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalPresets(updated);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === localPresets.length - 1) return;
    const updated = [...localPresets];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalPresets(updated);
    setHasChanges(true);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Werktijden Configureren</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto py-2">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Laden...</div>
          ) : localPresets.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Geen werktijden geconfigureerd.
              <br />
              Voeg er een toe of reset naar standaard.
            </div>
          ) : (
            localPresets.map((preset, index) => (
              <div
                key={preset.id}
                className={cn(
                  "flex flex-col gap-2 p-3 rounded-lg border",
                  PRESET_COLORS[preset.color as keyof typeof PRESET_COLORS]?.bg || "bg-muted/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === localPresets.length - 1}
                    >
                      <GripVertical className="h-3 w-3 rotate-90" />
                    </Button>
                  </div>
                  <Input
                    value={preset.label}
                    onChange={(e) => handleUpdatePreset(index, "label", e.target.value)}
                    placeholder="Label"
                    className="flex-1 h-9 bg-background"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive hover:text-destructive"
                    onClick={() => handleDeletePreset(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2 pl-10">
                  <Input
                    type="time"
                    value={preset.start_time}
                    onChange={(e) => handleUpdatePreset(index, "start_time", e.target.value)}
                    className="w-24 h-8 bg-background"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="time"
                    value={preset.end_time}
                    onChange={(e) => handleUpdatePreset(index, "end_time", e.target.value)}
                    className="w-24 h-8 bg-background"
                  />
                  <Select
                    value={preset.color || "gray"}
                    onValueChange={(value) => handleUpdatePreset(index, "color", value)}
                  >
                    <SelectTrigger className="w-32 h-8 bg-background">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          PRESET_COLORS[preset.color as keyof typeof PRESET_COLORS]?.dot || "bg-gray-500"
                        )} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRESET_COLORS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <div className={cn("w-3 h-3 rounded-full", value.dot)} />
                            {value.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleAddPreset}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe werktijd toevoegen
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
              disabled={!hasChanges || savePresets.isPending}
            >
              {savePresets.isPending ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
