import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Loader2, Wrench, Phone, User, Clock, X, Paperclip } from "lucide-react";
import { CreateMaintenanceDialog } from "./CreateMaintenanceDialog";
import { EditMaintenanceDialog, type MaintenanceInstruction } from "./EditMaintenanceDialog";

interface MaintenanceInstructionsProps {
  projectId: string;
  isAdminOrOwner?: boolean;
}

export function MaintenanceInstructions({ projectId, isAdminOrOwner }: MaintenanceInstructionsProps) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedInstruction, setSelectedInstruction] = useState<MaintenanceInstruction | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MaintenanceInstruction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: instructions, isLoading } = useQuery({
    queryKey: ["maintenance-instructions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_instructions" as any)
        .select("*")
        .eq("project_id", projectId)
        .order("deel_van_huis", { ascending: true })
        .order("volgorde", { ascending: true });

      if (error) throw error;
      return data as unknown as MaintenanceInstruction[];
    },
    enabled: !!projectId,
  });

  const filtered = instructions?.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return [
      item.titel,
      item.beschrijving,
      item.deel_van_huis,
      item.frequentie,
      item.contact_naam,
      item.contact_telefoon,
    ].some((field) => field?.toLowerCase().includes(q));
  });

  const handleEdit = (item: MaintenanceInstruction) => {
    setSelectedInstruction(item);
    setEditOpen(true);
  };

  const handleDeleteClick = (item: MaintenanceInstruction) => {
    setToDelete(item);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!toDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("maintenance_instructions" as any)
        .delete()
        .eq("id", toDelete.id);
      if (error) throw error;
      toast.success(t.management.maintenance.messages.deleted);
      queryClient.invalidateQueries({ queryKey: ["maintenance-instructions", projectId] });
    } catch (error: any) {
      toast.error(error.message || t.errors.generic);
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
      setToDelete(null);
    }
  };

  // Group by deel_van_huis
  const grouped = filtered?.reduce((acc, item) => {
    const key = item.deel_van_huis || "Overig";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, MaintenanceInstruction[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with search and add button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.actions.search + "..."}
              className="pl-9 pr-9 h-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            <span className="hidden sm:inline">{t.management.maintenance.buttons.new}</span>
            <span className="sm:hidden">Nieuw</span>
          </Button>
        </div>

        {searchQuery && filtered && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "resultaat" : "resultaten"}
          </p>
        )}

        {/* Instructions list */}
        {!filtered || filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t.management.maintenance.messages.noInstructions}</p>
            <p className="text-sm mt-1">
              {t.management.maintenance.buttons.new}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped || {}).map(([group, items]) => (
              <div key={group}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{group}</Badge>
                  <span className="text-xs">({items.length})</span>
                </h3>
                <div className="space-y-2">
                  {items.map((item) => (
                    <Card key={item.id} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium">{item.titel}</h4>
                            {item.beschrijving && (
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line line-clamp-3">
                                {item.beschrijving}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                              {item.frequentie && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {item.frequentie}
                                </span>
                              )}
                              {item.contact_naam && (
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {item.contact_naam}
                                </span>
                              )}
                              {item.contact_telefoon && (
                                <a
                                  href={`tel:${item.contact_telefoon}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Phone className="h-3 w-3" />
                                  {item.contact_telefoon}
                                </a>
                              )}
                              {(item.bijlage_url || item.document_id) && (
                                <a
                                  href={item.bijlage_url || "#"}
                                  target={item.bijlage_url ? "_blank" : undefined}
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-primary hover:underline"
                                  onClick={(e) => {
                                    if (!item.bijlage_url && item.document_id) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {t.management.maintenance.labels.attachment}
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {isAdminOrOwner && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(item)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateMaintenanceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        projectId={projectId}
      />

      <EditMaintenanceDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        instruction={selectedInstruction}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmations.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmations.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
