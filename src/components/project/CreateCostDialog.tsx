import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
}

const CreateCostDialog = ({ open, onOpenChange, projectId, onSuccess }: CreateCostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split("T")[0],
    bedrag: "",
    leverancier: "",
    categorie: "Materiaal",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("costs").insert([{
        project_id: projectId,
        datum: formData.datum,
        bedrag: parseFloat(formData.bedrag),
        leverancier: formData.leverancier || null,
        categorie: formData.categorie as any,
      }]);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
      setFormData({
        datum: new Date().toISOString().split("T")[0],
        bedrag: "",
        leverancier: "",
        categorie: "Materiaal",
      });
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Kostenpost</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="datum">Datum *</Label>
              <Input
                id="datum"
                type="date"
                value={formData.datum}
                onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="bedrag">Bedrag (€) *</Label>
              <Input
                id="bedrag"
                type="number"
                step="0.01"
                value={formData.bedrag}
                onChange={(e) => setFormData({ ...formData, bedrag: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="categorie">Categorie *</Label>
            <Select
              value={formData.categorie}
              onValueChange={(value) => setFormData({ ...formData, categorie: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Materiaal">Materiaal</SelectItem>
                <SelectItem value="Arbeid">Arbeid</SelectItem>
                <SelectItem value="Vergunningen">Vergunningen</SelectItem>
                <SelectItem value="Overig">Overig</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="leverancier">Leverancier</Label>
            <Input
              id="leverancier"
              value={formData.leverancier}
              onChange={(e) => setFormData({ ...formData, leverancier: e.target.value })}
              placeholder="Naam leverancier"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading} className="gradient-primary">
              {loading ? "Bezig..." : "Kostenpost Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCostDialog;
