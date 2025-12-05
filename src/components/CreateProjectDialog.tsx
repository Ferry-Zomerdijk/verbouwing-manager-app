import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateProjectDialog = ({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    type: "",
    status: "Gepland",
    startdatum: "",
    einddatum: "",
    beschrijving: "",
    totaal_begroting: "",
  });

  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Je moet ingelogd zijn om een project aan te maken");
        return;
      }

      const { error } = await supabase.from("projects").insert([{
        user_id: user.id,
        naam: formData.naam,
        type: formData.type || null,
        status: formData.status as any,
        startdatum: formData.startdatum || null,
        einddatum: formData.einddatum || null,
        beschrijving: formData.beschrijving || null,
        totaal_begroting: formData.totaal_begroting ? parseFloat(formData.totaal_begroting) : 0,
      }]);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
      setFormData({
        naam: "",
        type: "",
        status: "Gepland",
        startdatum: "",
        einddatum: "",
        beschrijving: "",
        totaal_begroting: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="naam">Projectnaam *</Label>
          <Input
            id="naam"
            value={formData.naam}
            onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
            placeholder="Badkamer renovatie"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Type Project</Label>
          <Input
            id="type"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            placeholder="Badkamer, Keuken, etc."
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gepland">Gepland</SelectItem>
              <SelectItem value="Lopend">Lopend</SelectItem>
              <SelectItem value="Afgerond">Afgerond</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startdatum">Startdatum</Label>
          <Input
            id="startdatum"
            type="date"
            value={formData.startdatum}
            onChange={(e) => setFormData({ ...formData, startdatum: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="einddatum">Einddatum</Label>
          <Input
            id="einddatum"
            type="date"
            value={formData.einddatum}
            onChange={(e) => setFormData({ ...formData, einddatum: e.target.value })}
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="totaal_begroting">Totaal Budget (€)</Label>
          <Input
            id="totaal_begroting"
            type="number"
            step="0.01"
            value={formData.totaal_begroting}
            onChange={(e) => setFormData({ ...formData, totaal_begroting: e.target.value })}
            placeholder="10000"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="beschrijving">Beschrijving</Label>
          <Textarea
            id="beschrijving"
            value={formData.beschrijving}
            onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
            placeholder="Beschrijf je renovatieproject..."
            rows={4}
          />
        </div>
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading} className="gradient-primary">
            {loading ? "Bezig..." : "Project Aanmaken"}
          </Button>
        </div>
      )}
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Nieuw Renovatieproject</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {formContent}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuleren
            </Button>
            <Button 
              onClick={(e) => { e.preventDefault(); document.querySelector('form')?.requestSubmit(); }} 
              disabled={loading} 
              className="flex-1 gradient-primary"
            >
              {loading ? "Bezig..." : "Aanmaken"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuw Renovatieproject</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
