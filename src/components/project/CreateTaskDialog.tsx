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

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

const CreateTaskDialog = ({ open, onOpenChange, projectId, onSuccess, availableDelenVanHuis = [] }: CreateTaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customDeelVanHuis, setCustomDeelVanHuis] = useState("");
  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    begindatum: "",
    deadline: "",
    status: "Te doen",
    prioriteit: "Middel",
    verantwoordelijke: "",
    deel_van_huis: "",
  });

  const isMobile = useIsMobile();

  const isDeadlineInvalid = formData.begindatum && formData.deadline && formData.deadline < formData.begindatum;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlineInvalid) {
      toast.error("Deadline kan niet voor begindatum liggen");
      return;
    }
    setLoading(true);

    const finalDeelVanHuis = formData.deel_van_huis === "__custom__" 
      ? customDeelVanHuis 
      : formData.deel_van_huis;

    try {
      const { error } = await supabase.from("tasks").insert([{
        project_id: projectId,
        titel: formData.titel,
        beschrijving: formData.beschrijving || null,
        begindatum: formData.begindatum || null,
        deadline: formData.deadline || null,
        status: formData.status as any,
        prioriteit: formData.prioriteit as any,
        verantwoordelijke: formData.verantwoordelijke || null,
        deel_van_huis: finalDeelVanHuis || null,
      }]);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
      setFormData({
        titel: "",
        beschrijving: "",
        begindatum: "",
        deadline: "",
        status: "Te doen",
        prioriteit: "Middel",
        verantwoordelijke: "",
        deel_van_huis: "",
      });
      setCustomDeelVanHuis("");
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="titel">Titel *</Label>
        <Input
          id="titel"
          value={formData.titel}
          onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
          placeholder="Taak titel"
          required
        />
      </div>

      <div>
        <Label htmlFor="beschrijving">Beschrijving</Label>
        <Textarea
          id="beschrijving"
          value={formData.beschrijving}
          onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
          placeholder="Taak beschrijving..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prioriteit">Prioriteit</Label>
          <Select
            value={formData.prioriteit}
            onValueChange={(value) => setFormData({ ...formData, prioriteit: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Laag">Laag</SelectItem>
              <SelectItem value="Middel">Middel</SelectItem>
              <SelectItem value="Hoog">Hoog</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Te doen">Te doen</SelectItem>
              <SelectItem value="Bezig">Bezig</SelectItem>
              <SelectItem value="Gereed">Gereed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="begindatum">Begindatum</Label>
          <Input
            id="begindatum"
            type="date"
            value={formData.begindatum}
            onChange={(e) => {
              const newBegindatum = e.target.value;
              setFormData(prev => ({
                ...prev,
                begindatum: newBegindatum,
                deadline: prev.deadline || newBegindatum
              }));
            }}
          />
        </div>

        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            min={formData.begindatum || undefined}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
          {formData.begindatum && formData.deadline && formData.deadline < formData.begindatum && (
            <p className="text-sm text-destructive mt-1">Deadline kan niet voor begindatum liggen</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="deel_van_huis">Deel van huis</Label>
        <Select
          value={formData.deel_van_huis}
          onValueChange={(value) => setFormData({ ...formData, deel_van_huis: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecteer of voer nieuw in" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Geen</SelectItem>
            {availableDelenVanHuis.map((deel) => (
              <SelectItem key={deel} value={deel}>{deel}</SelectItem>
            ))}
            <SelectItem value="__custom__">+ Nieuw toevoegen...</SelectItem>
          </SelectContent>
        </Select>
        {formData.deel_van_huis === "__custom__" && (
          <Input
            className="mt-2"
            value={customDeelVanHuis}
            onChange={(e) => setCustomDeelVanHuis(e.target.value)}
            placeholder="Voer nieuw deel van huis in"
          />
        )}
      </div>

      <div>
        <Label htmlFor="verantwoordelijke">Verantwoordelijke</Label>
        <Input
          id="verantwoordelijke"
          value={formData.verantwoordelijke}
          onChange={(e) => setFormData({ ...formData, verantwoordelijke: e.target.value })}
          placeholder="Naam"
        />
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading} className="gradient-primary">
            {loading ? "Bezig..." : "Taak Aanmaken"}
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
            <DrawerTitle>Nieuwe Taak</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {formContent}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={(e) => { e.preventDefault(); document.querySelector('form')?.requestSubmit(); }} disabled={loading} className="flex-1 gradient-primary">
              {loading ? "Bezig..." : "Taak Aanmaken"}
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
          <DialogTitle>Nieuwe Taak</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
