import { useState, useEffect } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
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

const HOUSE_PART_SUGGESTIONS = [
  "CV-ketel en verwarming",
  "Airconditioning",
  "Dakgoten en afvoer",
  "Elektrische installatie",
  "Waterleiding en sanitair",
  "Tuin en buitenruimte",
  "Alarm en beveiliging",
  "Zonnepanelen",
  "Ventilatie en afzuiging",
  "Zwembad/jacuzzi",
  "Keuken",
  "Badkamer",
  "Dak",
  "Gevels",
  "Ramen en deuren",
];

export interface MaintenanceInstruction {
  id: string;
  project_id: string;
  titel: string;
  beschrijving: string | null;
  deel_van_huis: string | null;
  frequentie: string | null;
  contact_naam: string | null;
  contact_telefoon: string | null;
  bijlage_url: string | null;
  document_id: string | null;
  volgorde: number;
  created_at: string;
}

interface EditMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruction: MaintenanceInstruction | null;
}

export function EditMaintenanceDialog({ open, onOpenChange, instruction }: EditMaintenanceDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [titel, setTitel] = useState("");
  const [beschrijving, setBeschrijving] = useState("");
  const [deelVanHuis, setDeelVanHuis] = useState("");
  const [frequentie, setFrequentie] = useState("");
  const [contactNaam, setContactNaam] = useState("");
  const [contactTelefoon, setContactTelefoon] = useState("");
  const [bijlageUrl, setBijlageUrl] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [linkedDocumentName, setLinkedDocumentName] = useState<string | null>(null);

  // Fetch linked document name if document_id exists
  const { data: linkedDoc } = useQuery({
    queryKey: ["document-name", instruction?.document_id],
    queryFn: async () => {
      if (!instruction?.document_id) return null;
      const { data } = await supabase
        .from("documents")
        .select("bestandsnaam")
        .eq("id", instruction.document_id)
        .single();
      return data;
    },
    enabled: open && !!instruction?.document_id,
  });

  useEffect(() => {
    if (instruction) {
      setTitel(instruction.titel);
      setBeschrijving(instruction.beschrijving || "");
      setDeelVanHuis(instruction.deel_van_huis || "");
      setFrequentie(instruction.frequentie || "");
      setContactNaam(instruction.contact_naam || "");
      setContactTelefoon(instruction.contact_telefoon || "");
      setBijlageUrl(instruction.bijlage_url || null);
      setDocumentId(instruction.document_id || null);
    }
  }, [instruction]);

  useEffect(() => {
    if (linkedDoc) {
      setLinkedDocumentName(linkedDoc.bestandsnaam);
    }
  }, [linkedDoc]);

  const frequencies = [
    { value: "Wekelijks", label: t.management.maintenance.frequencies.weekly },
    { value: "Maandelijks", label: t.management.maintenance.frequencies.monthly },
    { value: "Per kwartaal", label: t.management.maintenance.frequencies.quarterly },
    { value: "Halfjaarlijks", label: t.management.maintenance.frequencies.biannual },
    { value: "Jaarlijks", label: t.management.maintenance.frequencies.yearly },
    { value: "Bij storing", label: t.management.maintenance.frequencies.onFailure },
    { value: "Indien nodig", label: t.management.maintenance.frequencies.asNeeded },
  ];

  const handleSubmit = async () => {
    if (!instruction || !titel.trim()) {
      toast.error(t.errors.required);
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("maintenance_instructions" as any)
        .update({
          titel: titel.trim(),
          beschrijving: beschrijving.trim() || null,
          deel_van_huis: deelVanHuis.trim() || null,
          frequentie: frequentie || null,
          contact_naam: contactNaam.trim() || null,
          contact_telefoon: contactTelefoon.trim() || null,
          bijlage_url: bijlageUrl || null,
          document_id: documentId || null,
        })
        .eq("id", instruction.id);

      if (error) throw error;

      toast.success(t.management.maintenance.messages.updated);
      queryClient.invalidateQueries({ queryKey: ["maintenance-instructions", instruction.project_id] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating instruction:", error);
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
          <Label>{t.management.maintenance.labels.partOfHouse}</Label>
          <Select value={deelVanHuis} onValueChange={setDeelVanHuis}>
            <SelectTrigger>
              <SelectValue placeholder={t.management.maintenance.placeholders.partOfHouse} />
            </SelectTrigger>
            <SelectContent>
              {HOUSE_PART_SUGGESTIONS.map((part) => (
                <SelectItem key={part} value={part}>{part}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
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

        {instruction && (
          <MaintenanceAttachmentSection
            projectId={instruction.project_id}
            bijlageUrl={bijlageUrl}
            setBijlageUrl={setBijlageUrl}
            documentId={documentId}
            setDocumentId={setDocumentId}
            linkedDocumentName={linkedDocumentName}
            setLinkedDocumentName={setLinkedDocumentName}
          />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2 sticky bottom-0 bg-background pb-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          {t.actions.cancel}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? t.actions.saving : t.actions.save}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t.management.maintenance.dialogs.editTitle}</DrawerTitle>
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
          <DialogTitle>{t.management.maintenance.dialogs.editTitle}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
