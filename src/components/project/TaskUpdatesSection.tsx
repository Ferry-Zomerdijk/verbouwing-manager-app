import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface TaskUpdate {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
}

interface TaskUpdatesSectionProps {
  taskId: string;
  onUpdateAdded?: () => void;
}

export const TaskUpdatesSection = ({ taskId, onUpdateAdded }: TaskUpdatesSectionProps) => {
  const [newUpdate, setNewUpdate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: updates, isLoading } = useQuery({
    queryKey: ["task-updates", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_updates")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TaskUpdate[];
    },
  });

  const addUpdateMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase.from("task_updates").insert({
        task_id: taskId,
        content,
        created_by: user.id,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewUpdate("");
      setIsAdding(false);
      toast.success("Update toegevoegd");
      queryClient.invalidateQueries({ queryKey: ["task-updates", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onUpdateAdded?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Fout bij toevoegen update");
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase.from("task_updates").delete().eq("id", updateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Update verwijderd");
      queryClient.invalidateQueries({ queryKey: ["task-updates", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Fout bij verwijderen update");
    },
  });

  const handleAddUpdate = () => {
    if (!newUpdate.trim()) return;
    addUpdateMutation.mutate(newUpdate.trim());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Updates</h4>
      </div>

      {/* Add new update */}
      {isAdding ? (
        <div className="space-y-2">
          <Textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Schrijf een update..."
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddUpdate}
              disabled={!newUpdate.trim() || addUpdateMutation.isPending}
            >
              {addUpdateMutation.isPending ? "Toevoegen..." : "Toevoegen"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAdding(false);
                setNewUpdate("");
              }}
            >
              Annuleren
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Update toevoegen
        </Button>
      )}

      {/* List of updates */}
      <div className="space-y-3 max-h-60 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : updates && updates.length > 0 ? (
          updates.map((update) => (
            <div
              key={update.id}
              className="bg-muted/50 rounded-md p-3 text-sm space-y-1 group relative"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(update.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                </span>
                {currentUser?.id === update.created_by && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteUpdateMutation.mutate(update.id)}
                    disabled={deleteUpdateMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap">{update.content}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nog geen updates
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskUpdatesSection;
