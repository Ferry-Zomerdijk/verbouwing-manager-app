import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

const SUGGESTED_CATEGORIES = [
  "Alarm & Beveiliging",
  "Hekwerk & Toegang",
  "Tuinonderhoud",
  "Schilderwerk",
  "Loodgieter",
  "Elektricien",
  "Jacuzzi & Wellness",
  "Schoonmaak",
  "Verwarming & Airco",
  "Dakwerk",
];

const CreateCategoryDialog = ({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: CreateCategoryDialogProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [naam, setNaam] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("contact_categories").insert({
        project_id: projectId,
        naam: naam.trim(),
      });

      if (error) throw error;
      
      toast.success("Rubriek aangemaakt!");
      setNaam("");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setNaam(suggestion);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="naam">Naam rubriek</Label>
        <Input
          id="naam"
          value={naam}
          onChange={(e) => setNaam(e.target.value)}
          placeholder="Bijv. Tuinonderhoud"
          required
        />
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-sm">Suggesties</Label>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_CATEGORIES.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Annuleren
        </Button>
        <Button type="submit" disabled={loading || !naam.trim()} className="flex-1 gradient-primary">
          {loading ? "Bezig..." : "Aanmaken"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <KeyboardAwareDrawerContent>
          <DrawerHeader>
            <DrawerTitle>Nieuwe rubriek</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{formContent}</div>
        </KeyboardAwareDrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe rubriek</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryDialog;
