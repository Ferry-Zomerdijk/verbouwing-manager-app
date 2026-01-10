import { useState, useEffect } from "react";
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
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: {
    id: string;
    naam: string;
    volgorde?: number;
  };
  onSuccess: () => void;
}

const EditCategoryDialog = ({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [naam, setNaam] = useState("");

  useEffect(() => {
    if (category) {
      setNaam(category.naam);
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!naam.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("contact_categories")
        .update({ naam: naam.trim() })
        .eq("id", category.id);

      if (error) throw error;
      
      toast.success("Rubriek bijgewerkt!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
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

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Annuleren
        </Button>
        <Button type="submit" disabled={loading || !naam.trim()} className="flex-1 gradient-primary">
          {loading ? "Bezig..." : "Opslaan"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Rubriek Bewerken</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6">{formContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rubriek Bewerken</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditCategoryDialog;
