import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { renovationTemplates, RenovationTemplate } from "@/lib/renovationTemplates";
import { ClipboardList, ShowerHead, ChefHat, Home, Building2, Layers, Building } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Map template types to project type input values
const typeToTemplateMap: Record<string, string> = {
  'badkamer': 'badkamer',
  'keuken': 'keuken',
  'dakkapel': 'dakkapel',
  'aanbouw': 'aanbouw',
  'uitbouw': 'aanbouw',
  'vloer': 'vloer',
  'zolder': 'zolder',
};

const getIconForTemplate = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    ShowerHead: <ShowerHead className="h-4 w-4" />,
    ChefHat: <ChefHat className="h-4 w-4" />,
    Home: <Home className="h-4 w-4" />,
    Building2: <Building2 className="h-4 w-4" />,
    Layers: <Layers className="h-4 w-4" />,
    Building: <Building className="h-4 w-4" />,
  };
  return icons[iconName] || <ClipboardList className="h-4 w-4" />;
};

const CreateProjectDialog = ({ open, onOpenChange, onSuccess }: CreateProjectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    type: "",
    status: "Gepland",
    startdatum: "",
    einddatum: "",
    beschrijving: "",
    totaal_begroting: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<RenovationTemplate | null>(null);
  const [applyTemplate, setApplyTemplate] = useState(true);

  const isMobile = useIsMobile();
  const { currentTier, hasReachedLimit, limits } = useSubscription();

  // Find matching template based on project type
  const findMatchingTemplate = (type: string): RenovationTemplate | null => {
    const normalizedType = type.toLowerCase().trim();
    for (const [key, templateId] of Object.entries(typeToTemplateMap)) {
      if (normalizedType.includes(key)) {
        return renovationTemplates.find(t => t.id === templateId) || null;
      }
    }
    return null;
  };

  // Update selected template when type changes
  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, type });
    const template = findMatchingTemplate(type);
    setSelectedTemplate(template);
    if (template) {
      setApplyTemplate(true);
    }
  };

  // Get current project count
  const { data: projectCount = 0 } = useQuery({
    queryKey: ["projectCount"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;
      
      const { count, error } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: open,
  });

  const isLimitReached = hasReachedLimit("maxProjects", projectCount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Je moet ingelogd zijn om een project aan te maken");
        return;
      }

      const { data: project, error } = await supabase.from("projects").insert([{
        user_id: user.id,
        naam: formData.naam,
        type: formData.type || null,
        status: formData.status as any,
        startdatum: formData.startdatum || null,
        einddatum: formData.einddatum || null,
        beschrijving: formData.beschrijving || null,
        totaal_begroting: formData.totaal_begroting ? parseFloat(formData.totaal_begroting) : 0,
      }]).select().single();

      if (error) throw error;

      // If template is selected and user wants to apply it, create tasks
      if (selectedTemplate && applyTemplate && project) {
        const tasksToInsert = selectedTemplate.taken.map(task => ({
          project_id: project.id,
          titel: task.titel,
          beschrijving: task.beschrijving,
          deel_van_huis: task.deel_van_huis,
          prioriteit: task.prioriteit,
          status: 'Te doen' as const,
        }));

        const { error: tasksError } = await supabase.from("tasks").insert(tasksToInsert);
        
        if (tasksError) {
          console.error("Error creating tasks:", tasksError);
          toast.warning("Project aangemaakt, maar taken konden niet worden toegevoegd");
        } else {
          toast.success(`Project aangemaakt met ${tasksToInsert.length} taken uit template`);
        }
      } else {
        toast.success("Project aangemaakt");
      }

      onSuccess();
      onOpenChange(false);
      setFormData({
        naam: "",
        type: "",
        status: "Gepland",
        startdatum: "",
        einddatum: "",
        beschrijving: "",
        totaal_begroting: "",
      });
      setSelectedTemplate(null);
      setApplyTemplate(true);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  // Show upgrade prompt if limit reached
  if (isLimitReached) {
    const upgradeContent = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Je hebt {projectCount} van {limits.maxProjects} projecten gebruikt.
        </p>
        <UpgradePrompt currentTier={currentTier} limitType="maxProjects" />
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Projectlimiet bereikt</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {upgradeContent}
            </div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Projectlimiet bereikt</DialogTitle>
          </DialogHeader>
          {upgradeContent}
        </DialogContent>
      </Dialog>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="naam">Projectnaam *</Label>
          <Input
            id="naam"
            value={formData.naam}
            onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
            placeholder="Badkamer renovatie"
            required
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="template">Template (optioneel)</Label>
          <Select 
            value={selectedTemplate?.id || "none"} 
            onValueChange={(value) => {
              if (value === "none") {
                setSelectedTemplate(null);
                setFormData({ ...formData, type: "" });
              } else {
                const template = renovationTemplates.find(t => t.id === value);
                if (template) {
                  setSelectedTemplate(template);
                  setFormData({ ...formData, type: template.naam });
                  setApplyTemplate(true);
                }
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kies een template..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Geen template</SelectItem>
              {renovationTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  <div className="flex items-center gap-2">
                    {getIconForTemplate(template.icon)}
                    <span>{template.naam}</span>
                    <span className="text-muted-foreground text-xs">({template.taken.length} taken)</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTemplate && (
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
              <Checkbox
                id="applyTemplate"
                checked={applyTemplate}
                onCheckedChange={(checked) => setApplyTemplate(checked === true)}
                className="mt-0.5"
              />
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="applyTemplate"
                  className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2"
                >
                  {getIconForTemplate(selectedTemplate.icon)}
                  {selectedTemplate.taken.length} taken toevoegen
                </label>
                <p className="text-xs text-muted-foreground">
                  {selectedTemplate.geschatte_doorlooptijd} doorlooptijd
                </p>
                {selectedTemplate.vergunningen.length > 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    ⚠️ Let op: mogelijk vergunning nodig
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Gepland">Gepland</SelectItem>
              <SelectItem value="Lopend">Lopend</SelectItem>
              <SelectItem value="Afgerond">Afgerond</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="startdatum">Startdatum</Label>
          <Input
            id="startdatum"
            type="date"
            value={formData.startdatum}
            onChange={(e) => setFormData({ ...formData, startdatum: e.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="einddatum">Einddatum</Label>
          <Input
            id="einddatum"
            type="date"
            value={formData.einddatum}
            onChange={(e) => setFormData({ ...formData, einddatum: e.target.value })}
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="totaal_begroting">Totaal Budget (€)</Label>
          <Input
            id="totaal_begroting"
            type="number"
            step="0.01"
            value={formData.totaal_begroting}
            onChange={(e) => setFormData({ ...formData, totaal_begroting: e.target.value })}
            placeholder="10000"
          />
        </div>

        <div className="col-span-1 sm:col-span-2">
          <Label htmlFor="beschrijving">Beschrijving</Label>
          <Textarea
            id="beschrijving"
            value={formData.beschrijving}
            onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
            placeholder="Beschrijf je renovatieproject..."
            rows={4}
          />
        </div>
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuleren
          </Button>
          <Button type="submit" disabled={loading} className="gradient-primary">
            {loading ? "Bezig..." : "Project Aanmaken"}
          </Button>
        </div>
      )}
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Nieuw Renovatieproject</DrawerTitle>
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
              disabled={loading} 
              className="flex-1 gradient-primary"
            >
              {loading ? "Bezig..." : "Aanmaken"}
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
          <DialogTitle>Nieuw Renovatieproject</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
