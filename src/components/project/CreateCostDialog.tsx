import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreateCostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

const CreateCostDialog = ({ open, onOpenChange, projectId, onSuccess, availableDelenVanHuis = [] }: CreateCostDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split("T")[0],
    bedrag: "",
    leverancier: "",
    categorie: "Materiaal",
    beschrijving: "",
    deel_van_huis: "",
    status: "Schatting",
  });

  const isMobile = useIsMobile();

  const validateFile = (file: File): boolean => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      toast.error("Alleen PDF, JPG en PNG bestanden zijn toegestaan");
      return false;
    }
    
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Bestand is te groot. Maximum 20MB");
      return false;
    }
    
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setProcessingOCR(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;
      
      setUploadedFilePath(fileName);

      toast.info("Factuur wordt geanalyseerd...");
      
      const { data: ocrData, error: functionError } = await supabase.functions
        .invoke('process-invoice', {
          body: { filePath: fileName }
        });

      if (functionError) throw functionError;

      if (ocrData?.success && ocrData?.data) {
        const extracted = ocrData.data;
        
        setFormData({
          datum: extracted.datum || formData.datum,
          bedrag: extracted.bedrag?.toString() || "",
          leverancier: extracted.leverancier || "",
          categorie: formData.categorie,
          beschrijving: extracted.beschrijving || "",
          deel_van_huis: formData.deel_van_huis,
          status: "Factuur",
        });

        toast.success("Factuurgegevens succesvol ingelezen!");
      } else {
        toast.warning("Factuur geüpload, maar automatische extractie mislukt. Vul de gegevens handmatig in.");
      }
    } catch (error: any) {
      console.error("OCR error:", error);
      toast.error(error.message || "Fout bij het verwerken van de factuur");
      
      if (uploadedFilePath) {
        await supabase.storage.from('invoices').remove([uploadedFilePath]);
        setUploadedFilePath(null);
      }
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleRemoveFile = async () => {
    if (uploadedFilePath) {
      await supabase.storage.from('invoices').remove([uploadedFilePath]);
      setUploadedFilePath(null);
    }
    setSelectedFile(null);
  };

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
        beschrijving: formData.beschrijving || null,
        factuur_url: uploadedFilePath || null,
        deel_van_huis: formData.deel_van_huis || null,
        status: formData.status as any,
      }]);

      if (error) throw error;

      onSuccess();
      onOpenChange(false);
      
      setFormData({
        datum: new Date().toISOString().split("T")[0],
        bedrag: "",
        leverancier: "",
        categorie: "Materiaal",
        beschrijving: "",
        deel_van_huis: "",
        status: "Schatting",
      });
      setSelectedFile(null);
      setUploadedFilePath(null);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <>
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Handmatig</TabsTrigger>
          <TabsTrigger value="upload">Factuur Uploaden</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {!selectedFile ? (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <Upload className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 transition-colors ${
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                }`} />
                <p className="text-sm font-medium mb-2">
                  {isDragging ? 'Laat los om te uploaden' : 'Klik of sleep een factuur hierheen'}
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, JPG of PNG (max 20MB)
                </p>
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <FileText className="w-8 h-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={processingOCR}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {!uploadedFilePath && (
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  disabled={processingOCR}
                  className="w-full"
                >
                  {processingOCR ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Factuur analyseren...
                    </>
                  ) : (
                    "Analyseer met AI"
                  )}
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="manual">
          {/* Manual form is always available below */}
        </TabsContent>
      </Tabs>

      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <SelectItem value="Kluswerkzaamheden">Kluswerkzaamheden</SelectItem>
                <SelectItem value="Decoratie">Decoratie</SelectItem>
                <SelectItem value="Meubels">Meubels</SelectItem>
                <SelectItem value="Overig">Overig</SelectItem>
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
        </div>

        <div>
          <Label htmlFor="deel_van_huis">Deel van huis</Label>
          <Select
            value={formData.deel_van_huis || "none"}
            onValueChange={(value) => setFormData({ ...formData, deel_van_huis: value === "none" ? "" : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer deel van huis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Geen selectie</SelectItem>
              {availableDelenVanHuis.map(deel => (
                <SelectItem key={deel} value={deel}>{deel}</SelectItem>
              ))}
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

        <div>
          <Label htmlFor="beschrijving">Omschrijving</Label>
          <Textarea
            id="beschrijving"
            value={formData.beschrijving}
            onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
            placeholder="Beschrijving van producten/diensten"
            rows={3}
          />
        </div>

        {!isMobile && (
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuleren
            </Button>
            <Button type="submit" disabled={loading || processingOCR}>
              {loading ? "Bezig..." : "Kostenpost Toevoegen"}
            </Button>
          </div>
        )}
      </form>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Nieuwe Kostenpost</DrawerTitle>
            <DrawerDescription>
              Voeg een kostenpost toe of upload een factuur.
            </DrawerDescription>
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
              disabled={loading || processingOCR} 
              className="flex-1"
            >
              {loading ? "Bezig..." : "Toevoegen"}
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
          <DialogTitle>Nieuwe Kostenpost</DialogTitle>
          <DialogDescription>
            Voeg een nieuwe kostenpost toe door handmatig gegevens in te voeren of een factuur te uploaden.
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateCostDialog;
