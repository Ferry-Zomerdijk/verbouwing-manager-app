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
import { Upload, FileText, ExternalLink, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCostPayers } from "./CostPayersManager";
import { useCostCategories } from "./CostCategoriesManager";
import { UI } from "@/lib/uiTexts";

interface EditCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost: any;
  onSuccess: () => void;
}

const EditCostDialog = ({ open, onOpenChange, cost, onSuccess }: EditCostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    datum: "",
    categorie: "Materiaal",
    leverancier: "",
    beschrijving: "",
    bedrag: "",
    factuur_url: "",
    deel_van_huis: "",
    status: "Schatting",
    betaald_door: "Ntb",
  });

  const isMobile = useIsMobile();
  
  // Get project_id from cost to fetch payer and category options
  const projectId = cost?.project_id;
  const { data: payerOptions = [] } = useCostPayers(projectId || "");
  const { data: categoryOptions = [] } = useCostCategories(projectId || "");
  const betaaldDoorOptions = payerOptions.length > 0 ? payerOptions : ["Ron", "Monique", "Gezamenlijk", "Ntb"];

  useEffect(() => {
    if (cost) {
      setFormData({
        datum: cost.datum || "",
        categorie: cost.categorie || "Materiaal",
        leverancier: cost.leverancier || "",
        beschrijving: (cost as any).beschrijving || "",
        bedrag: cost.bedrag?.toString() || "",
        factuur_url: cost.factuur_url || "",
        deel_van_huis: cost.deel_van_huis || "",
        status: cost.status || "Schatting",
        betaald_door: cost.betaald_door || "Ntb",
      });
    }
  }, [cost]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Niet ingelogd");
        setUploading(false);
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Verwijder oude factuur indien aanwezig
      if (formData.factuur_url) {
        await supabase.storage.from("invoices").remove([formData.factuur_url]);
      }

      setFormData({ ...formData, factuur_url: filePath });
      toast.success("Nieuwe factuur geüpload");
    } catch (error: any) {
      toast.error("Fout bij uploaden: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("costs")
        .update({
          datum: formData.datum,
          categorie: formData.categorie as any,
          leverancier: formData.leverancier || null,
          beschrijving: formData.beschrijving || null,
          bedrag: parseFloat(formData.bedrag),
          factuur_url: formData.factuur_url || null,
          deel_van_huis: formData.deel_van_huis || null,
          status: formData.status as any,
          betaald_door: formData.betaald_door,
        })
        .eq("id", cost.id);

      if (error) throw error;

      toast.success("Kosten bijgewerkt");
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
          <Label htmlFor="categorie">Categorie *</Label>
          <Select
            value={formData.categorie}
            onValueChange={(value) => setFormData({ ...formData, categorie: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat.naam} value={cat.naam}>{cat.naam}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Schatting">Schatting</SelectItem>
              <SelectItem value="Offerte">Offerte</SelectItem>
              <SelectItem value="Factuur">Factuur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="betaald_door">Betaald door</Label>
          <Select
            value={formData.betaald_door}
            onValueChange={(value) => setFormData({ ...formData, betaald_door: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {betaaldDoorOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="deel_van_huis">Deel van huis</Label>
          <Input
            id="deel_van_huis"
            value={formData.deel_van_huis}
            onChange={(e) => setFormData({ ...formData, deel_van_huis: e.target.value })}
            placeholder="bijv. Keuken, Badkamer..."
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="leverancier">Leverancier</Label>
          <Input
            id="leverancier"
            value={formData.leverancier}
            onChange={(e) => setFormData({ ...formData, leverancier: e.target.value })}
            placeholder="Naam leverancier"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="beschrijving">Beschrijving</Label>
          <Textarea
            id="beschrijving"
            value={formData.beschrijving}
            onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
            placeholder="Beschrijving van de kosten..."
            rows={3}
            className="text-base"
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

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="factuur">Factuur (optioneel)</Label>
          
          {formData.factuur_url ? (
            <div className="mt-2 p-3 border rounded-lg bg-muted/30 flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {formData.factuur_url.split("/").pop()}
                </p>
                <p className="text-xs text-muted-foreground">Factuur bijgevoegd</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    const url = supabase.storage.from("invoices").getPublicUrl(formData.factuur_url).data.publicUrl;
                    window.open(url, "_blank");
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setFormData({ ...formData, factuur_url: "" })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => document.getElementById("factuur")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploaden..." : formData.factuur_url ? "Vervangen" : "Uploaden"}
            </Button>
            <Input
              id="factuur"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading || uploading} className="gradient-primary">
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
            <DrawerTitle>{UI.costs.dialogs.editTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {formContent}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              {UI.actions.cancel}
            </Button>
            <Button 
              onClick={(e) => { e.preventDefault(); document.querySelector('form')?.requestSubmit(); }} 
              disabled={loading || uploading} 
              className="flex-1 gradient-primary"
            >
              {loading ? UI.actions.saving : UI.actions.save}
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
          <DialogTitle>{UI.costs.dialogs.editTitle}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditCostDialog;
