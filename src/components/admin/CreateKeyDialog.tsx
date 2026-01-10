import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Key, Loader2 } from "lucide-react";

interface CreateKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingParts: string[];
}

const DEFAULT_PARTS = ["Woning", "Garage", "Bijgebouw", "Schuur", "Poort", "Brievenbus"];

export function CreateKeyDialog({
  open,
  onOpenChange,
  projectId,
  existingParts,
}: CreateKeyDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [deelVanHuis, setDeelVanHuis] = useState("");
  const [customPart, setCustomPart] = useState("");
  const [currentHolder, setCurrentHolder] = useState("");
  const [notes, setNotes] = useState("");
  const [nextSequence, setNextSequence] = useState<number | null>(null);

  // Combine default parts with existing parts from the database
  const allParts = [...new Set([...DEFAULT_PARTS, ...existingParts])].sort();

  const handlePartChange = async (value: string) => {
    setDeelVanHuis(value);
    setCustomPart("");
    
    if (value && value !== "custom") {
      // Fetch the next sequence number for this part
      const { data, error } = await supabase
        .from("keys")
        .select("sequence_number")
        .eq("project_id", projectId)
        .eq("deel_van_huis", value)
        .order("sequence_number", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching sequence:", error);
        setNextSequence(1);
      } else {
        setNextSequence(data && data.length > 0 ? data[0].sequence_number + 1 : 1);
      }
    } else {
      setNextSequence(null);
    }
  };

  const handleCustomPartChange = async (value: string) => {
    setCustomPart(value);
    
    if (value.trim()) {
      // Fetch the next sequence number for this custom part
      const { data, error } = await supabase
        .from("keys")
        .select("sequence_number")
        .eq("project_id", projectId)
        .eq("deel_van_huis", value.trim())
        .order("sequence_number", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error fetching sequence:", error);
        setNextSequence(1);
      } else {
        setNextSequence(data && data.length > 0 ? data[0].sequence_number + 1 : 1);
      }
    } else {
      setNextSequence(null);
    }
  };

  const getKeyNumber = () => {
    const part = deelVanHuis === "custom" ? customPart.trim() : deelVanHuis;
    if (!part || nextSequence === null) return "";
    return `${part} ${String(nextSequence).padStart(2, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const part = deelVanHuis === "custom" ? customPart.trim() : deelVanHuis;
    
    if (!part) {
      toast.error("Selecteer een deel van het huis");
      return;
    }

    if (nextSequence === null) {
      toast.error("Kon volgnummer niet bepalen");
      return;
    }

    setIsLoading(true);

    try {
      const keyNumber = `${part} ${String(nextSequence).padStart(2, "0")}`;

      const { error } = await supabase.from("keys").insert({
        project_id: projectId,
        key_number: keyNumber,
        deel_van_huis: part,
        sequence_number: nextSequence,
        current_holder: currentHolder.trim() || null,
        received_at: currentHolder.trim() ? new Date().toISOString() : null,
        notes: notes.trim() || null,
      });

      if (error) throw error;

      toast.success(`Sleutel "${keyNumber}" aangemaakt`);
      queryClient.invalidateQueries({ queryKey: ["keys", projectId] });
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error creating key:", error);
      toast.error(error.message || "Kon sleutel niet aanmaken");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setDeelVanHuis("");
    setCustomPart("");
    setCurrentHolder("");
    setNotes("");
    setNextSequence(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Nieuwe sleutel toevoegen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deelVanHuis">Deel van het huis *</Label>
            <Select value={deelVanHuis} onValueChange={handlePartChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer deel van het huis" />
              </SelectTrigger>
              <SelectContent>
                {allParts.map((part) => (
                  <SelectItem key={part} value={part}>
                    {part}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Anders...</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {deelVanHuis === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customPart">Aangepast deel *</Label>
              <Input
                id="customPart"
                value={customPart}
                onChange={(e) => handleCustomPartChange(e.target.value)}
                placeholder="Bijv. Tuinhuis"
              />
            </div>
          )}

          {getKeyNumber() && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Sleutelnummer:</p>
              <p className="text-lg font-semibold">{getKeyNumber()}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentHolder">Huidige houder</Label>
            <Input
              id="currentHolder"
              value={currentHolder}
              onChange={(e) => setCurrentHolder(e.target.value)}
              placeholder="Naam van de persoon"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optionele notities over deze sleutel"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading || !getKeyNumber()}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Toevoegen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
