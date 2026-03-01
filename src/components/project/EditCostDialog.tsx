import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, ExternalLink, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCostPayers } from "./CostPayersManager";
import { useCostCategories } from "./CostCategoriesManager";
import { useSuppliers, useAddSupplier } from "./SuppliersManager";
import { AutocompleteInput } from "./AutocompleteInput";
import { UI } from "@/lib/uiTexts";
import { useHouseParts } from "@/hooks/useHouseParts";
import { computeFileHash, checkDuplicateHash, DuplicateMatch } from "@/lib/fileHashUtils";
import { format } from "date-fns";

interface EditCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cost: any;
  onSuccess: () => void;
}

const EditCostDialog = ({ open, onOpenChange, cost, onSuccess }: EditCostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileHashes, setFileHashes] = useState<string[]>([]);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateMatch | null>(null);
  const [pendingFiles, setPendingFiles] = useState<{ files: File[]; hashes: string[] } | null>(null);
  const [formData, setFormData] = useState({
    datum: "",
    categorie: "Materiaal",
    leverancier: "",
    beschrijving: "",
    bedrag: "",
    factuur_urls: [] as string[],
    deel_van_huis: "",
    status: "Schatting",
    betaald_door: "Ntb",
  });

  const isMobile = useIsMobile();
  
  // Get project_id from cost to fetch payer and category options
  const projectId = cost?.project_id;
  const { ensureHousePart } = useHouseParts(projectId || "");
  const { data: payerOptions = [] } = useCostPayers(projectId || "");
  const { data: categoryOptions = [] } = useCostCategories(projectId || "");
  const { data: supplierNames = [] } = useSuppliers(projectId || "");
  const addSupplier = useAddSupplier(projectId || "");
  const betaaldDoorOptions = payerOptions.length > 0 ? payerOptions : ["Ron", "Monique", "Gezamenlijk", "Ntb"];

  useEffect(() => {
    if (cost) {
      // Build factuur_urls from either new array field or legacy single field
      const urls: string[] = cost.factuur_urls && cost.factuur_urls.length > 0
        ? [...cost.factuur_urls]
        : cost.factuur_url
          ? [cost.factuur_url]
          : [];
      
      setFormData({
        datum: cost.datum || "",
        categorie: cost.categorie || "Materiaal",
        leverancier: cost.leverancier || "",
        beschrijving: (cost as any).beschrijving || "",
        bedrag: cost.bedrag?.toString() || "",
        factuur_urls: urls,
        deel_van_huis: cost.deel_van_huis || "",
        status: cost.status || "Schatting",
        betaald_door: cost.betaald_door || "Ntb",
      });
      setFileHashes(cost.file_hashes || []);
    }
  }, [cost]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Compute hashes and check for duplicates first
    const fileArray = Array.from(files);
    for (const file of fileArray) {
      try {
        const hash = await computeFileHash(file);
        const duplicate = await checkDuplicateHash(projectId!, hash, cost?.id);
        if (duplicate) {
          setDuplicateWarning(duplicate);
          setPendingFiles({ files: fileArray, hashes: [] });
          e.target.value = "";
          return;
        }
      } catch (err) {
        // If hash check fails, continue with upload
        console.warn("Hash check failed:", err);
      }
    }

    await uploadFiles(fileArray);
    e.target.value = "";
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Niet ingelogd");
        setUploading(false);
        return;
      }

      const newPaths: string[] = [];
      const newHashes: string[] = [];
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(filePath, file);

        if (uploadError) throw uploadError;
        newPaths.push(filePath);

        try {
          const hash = await computeFileHash(file);
          newHashes.push(hash);
        } catch {
          // Continue without hash
        }
      }

      setFormData(prev => ({ ...prev, factuur_urls: [...prev.factuur_urls, ...newPaths] }));
      setFileHashes(prev => [...prev, ...newHashes]);
      toast.success(`${newPaths.length} bestand${newPaths.length > 1 ? 'en' : ''} geüpload`);
    } catch (error: any) {
      toast.error("Fout bij uploaden: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDuplicateConfirm = async () => {
    if (!pendingFiles) return;
    setDuplicateWarning(null);
    await uploadFiles(pendingFiles.files);
    setPendingFiles(null);
  };

  const handleDuplicateCancel = () => {
    setDuplicateWarning(null);
    setPendingFiles(null);
  };

  const handleRemoveUploadedFile = async (index: number) => {
    const path = formData.factuur_urls[index];
    await supabase.storage.from("invoices").remove([path]);
    setFormData(prev => ({
      ...prev,
      factuur_urls: prev.factuur_urls.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Add supplier to list if new
      if (formData.leverancier.trim()) {
        addSupplier.mutate(formData.leverancier.trim());
      }

      const { error } = await supabase
        .from("costs")
        .update({
          datum: formData.datum,
          categorie: formData.categorie as any,
          leverancier: formData.leverancier || null,
          beschrijving: formData.beschrijving || null,
          bedrag: parseFloat(formData.bedrag),
          factuur_url: formData.factuur_urls.length > 0 ? formData.factuur_urls[0] : null,
          factuur_urls: formData.factuur_urls,
          deel_van_huis: formData.deel_van_huis || null,
          status: formData.status as any,
          betaald_door: formData.betaald_door,
          file_hashes: fileHashes,
        })
        .eq("id", cost.id);

      if (error) throw error;

      // Ensure house part is registered centrally
      if (formData.deel_van_huis) {
        await ensureHousePart(formData.deel_van_huis);
      }

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
          <AutocompleteInput
            value={formData.leverancier}
            onChange={(value) => setFormData({ ...formData, leverancier: value })}
            suggestions={supplierNames}
            placeholder="Naam leverancier"
            allowCreate
            createLabel="Voeg toe:"
            showAllOnFocus
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
          <Label>Bestanden ({formData.factuur_urls.length})</Label>
          
          {formData.factuur_urls.length > 0 && (
            <div className="space-y-2 mt-2">
              {formData.factuur_urls.map((url, index) => (
                <div key={url} className="p-2 border rounded-lg bg-muted/30 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-sm truncate flex-1">{url.split("/").pop()}</p>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => {
                        const publicUrl = supabase.storage.from("invoices").getPublicUrl(url).data.publicUrl;
                        window.open(publicUrl, "_blank");
                      }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveUploadedFile(index)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => document.getElementById("factuur")?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploaden..." : "Bestand toevoegen"}
            </Button>
            <Input
              id="factuur"
              type="file"
              accept="image/*,application/pdf"
              multiple
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

  const duplicateDialog = (
    <AlertDialog open={!!duplicateWarning} onOpenChange={(open) => { if (!open) handleDuplicateCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Mogelijk duplicaat gevonden</AlertDialogTitle>
          <AlertDialogDescription>
            Dit bestand lijkt al eerder te zijn geüpload bij een andere kostenpost:
            <br /><br />
            <strong>Bedrag:</strong> €{duplicateWarning?.bedrag?.toLocaleString("nl-NL")}<br />
            <strong>Leverancier:</strong> {duplicateWarning?.leverancier || "Onbekend"}<br />
            <strong>Datum:</strong> {duplicateWarning?.datum ? format(new Date(duplicateWarning.datum), "dd-MM-yyyy") : "Onbekend"}
            <br /><br />
            Wil je het bestand toch uploaden?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDuplicateCancel}>Annuleren</AlertDialogCancel>
          <AlertDialogAction onClick={handleDuplicateConfirm}>Toch uploaden</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile) {
    return (
      <>
        {duplicateDialog}
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
      </>
    );
  }

  return (
    <>
      {duplicateDialog}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{UI.costs.dialogs.editTitle}</DialogTitle>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EditCostDialog;
