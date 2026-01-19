import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Lock, GripVertical, X, Check } from "lucide-react";
import { toast } from "sonner";

interface TaskTypesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TaskType {
  id: string;
  naam: string;
  kleur: string;
  icoon: string;
  volgorde: number;
  is_systeem: boolean;
}

const COLORS = [
  { value: "blue", label: "Blauw", class: "bg-blue-500" },
  { value: "orange", label: "Oranje", class: "bg-orange-500" },
  { value: "purple", label: "Paars", class: "bg-purple-500" },
  { value: "green", label: "Groen", class: "bg-green-500" },
  { value: "yellow", label: "Geel", class: "bg-yellow-500" },
  { value: "gray", label: "Grijs", class: "bg-gray-500" },
  { value: "red", label: "Rood", class: "bg-red-500" },
  { value: "pink", label: "Roze", class: "bg-pink-500" },
  { value: "cyan", label: "Cyaan", class: "bg-cyan-500" },
];

export const getTaskTypeColorClass = (kleur: string | null) => {
  const color = COLORS.find(c => c.value === kleur);
  return color?.class || "bg-gray-500";
};

export const TaskTypesManager = ({ open, onOpenChange }: TaskTypesManagerProps) => {
  const queryClient = useQueryClient();
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("gray");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const { data: taskTypes = [], isLoading } = useQuery({
    queryKey: ["task-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_types")
        .select("*")
        .order("volgorde", { ascending: true });

      if (error) throw error;
      return data as TaskType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ naam, kleur }: { naam: string; kleur: string }) => {
      const maxVolgorde = Math.max(...taskTypes.map(t => t.volgorde), 0);
      const { error } = await supabase
        .from("task_types")
        .insert({
          naam,
          kleur,
          volgorde: maxVolgorde + 1,
          is_systeem: false,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      setNewTypeName("");
      setNewTypeColor("gray");
      toast.success("Taaktype toegevoegd");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kon taaktype niet toevoegen");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, naam, kleur }: { id: string; naam: string; kleur: string }) => {
      const { error } = await supabase
        .from("task_types")
        .update({ naam, kleur })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      setEditingId(null);
      toast.success("Taaktype bijgewerkt");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kon taaktype niet bijwerken");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-types"] });
      toast.success("Taaktype verwijderd");
    },
    onError: (error: any) => {
      toast.error(error.message || "Kon taaktype niet verwijderen");
    },
  });

  const handleCreate = () => {
    if (!newTypeName.trim()) {
      toast.error("Vul een naam in");
      return;
    }
    createMutation.mutate({ naam: newTypeName.trim(), kleur: newTypeColor });
  };

  const handleStartEdit = (type: TaskType) => {
    setEditingId(type.id);
    setEditName(type.naam);
    setEditColor(type.kleur);
  };

  const handleSaveEdit = () => {
    if (!editingId || !editName.trim()) return;
    updateMutation.mutate({ id: editingId, naam: editName.trim(), kleur: editColor });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const handleDelete = (type: TaskType) => {
    if (type.is_systeem) {
      toast.error("Systeemtypes kunnen niet worden verwijderd");
      return;
    }
    if (!confirm(`Weet je zeker dat je "${type.naam}" wilt verwijderen?`)) return;
    deleteMutation.mutate(type.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Taaktypes Beheren</DialogTitle>
          <DialogDescription>
            Beheer de types die aan taken kunnen worden toegewezen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add new type */}
          <div className="space-y-3">
            <Label>Nieuw taaktype toevoegen</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Naam..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Select value={newTypeColor} onValueChange={setNewTypeColor}>
                <SelectTrigger className="w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getTaskTypeColorClass(newTypeColor)}`} />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color.class}`} />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending || !newTypeName.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Existing types */}
          <div className="space-y-2">
            <Label>Bestaande types</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : taskTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen taaktypes gevonden</p>
            ) : (
              <div className="space-y-2">
                {taskTypes.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    
                    {editingId === type.id ? (
                      // Editing mode
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 h-8"
                          autoFocus
                        />
                        <Select value={editColor} onValueChange={setEditColor}>
                          <SelectTrigger className="w-[100px] h-8">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getTaskTypeColorClass(editColor)}`} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {COLORS.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${color.class}`} />
                                  {color.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      // Display mode
                      <>
                        <Badge className={`${getTaskTypeColorClass(type.kleur)} text-white`}>
                          {type.naam}
                        </Badge>
                        {type.is_systeem && (
                          <Lock className="w-3 h-3 text-muted-foreground ml-1" />
                        )}
                        <div className="flex-1" />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleStartEdit(type)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {!type.is_systeem && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(type)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Lock className="w-3 h-3" />
              Systeemtypes kunnen worden aangepast, maar niet verwijderd.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskTypesManager;
