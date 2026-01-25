import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

interface EditProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  project: any;
}

const EditProjectDialog = ({ open, onOpenChange, onSuccess, project }: EditProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    type: "",
    status: "Gepland",
    startdatum: "",
    einddatum: "",
    beschrijving: "",
    totaal_begroting: "",
    voortgang: "",
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    if (project) {
      setFormData({
        naam: project.naam || "",
        type: project.type || "",
        status: project.status || "Gepland",
        startdatum: project.startdatum || "",
        einddatum: project.einddatum || "",
        beschrijving: project.beschrijving || "",
        totaal_begroting: project.totaal_begroting?.toString() || "",
        voortgang: project.voortgang?.toString() || "0",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("projects")
        .update({
          naam: formData.naam,
          type: formData.type || null,
          status: formData.status as any,
          startdatum: formData.startdatum || null,
          einddatum: formData.einddatum || null,
          beschrijving: formData.beschrijving || null,
          totaal_begroting: formData.totaal_begroting ? parseFloat(formData.totaal_begroting) : 0,
          voortgang: formData.voortgang ? parseInt(formData.voortgang) : 0,
        })
        .eq("id", project.id);

      if (error) throw error;

      toast.success("Project bijgewerkt");
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

        <div>
          <Label htmlFor="totaal_begroting">Totaal Budget (€)</Label>
          <Input
            id="totaal_begroting"
            type="number"
            step="0.01"
            value={formData.totaal_begroting}
            onChange={(e) => setFormData({ ...formData, totaal_begroting: e.target.value })}
            placeholder="0.00"
          />
        </div>

        <div>
          <Label htmlFor="voortgang">Voortgang (%)</Label>
          <Input
            id="voortgang"
            type="number"
            min="0"
            max="100"
            value={formData.voortgang}
            onChange={(e) => setFormData({ ...formData, voortgang: e.target.value })}
            placeholder="0"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="beschrijving">Beschrijving</Label>
          <Textarea
            id="beschrijving"
            value={formData.beschrijving}
            onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
            placeholder="Project beschrijving..."
            rows={4}
            className="text-base"
          />
        </div>
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
        <KeyboardAwareDrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Project bewerken</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
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
        </KeyboardAwareDrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project bewerken</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
