import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Key, Plus, Pencil, Trash2, Loader2, User, Calendar } from "lucide-react";
import { CreateKeyDialog } from "./CreateKeyDialog";
import { EditKeyHolderDialog } from "./EditKeyHolderDialog";

interface KeyManagementProps {
  projectId: string;
}

interface KeyData {
  id: string;
  key_number: string;
  deel_van_huis: string;
  sequence_number: number;
  current_holder: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  project_id: string;
}

export function KeyManagement({ projectId }: KeyManagementProps) {
  const queryClient = useQueryClient();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editHolderDialogOpen, setEditHolderDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<KeyData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<KeyData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: keys, isLoading } = useQuery({
    queryKey: ["keys", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("project_id", projectId)
        .order("deel_van_huis", { ascending: true })
        .order("sequence_number", { ascending: true });

      if (error) throw error;
      return data as KeyData[];
    },
    enabled: !!projectId,
  });

  // Get unique parts for the create dialog
  const existingParts = [...new Set(keys?.map((k) => k.deel_van_huis) || [])];

  const handleEditHolder = (key: KeyData) => {
    setSelectedKey(key);
    setEditHolderDialogOpen(true);
  };

  const handleDeleteClick = (key: KeyData) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!keyToDelete) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("keys")
        .delete()
        .eq("id", keyToDelete.id);

      if (error) throw error;

      toast.success(`Sleutel "${keyToDelete.key_number}" verwijderd`);
      queryClient.invalidateQueries({ queryKey: ["keys", projectId] });
    } catch (error: any) {
      console.error("Error deleting key:", error);
      toast.error(error.message || "Kon sleutel niet verwijderen");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setKeyToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Sleutelbeheer
          </CardTitle>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nieuwe sleutel
          </Button>
        </CardHeader>
        <CardContent>
          {!keys || keys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nog geen sleutels geregistreerd</p>
              <p className="text-sm mt-1">
                Klik op "Nieuwe sleutel" om te beginnen
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sleutelnummer</TableHead>
                    <TableHead>Deel van huis</TableHead>
                    <TableHead>Huidige houder</TableHead>
                    <TableHead>Ontvangen op</TableHead>
                    <TableHead>Notities</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        {key.key_number}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{key.deel_van_huis}</Badge>
                      </TableCell>
                      <TableCell>
                        {key.current_holder ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {key.current_holder}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Beschikbaar
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {key.received_at ? (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(key.received_at), "d MMM yyyy", {
                              locale: nl,
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {key.notes || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditHolder(key)}
                            title="Houder wijzigen"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(key)}
                            className="text-destructive hover:text-destructive"
                            title="Verwijderen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateKeyDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        existingParts={existingParts}
      />

      <EditKeyHolderDialog
        open={editHolderDialogOpen}
        onOpenChange={setEditHolderDialogOpen}
        keyData={selectedKey}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sleutel verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je sleutel "{keyToDelete?.key_number}" wilt
              verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
