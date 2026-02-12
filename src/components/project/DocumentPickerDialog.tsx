import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, FileText, Loader2 } from "lucide-react";

interface DocumentPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSelect: (doc: { id: string; bestandsnaam: string; bestand_url: string }) => void;
}

export function DocumentPickerDialog({ open, onOpenChange, projectId, onSelect }: DocumentPickerDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");

  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents-picker", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, bestandsnaam, bestand_url")
        .eq("project_id", projectId)
        .order("upload_datum", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open && !!projectId,
  });

  const filtered = documents?.filter((doc) =>
    !search || doc.bestandsnaam.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <div className="space-y-3 px-4 sm:px-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.actions.search + "..."}
          className="pl-9 h-9"
        />
      </div>
      <div className="max-h-[300px] overflow-y-auto space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t.documents.messages.noDocuments}
          </p>
        ) : (
          filtered.map((doc) => (
            <Button
              key={doc.id}
              variant="ghost"
              className="w-full justify-start gap-2 h-auto py-2"
              onClick={() => {
                onSelect(doc);
                onOpenChange(false);
              }}
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm">{doc.bestandsnaam}</span>
            </Button>
          ))
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t.management.maintenance.labels.chooseFromDocuments}</DrawerTitle>
          </DrawerHeader>
          <div className="pb-4">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{t.management.maintenance.labels.chooseFromDocuments}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
