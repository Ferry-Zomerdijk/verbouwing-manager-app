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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Euro, Image, Wrench, KeyRound, Loader2 } from "lucide-react";

interface HousePartDetailDialogProps {
  projectId: string;
  partName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HousePartDetailDialog({
  projectId,
  partName,
  open,
  onOpenChange,
}: HousePartDetailDialogProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();

  const { data, isLoading } = useQuery({
    queryKey: ["house-part-detail", projectId, partName],
    queryFn: async () => {
      const [tasks, costs, photos, maint, keys] = await Promise.all([
        (supabase as any).from("tasks").select("id, titel, status").eq("project_id", projectId).eq("deel_van_huis", partName),
        (supabase as any).from("costs").select("id, beschrijving, bedrag, categorie").eq("project_id", projectId).eq("deel_van_huis", partName),
        (supabase as any).from("photos").select("id, notitie, fase").eq("project_id", projectId).eq("deel_van_huis", partName),
        (supabase as any).from("maintenance_instructions").select("id, titel, frequentie").eq("project_id", projectId).eq("deel_van_huis", partName),
        (supabase as any).from("keys").select("id, key_number, current_holder").eq("project_id", projectId).eq("deel_van_huis", partName),
      ]);
      return {
        tasks: tasks.data || [],
        costs: costs.data || [],
        photos: photos.data || [],
        maintenance: maint.data || [],
        keys: keys.data || [],
      };
    },
    enabled: open && !!partName,
  });

  const title = t.management.houseParts.detail.title.replace("{name}", partName);

  const sections = [
    {
      key: "tasks",
      icon: ListTodo,
      label: t.tasks.title,
      items: data?.tasks || [],
      render: (item: any) => (
        <div className="flex justify-between items-center py-1.5 px-2 rounded bg-muted/40">
          <span className="text-sm">{item.titel}</span>
          <Badge variant="outline" className="text-xs">{item.status}</Badge>
        </div>
      ),
    },
    {
      key: "costs",
      icon: Euro,
      label: t.costs.title,
      items: data?.costs || [],
      render: (item: any) => (
        <div className="flex justify-between items-center py-1.5 px-2 rounded bg-muted/40">
          <span className="text-sm">{item.beschrijving || item.categorie}</span>
          <span className="text-sm font-medium">€ {Number(item.bedrag).toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</span>
        </div>
      ),
    },
    {
      key: "photos",
      icon: Image,
      label: t.photos.title,
      items: data?.photos || [],
      render: (item: any) => (
        <div className="py-1.5 px-2 rounded bg-muted/40">
          <span className="text-sm">{item.notitie || `Foto (${item.fase})`}</span>
        </div>
      ),
    },
    {
      key: "maintenance",
      icon: Wrench,
      label: t.management.maintenance.title,
      items: data?.maintenance || [],
      render: (item: any) => (
        <div className="flex justify-between items-center py-1.5 px-2 rounded bg-muted/40">
          <span className="text-sm">{item.titel}</span>
          {item.frequentie && <Badge variant="outline" className="text-xs">{item.frequentie}</Badge>}
        </div>
      ),
    },
    {
      key: "keys",
      icon: KeyRound,
      label: t.management.keys.title,
      items: data?.keys || [],
      render: (item: any) => (
        <div className="flex justify-between items-center py-1.5 px-2 rounded bg-muted/40">
          <span className="text-sm">{item.key_number}</span>
          {item.current_holder && <span className="text-xs text-muted-foreground">{item.current_holder}</span>}
        </div>
      ),
    },
  ].filter((s) => s.items.length > 0);

  const content = (
    <div className="space-y-2 px-1">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sections.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t.management.houseParts.detail.noItems}</p>
      ) : (
        <Accordion type="multiple" defaultValue={sections.map((s) => s.key)}>
          {sections.map((section) => (
            <AccordionItem key={section.key} value={section.key}>
              <AccordionTrigger className="py-2">
                <div className="flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-muted-foreground" />
                  <span>{section.label}</span>
                  <Badge variant="secondary" className="text-xs">{section.items.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {section.items.map((item: any) => (
                    <div key={item.id}>{section.render(item)}</div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-6">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
