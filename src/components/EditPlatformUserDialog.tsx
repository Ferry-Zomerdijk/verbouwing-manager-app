import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface EditPlatformUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    naam: string | null;
    email: string | null;
  } | null;
}

export const EditPlatformUserDialog = ({ 
  open, 
  onOpenChange, 
  user
}: EditPlatformUserDialogProps) => {
  const [naam, setNaam] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setNaam(user.naam || "");
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ naam })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Gebruiker bijgewerkt");
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error("Kon gebruiker niet bijwerken: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Platform Gebruiker Bewerken</DialogTitle>
          <DialogDescription>
            Wijzig de gegevens van deze gebruiker.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              E-mailadres kan niet worden gewijzigd
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="naam">Naam</Label>
            <Input
              id="naam"
              type="text"
              placeholder="Volledige naam"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1">
              {loading ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
