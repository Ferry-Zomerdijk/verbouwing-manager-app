import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserCheck } from "lucide-react";

interface Key {
  id: string;
  key_number: string;
  current_holder: string | null;
  project_id: string;
}

interface EditKeyHolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyData: Key | null;
}

export function EditKeyHolderDialog({
  open,
  onOpenChange,
  keyData,
}: EditKeyHolderDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [newHolder, setNewHolder] = useState("");

  useEffect(() => {
    if (keyData) {
      setNewHolder(keyData.current_holder || "");
    }
  }, [keyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!keyData) return;

    setIsLoading(true);

    try {
      const updateData: {
        current_holder: string | null;
        received_at: string | null;
      } = {
        current_holder: newHolder.trim() || null,
        received_at: newHolder.trim() ? new Date().toISOString() : null,
      };

      const { error } = await supabase
        .from("keys")
        .update(updateData)
        .eq("id", keyData.id);

      if (error) throw error;

      if (newHolder.trim()) {
        toast.success(`Sleutel "${keyData.key_number}" overgedragen aan ${newHolder.trim()}`);
      } else {
        toast.success(`Sleutel "${keyData.key_number}" is nu beschikbaar`);
      }
      
      queryClient.invalidateQueries({ queryKey: ["keys", keyData.project_id] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating key holder:", error);
      toast.error(error.message || "Kon houder niet bijwerken");
    } finally {
      setIsLoading(false);
    }
  };

  if (!keyData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Sleutelhouder wijzigen
          </DialogTitle>
          <DialogDescription>
            Sleutel: <span className="font-semibold">{keyData.key_number}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {keyData.current_holder && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Huidige houder:</p>
              <p className="font-medium">{keyData.current_holder}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newHolder">Nieuwe houder</Label>
            <Input
              id="newHolder"
              value={newHolder}
              onChange={(e) => setNewHolder(e.target.value)}
              placeholder="Laat leeg als sleutel wordt ingeleverd"
            />
            <p className="text-xs text-muted-foreground">
              De ontvangstdatum wordt automatisch op vandaag gezet
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {newHolder.trim() ? "Overdragen" : "Markeer als ingeleverd"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
