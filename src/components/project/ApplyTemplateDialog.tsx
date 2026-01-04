import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { renovationTemplates, RenovationTemplate } from "@/lib/renovationTemplates";
import { 
  ArrowLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Lightbulb,
  ShowerHead,
  ChefHat,
  Home,
  Building2,
  Square,
  Warehouse,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApplyTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

const iconMap: { [key: string]: React.ElementType } = {
  ShowerHead,
  ChefHat,
  Home,
  Building2,
  Square,
  Warehouse
};

export function ApplyTemplateDialog({ 
  open, 
  onOpenChange, 
  projectId,
  onSuccess 
}: ApplyTemplateDialogProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<RenovationTemplate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const applyTemplateMutation = useMutation({
    mutationFn: async (template: RenovationTemplate) => {
      const tasksToInsert = template.taken.map(task => ({
        project_id: projectId,
        titel: task.titel,
        beschrijving: task.beschrijving,
        deel_van_huis: task.deel_van_huis,
        prioriteit: task.prioriteit,
        status: 'Te doen' as const
      }));

      const { error } = await supabase
        .from('tasks')
        .insert(tasksToInsert);

      if (error) throw error;
      return template;
    },
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      toast({
        title: "Template toegepast",
        description: `${template.taken.length} taken toegevoegd uit "${template.naam}"`,
      });
      onSuccess?.();
      handleClose();
    },
    onError: (error) => {
      console.error('Error applying template:', error);
      toast({
        title: "Fout bij toepassen template",
        description: "Probeer het opnieuw",
        variant: "destructive"
      });
    }
  });

  const handleClose = () => {
    setSelectedTemplate(null);
    onOpenChange(false);
  };

  const handleBack = () => {
    setSelectedTemplate(null);
  };

  const content = (
    <AnimatePresence mode="wait">
      {!selectedTemplate ? (
        <motion.div
          key="grid"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">
            Kies een template om direct een complete takenlijst toe te voegen aan je project.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {renovationTemplates.map((template) => {
              const Icon = iconMap[template.icon] || ClipboardList;
              return (
                <motion.button
                  key={template.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTemplate(template)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/50 transition-colors text-center"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{template.naam}</p>
                    <p className="text-xs text-muted-foreground">{template.taken.length} taken</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Terug
            </Button>
          </div>

          <div className="flex items-center gap-3">
            {(() => {
              const Icon = iconMap[selectedTemplate.icon] || ClipboardList;
              return (
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
              );
            })()}
            <div>
              <h3 className="font-semibold text-lg">{selectedTemplate.naam}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{selectedTemplate.geschatte_doorlooptijd}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {selectedTemplate.beschrijving}
          </p>

          {selectedTemplate.vergunningen.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Mogelijk benodigde vergunningen</span>
              </div>
              <ul className="space-y-2">
                {selectedTemplate.vergunningen.map((permit, index) => (
                  <li key={index} className="text-sm">
                    <p className="font-medium">{permit.naam}</p>
                    <p className="text-muted-foreground text-xs">{permit.wanneer_nodig}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Taken ({selectedTemplate.taken.length})
              </h4>
            </div>
            <ScrollArea className="h-[200px] rounded-lg border bg-muted/30 p-3">
              <ol className="space-y-1.5">
                {selectedTemplate.taken.map((task, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-muted-foreground min-w-[20px]">{index + 1}.</span>
                    <div>
                      <span>{task.titel}</span>
                      {task.vergunning_gerelateerd && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Vergunning
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </div>

          {selectedTemplate.tips.length > 0 && (
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lightbulb className="h-4 w-4" />
                <span className="font-medium text-sm">Tips</span>
              </div>
              <ul className="space-y-1">
                {selectedTemplate.tips.slice(0, 3).map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={() => applyTemplateMutation.mutate(selectedTemplate)}
            disabled={applyTemplateMutation.isPending}
          >
            {applyTemplateMutation.isPending ? (
              "Bezig met toepassen..."
            ) : (
              <>
                <ClipboardList className="h-4 w-4 mr-2" />
                Template toepassen ({selectedTemplate.taken.length} taken)
              </>
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Checklist Template
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
          {!selectedTemplate && (
            <DrawerFooter>
              <Button variant="outline" onClick={handleClose}>Annuleren</Button>
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Checklist Template
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
