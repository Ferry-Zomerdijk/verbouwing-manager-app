import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X, Loader2, Link } from "lucide-react";
import { DocumentPickerDialog } from "./DocumentPickerDialog";

interface MaintenanceAttachmentSectionProps {
  projectId: string;
  bijlageUrl: string | null;
  setBijlageUrl: (url: string | null) => void;
  documentId: string | null;
  setDocumentId: (id: string | null) => void;
  linkedDocumentName: string | null;
  setLinkedDocumentName: (name: string | null) => void;
}

export function MaintenanceAttachmentSection({
  projectId,
  bijlageUrl,
  setBijlageUrl,
  documentId,
  setDocumentId,
  linkedDocumentName,
  setLinkedDocumentName,
}: MaintenanceAttachmentSectionProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ext = file.name.split(".").pop();
      const path = `${user.id}/${projectId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("invoices")
        .getPublicUrl(path);

      setBijlageUrl(publicUrl);
      // Clear linked document if uploading a file
      setDocumentId(null);
      setLinkedDocumentName(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || t.errors.generic);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDocumentSelect = (doc: { id: string; bestandsnaam: string; bestand_url: string }) => {
    setDocumentId(doc.id);
    setLinkedDocumentName(doc.bestandsnaam);
    // Clear uploaded file if selecting a document
    setBijlageUrl(null);
  };

  const handleRemove = () => {
    setBijlageUrl(null);
    setDocumentId(null);
    setLinkedDocumentName(null);
  };

  const hasAttachment = bijlageUrl || documentId;
  const displayName = documentId
    ? linkedDocumentName || t.management.maintenance.labels.linkedDocument
    : bijlageUrl
      ? bijlageUrl.split("/").pop() || t.management.maintenance.labels.attachment
      : null;

  return (
    <div className="sm:col-span-2">
      <Label>{t.management.maintenance.labels.attachment}</Label>

      {hasAttachment ? (
        <div className="flex items-center gap-2 mt-1 p-2 rounded-md border bg-muted/50">
          {documentId ? (
            <Link className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span className="text-sm truncate flex-1">{displayName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 mt-1">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-1 h-4 w-4" />
            )}
            {t.management.maintenance.labels.uploadFile}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
          >
            <FileText className="mr-1 h-4 w-4" />
            {t.management.maintenance.labels.chooseFromDocuments}
          </Button>
        </div>
      )}

      <DocumentPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        projectId={projectId}
        onSelect={handleDocumentSelect}
      />
    </div>
  );
}
