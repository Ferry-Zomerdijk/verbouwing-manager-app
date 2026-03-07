import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useHouseParts } from "@/hooks/useHouseParts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { MaintenanceAttachmentSection } from "./MaintenanceAttachmentSection";
import { DatePicker } from "@/components/ui/date-picker";
import { MonthPicker } from "./MonthPicker";

// HOUSE_PART_SUGGESTIONS removed - now using useHouseParts hook

interface CreateMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function CreateMaintenanceDialog({ open, onOpenChange, projectId }: CreateMaintenanceDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { housePartNames, ensureHousePart } = useHouseParts(projectId);

  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [deelVanHuis, setDeelVanHuis] = useState("");
  const [frequentie, setFrequentie] = useState("");
  const [customAmount, setCustomAmount] = useState(1);
  const [customUnit, setCustomUnit] = useState("maanden");
  const [contactNaam, setContactNaam] = useState("");
  const [contactTelefoon, setContactTelefoon] = useState("");
  const [bijlageUrl, setBijlageUrl] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [linkedDocumentName, setLinkedDocumentName] = useState<string | null>(null);
  const [periodeVan, setPeriodeVan] = useState<number | null>(null);
  const [periodeTot, setPeriodeTot] = useState<number | null>(null);
  const [status, setStatus] = useState("Nog doen");
  const [laatsteOnderhoud, setLaatsteOnderhoud] = useState("");

  const frequencies = [
    { value: "Wekelijks", label: t.management.maintenance.frequencies.weekly },
    { value: "Tweewekelijks", label: t.management.maintenance.frequencies.biweekly },
    { value: "Maandelijks", label: t.management.maintenance.frequencies.monthly },
    { value: "Per kwartaal", label: t.management.maintenance.frequencies.quarterly },
    { value: "Halfjaarlijks", label: t.management.maintenance.frequencies.biannual },
    { value: "Jaarlijks", label: t.management.maintenance.frequencies.yearly },
    { value: "Bij storing", label: t.management.maintenance.frequencies.onFailure },
    { value: "Indien nodig", label: t.management.maintenance.frequencies.asNeeded },
    { value: "Aangepast", label: t.management.maintenance.frequencies.custom },
  ];

  const customUnits = [
    { value: "dagen", label: t.management.maintenance.frequencies.days },
    { value: "weken", label: t.management.maintenance.frequencies.weeks },
    { value: "maanden", label: t.management.maintenance.frequencies.months },
    { value: "jaren", label: t.management.maintenance.frequencies.years },
  ];

  const getFrequentieValue = () => {
    if (frequentie === "Aangepast") {
      return `Elke ${customAmount} ${customUnit}`;
    }
    return frequentie || null;
  };

  const resetForm = () => {
    setTitel("");
    setBeschrijving("");
    setDeelVanHuis("");
    setFrequentie("");
    setCustomAmount(1);
    setCustomUnit("maanden");
    setContactNaam("");
    setContactTelefoon("");
    setBijlageUrl(null);
    setDocumentId(null);
    setLinkedDocumentName(null);
    setPeriodeVan(null);
    setPeriodeTot(null);
    setStatus("Nog doen");
    setLaatsteOnderhoud("");
  };

  const handleSubmit = async () => {
    if (!titel.trim()) {
      toast.error(t.errors.required);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("maintenance_instructions" as any)
        .insert({
          project_id: projectId,
          titel: titel.trim(),
          beschrijving: beschrijving.trim() || null,
          deel_van_huis: deelVanHuis.trim() || null,
          frequentie: getFrequentieValue(),
          contact_naam: contactNaam.trim() || null,
          contact_telefoon: contactTelefoon.trim() || null,
          bijlage_url: bijlageUrl || null,
          document_id: documentId || null,
          periode_van: periodeVan,
          periode_tot: periodeTot,
          status,
          laatste_onderhoud: laatsteOnderhoud || null,
        });

      if (error) throw error;

      // Ensure house part is registered centrally
      if (deelVanHuis.trim()) {
        await ensureHousePart(deelVanHuis.trim());
      }

      toast.success(t.management.maintenance.messages.created);
      queryClient.invalidateQueries({ queryKey: ["maintenance-instructions", projectId] });
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating instruction:", error);
      toast.error(error.message || t.errors.generic);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-4 px-4 sm:px-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label>{t.management.maintenance.labels.title} *</Label>
          <Input
            value={titel}
            onChange={(e) => setTitel(e.target.value)}
            placeholder={t.management.maintenance.placeholders.title}
          />
        </div>

        <div>
          <Label>{t.management.maintenance.status.label}</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nog doen">{t.management.maintenance.status.todo}</SelectItem>
              <SelectItem value="Mee bezig">{t.management.maintenance.status.inProgress}</SelectItem>
              <SelectItem value="Gedaan">{t.management.maintenance.status.done}</SelectItem>
              <SelectItem value="On hold">{t.management.maintenance.status.onHold}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t.management.maintenance.labels.partOfHouse}</Label>
          <Select value={deelVanHuis} onValueChange={setDeelVanHuis}>
            <SelectTrigger>
              <SelectValue placeholder={t.management.maintenance.placeholders.partOfHouse} />
            </SelectTrigger>
            <SelectContent>
              {housePartNames.map((part) => (
                <SelectItem key={part} value={part}>{part}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className={frequentie === "Aangepast" ? "sm:col-span-2" : ""}>
          <Label>{t.management.maintenance.labels.frequency}</Label>
          <Select value={frequentie} onValueChange={setFrequentie}>
            <SelectTrigger>
              <SelectValue placeholder={t.management.maintenance.placeholders.frequency} />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((f) => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {frequentie === "Aangepast" && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{t.management.maintenance.frequencies.every}</span>
              <Input
                type="number"
                min={1}
                value={customAmount}
                onChange={(e) => setCustomAmount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20"
              />
              <Select value={customUnit} onValueChange={setCustomUnit}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {customUnits.map((u) => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label>{t.management.maintenance.labels.description}</Label>
          <Textarea
            value={beschrijving}
            onChange={(e) => setBeschrijving(e.target.value)}
            placeholder={t.management.maintenance.placeholders.description}
            rows={4}
          />
        </div>

        <div>
          <Label>{t.management.maintenance.labels.periodFrom}</Label>
          <MonthPicker value={periodeVan} onChange={setPeriodeVan} />
        </div>

        <div>
          <Label>{t.management.maintenance.labels.periodTo}</Label>
          <MonthPicker value={periodeTot} onChange={setPeriodeTot} />
        </div>

        <div>
          <Label>{t.management.maintenance.labels.lastMaintenance}</Label>
          <DatePicker
            value={laatsteOnderhoud}
            onChange={setLaatsteOnderhoud}
          />
        </div>

        <div>
          <Label>{t.management.maintenance.labels.contactName}</Label>
          <Input
            value={contactNaam}
            onChange={(e) => setContactNaam(e.target.value)}
            placeholder={t.management.maintenance.placeholders.contactName}
          />
        </div>

        <div>
          <Label>{t.management.maintenance.labels.contactPhone}</Label>
          <Input
            value={contactTelefoon}
            onChange={(e) => setContactTelefoon(e.target.value)}
            placeholder={t.management.maintenance.placeholders.contactPhone}
            type="tel"
          />
        </div>

        <MaintenanceAttachmentSection
          projectId={projectId}
          bijlageUrl={bijlageUrl}
          setBijlageUrl={setBijlageUrl}
          documentId={documentId}
          setDocumentId={setDocumentId}
          linkedDocumentName={linkedDocumentName}
          setLinkedDocumentName={setLinkedDocumentName}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t.actions.cancel}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? t.actions.creating : t.actions.create}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t.management.maintenance.dialogs.createTitle}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[70vh] pb-4">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t.management.maintenance.dialogs.createTitle}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
