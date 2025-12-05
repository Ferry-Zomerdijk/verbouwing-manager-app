import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreateContractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

const CreateContractorDialog = ({ open, onOpenChange, projectId, onSuccess }: CreateContractorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    bedrijf: "",
    rol: "",
    email: "",
    telefoon: "",
    notities: "",
  });

  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("contractors").insert([{
        project_id: projectId,
        naam: formData.naam,
        bedrijf: formData.bedrijf || null,
        rol: formData.rol || null,
        email: formData.email || null,
        telefoon: formData.telefoon || null,
        notities: formData.notities || null,
      }]);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
      setFormData({
        naam: "",
        bedrijf: "",
        rol: "",
        email: "",
        telefoon: "",
        notities: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="naam">Naam *</Label>
        <Input
          id="naam"
          value={formData.naam}
          onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="bedrijf">Bedrijf</Label>
          <Input
            id="bedrijf"
            value={formData.bedrijf}
            onChange={(e) => setFormData({ ...formData, bedrijf: e.target.value })}
            placeholder="Bouwbedrijf B.V."
          />
        </div>

        <div>
          <Label htmlFor="rol">Rol</Label>
          <Input
            id="rol"
            value={formData.rol}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            placeholder="Aannemer, Loodgieter, etc."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
          />
        </div>

        <div>
          <Label htmlFor="telefoon">Telefoon</Label>
          <Input
            id="telefoon"
            type="tel"
            value={formData.telefoon}
            onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
            placeholder="+31 6 12345678"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notities">Notities</Label>
        <Textarea
          id="notities"
          value={formData.notities}
          onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
          placeholder="Extra informatie..."
          rows={3}
        />
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading} className="gradient-primary">
            {loading ? "Opslaan..." : "Opslaan"}
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
            <DrawerTitle>Nieuwe Aannemer</DrawerTitle>
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
              {loading ? "Opslaan..." : "Opslaan"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Aannemer</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateContractorDialog;
