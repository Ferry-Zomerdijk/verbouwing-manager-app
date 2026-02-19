import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, FileText, Loader2, X, Sparkles, Lock, Infinity } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAiUsage } from "@/hooks/useAiUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { useCostPayers } from "./CostPayersManager";
import { useCostCategories } from "./CostCategoriesManager";
import { UI } from "@/lib/uiTexts";
import { useHouseParts } from "@/hooks/useHouseParts";

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
  const [uploadedFilePaths, setUploadedFilePaths] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    datum: new Date().toISOString().split("T")[0],
    bedrag: "",
    leverancier: "",
    categorie: "Materiaal",
    beschrijving: "",
    deel_van_huis: "",
    status: "Schatting",
    betaald_door: "Ntb",
  });

  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { ensureHousePart } = useHouseParts(projectId);
  const { canUseAi, remaining, limit, isUnlimited, isLoading: isLoadingAi, refetch: refetchAiUsage } = useAiUsage();
  const { currentTier } = useSubscription();
  
  // Get custom payer and category options for this project
  const { data: payerOptions = [] } = useCostPayers(projectId);
  const { data: categoryOptions = [] } = useCostCategories(projectId);
  const betaaldDoorOptions = payerOptions.length > 0 ? payerOptions : ["Ron", "Monique", "Gezamenlijk", "Ntb"];

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

    // Check if user can use AI
    if (!canUseAi) {
      if (currentTier === 'free') {
        toast.error("AI factuurscanning is alleen beschikbaar vanaf het Basis abonnement");
      } else {
        toast.error("Je hebt de maandelijkse limiet bereikt. Upgrade naar Pro voor onbeperkte scans.");
      }
      return;
    }

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
      
      setUploadedFilePaths(prev => [...prev, fileName]);

      toast.info("Factuur wordt geanalyseerd...");
      
      const { data: ocrData, error: functionError } = await supabase.functions
        .invoke('process-invoice', {
          body: { filePath: fileName }
        });

      if (functionError) throw functionError;

      // Check for upgrade required error
      if (ocrData?.requiresUpgrade) {
        toast.error(ocrData.error);
        return;
      }

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
          betaald_door: formData.betaald_door,
        });

        // Refetch AI usage to update remaining count
        refetchAiUsage();

        toast.success("Factuurgegevens succesvol ingelezen!");
      } else {
        toast.warning(ocrData?.error || "Factuur geüpload, maar automatische extractie mislukt. Vul de gegevens handmatig in.");
      }
    } catch (error: any) {
      console.error("OCR error:", error);
      toast.error(error.message || "Fout bij het verwerken van de factuur");
      
      if (uploadedFilePaths.length > 0) {
        await supabase.storage.from('invoices').remove(uploadedFilePaths);
        setUploadedFilePaths([]);
      }
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleRemoveFile = async () => {
    // Remove the last uploaded file (the one from AI scan)
    if (uploadedFilePaths.length > 0) {
      const lastPath = uploadedFilePaths[uploadedFilePaths.length - 1];
      await supabase.storage.from('invoices').remove([lastPath]);
      setUploadedFilePaths(prev => prev.slice(0, -1));
    }
    setSelectedFile(null);
  };

  const handleManualFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!validateFile(file)) continue;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Niet ingelogd");

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, file);

        if (uploadError) throw uploadError;
        setUploadedFilePaths(prev => [...prev, fileName]);
        toast.success(`${file.name} geüpload`);
      } catch (error: any) {
        toast.error(`Fout bij uploaden ${file.name}: ${error.message}`);
      }
    }
    e.target.value = "";
  };

  const handleRemoveUploadedFile = async (index: number) => {
    const path = uploadedFilePaths[index];
    await supabase.storage.from('invoices').remove([path]);
    setUploadedFilePaths(prev => prev.filter((_, i) => i !== index));
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
        factuur_url: uploadedFilePaths.length > 0 ? uploadedFilePaths[0] : null,
        factuur_urls: uploadedFilePaths.length > 0 ? uploadedFilePaths : [],
        deel_van_huis: formData.deel_van_huis || null,
        status: formData.status as any,
        betaald_door: formData.betaald_door,
      }]);

      if (error) throw error;

      // Ensure house part is registered centrally
      if (formData.deel_van_huis) {
        await ensureHousePart(formData.deel_van_huis);
      }

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
        betaald_door: "Ntb",
      });
      setSelectedFile(null);
      setUploadedFilePaths([]);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  // AI usage indicator component
  const AiUsageIndicator = () => {
    if (isLoadingAi) return null;

    if (currentTier === 'free') {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">AI niet beschikbaar</p>
            <p className="text-xs text-muted-foreground">Upgrade voor AI factuurscanning</p>
          </div>
          <Button size="sm" variant="default" onClick={() => navigate('/pricing')}>
            <Sparkles className="h-3 w-3 mr-1" />
            Upgrade
          </Button>
        </div>
      );
    }

    if (isUnlimited) {
      return (
        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Pro abonnement</p>
            <p className="text-xs text-muted-foreground">Onbeperkte AI scans</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Infinity className="h-3 w-3 mr-1" />
            Onbeperkt
          </Badge>
        </div>
      );
    }

    // Basis tier with limited scans
    const usagePercentage = limit > 0 ? ((limit - remaining) / limit) * 100 : 0;
    const isNearLimit = remaining <= 2;

    return (
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${isNearLimit ? 'bg-destructive/5 border-destructive/20' : 'bg-muted/50 border-border'}`}>
        <Sparkles className={`h-4 w-4 ${isNearLimit ? 'text-destructive' : 'text-primary'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium">AI factuurscanning</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${isNearLimit ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${usagePercentage}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {remaining} van {limit} over
            </span>
          </div>
        </div>
        {isNearLimit && (
          <Button size="sm" variant="outline" onClick={() => navigate('/pricing')}>
            Upgrade
          </Button>
        )}
      </div>
    );
  };

  const formContent = (
    <>
      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">Handmatig</TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <AiUsageIndicator />

          {currentTier !== 'free' && canUseAi && (
            <>
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

              {!uploadedFilePaths.length && (
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
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Analyseer met AI
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </>
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
            className="text-base"
          />
        </div>

        {/* Uploaded files list + manual upload button */}
        <div>
          <Label>Bestanden ({uploadedFilePaths.length})</Label>
          {uploadedFilePaths.length > 0 && (
            <div className="space-y-2 mt-2">
              {uploadedFilePaths.map((path, index) => (
                <div key={path} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm truncate flex-1">{path.split('/').pop()}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleRemoveUploadedFile(index)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-2">
            <input
              type="file"
              id="manual-file-upload"
              className="hidden"
              accept="image/*,application/pdf"
              multiple
              onChange={handleManualFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('manual-file-upload')?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Bestand toevoegen
            </Button>
          </div>
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
        <KeyboardAwareDrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{UI.costs.dialogs.createTitle}</DrawerTitle>
            <DrawerDescription>
              Voeg een kostenpost toe of upload een factuur.
            </DrawerDescription>
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
              disabled={loading || processingOCR} 
              className="flex-1"
            >
              {loading ? UI.actions.processing : UI.actions.add}
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
          <DialogTitle>{UI.costs.dialogs.createTitle}</DialogTitle>
          <DialogDescription>
            {UI.costs.dialogs.createDescription}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateCostDialog;
