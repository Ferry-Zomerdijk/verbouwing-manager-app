import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, GripVertical, Lock, Pencil, X, Check } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DocumentTypesManagerProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocumentType {
  id: string;
  project_id: string;
  naam: string;
  kleur: string;
  volgorde: number;
  is_systeem: boolean;
  created_at: string;
}

const colorOptions = [
  { value: "blue", label: "Blauw", class: "bg-blue-500" },
  { value: "green", label: "Groen", class: "bg-green-500" },
  { value: "yellow", label: "Geel", class: "bg-yellow-500" },
  { value: "red", label: "Rood", class: "bg-red-500" },
  { value: "purple", label: "Paars", class: "bg-purple-500" },
  { value: "orange", label: "Oranje", class: "bg-orange-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "pink", label: "Roze", class: "bg-pink-500" },
  { value: "gray", label: "Grijs", class: "bg-gray-500" },
];

const getColorClass = (colorValue: string) => {
  const color = colorOptions.find(c => c.value === colorValue);
  return color?.class || "bg-gray-500";
};

const DocumentTypesManager = ({ projectId, open, onOpenChange }: DocumentTypesManagerProps) => {
  const queryClient = useQueryClient();
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeColor, setNewTypeColor] = useState("blue");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: documentTypes, refetch } = useQuery({
    queryKey: ["document-types", projectId],
    queryFn: async () => {
      // First, initialize default types if needed
      await supabase.rpc("initialize_document_types", { p_project_id: projectId });
      
      const { data, error } = await supabase
        .from("document_types")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde");
      
      if (error) throw error;
      return data as DocumentType[];
    },
    enabled: open,
  });

  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    
    setAdding(true);
    try {
      const maxVolgorde = documentTypes?.reduce((max, t) => Math.max(max, t.volgorde), 0) || 0;
      
      const { error } = await supabase.from("document_types").insert({
        project_id: projectId,
        naam: newTypeName.trim(),
        kleur: newTypeColor,
        volgorde: maxVolgorde + 1,
        is_systeem: false,
      });

      if (error) throw error;

      toast.success("Document type toegevoegd");
      setNewTypeName("");
      setNewTypeColor("blue");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["document-types", projectId] });
    } catch (error: any) {
      toast.error(error.message || "Kon type niet toevoegen");
    } finally {
      setAdding(false);
    }
  };

  const handleStartEdit = (type: DocumentType) => {
    setEditingId(type.id);
    setEditName(type.naam);
    setEditColor(type.kleur);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  const handleSaveEdit = async (typeId: string) => {
    if (!editName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("document_types")
        .update({ naam: editName.trim(), kleur: editColor })
        .eq("id", typeId);

      if (error) throw error;

      toast.success("Type bijgewerkt");
      setEditingId(null);
      refetch();
      queryClient.invalidateQueries({ queryKey: ["document-types", projectId] });
    } catch (error: any) {
      toast.error(error.message || "Kon type niet bijwerken");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: DocumentType) => {
    if (type.is_systeem) {
      toast.error("Systeemtypes kunnen niet worden verwijderd");
      return;
    }

    setDeleting(type.id);
    try {
      const { error } = await supabase
        .from("document_types")
        .delete()
        .eq("id", type.id);

      if (error) throw error;

      toast.success("Type verwijderd");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["document-types", projectId] });
    } catch (error: any) {
      toast.error(error.message || "Kon type niet verwijderen");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Documenttypes beheren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new type */}
          <div className="space-y-2">
            <Label>Nieuw type toevoegen</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Type naam..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTypeName.trim()) {
                    handleAddType();
                  }
                }}
              />
              <div className="flex items-center gap-1 border rounded-md p-1">
                {colorOptions.slice(0, 5).map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-6 h-6 rounded ${color.class} ${
                      newTypeColor === color.value ? "ring-2 ring-offset-2 ring-primary" : ""
                    }`}
                    onClick={() => setNewTypeColor(color.value)}
                    title={color.label}
                  />
                ))}
              </div>
              <Button
                onClick={handleAddType}
                disabled={adding || !newTypeName.trim()}
                size="icon"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Types list */}
          <div className="space-y-2">
            <Label>Bestaande types</Label>
            <ScrollArea className="h-[300px] border rounded-lg">
              <div className="p-2 space-y-1">
                {documentTypes?.map((type) => (
                  <div
                    key={type.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group"
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    
                    {editingId === type.id ? (
                      <>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 flex-1"
                          autoFocus
                        />
                        <div className="flex items-center gap-0.5 border rounded p-0.5">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              type="button"
                              className={`w-5 h-5 rounded ${color.class} ${
                                editColor === color.value ? "ring-2 ring-offset-1 ring-primary" : ""
                              }`}
                              onClick={() => setEditColor(color.value)}
                              title={color.label}
                            />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveEdit(type.id)}
                          disabled={saving || !editName.trim()}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-8 w-8 p-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className={`w-4 h-4 rounded ${getColorClass(type.kleur)}`} />
                        <span className="flex-1 text-sm">{type.naam}</span>
                        {type.is_systeem && (
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(type)}
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {!type.is_systeem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(type)}
                            disabled={deleting === type.id}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <p className="text-xs text-muted-foreground">
            <Lock className="w-3 h-3 inline mr-1" />
            Systeemtypes kunnen bewerkt maar niet verwijderd worden.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentTypesManager;
