import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addToQueue } from "@/lib/offlineQueue";
import TaskUpdatesSection from "./TaskUpdatesSection";
import { TaskImagesSection } from "./TaskImagesSection";
import { AlertTriangle } from "lucide-react";
import { AutocompleteInput } from "./AutocompleteInput";

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

const EditTaskDialog = ({ open, onOpenChange, task, onSuccess, availableDelenVanHuis = [] }: EditTaskDialogProps) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [customDeelVanHuis, setCustomDeelVanHuis] = useState("");
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Get available verantwoordelijken from existing tasks
  const { data: existingVerantwoordelijken = [] } = useQuery({
    queryKey: ["available-verantwoordelijken", task?.project_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("verantwoordelijke")
        .eq("project_id", task.project_id);
      const unique = [...new Set(data?.map(t => t.verantwoordelijke).filter(Boolean) as string[])];
      return unique.sort();
    },
    enabled: open && !!task?.project_id,
  });

  const availableVerantwoordelijken = useMemo(() => existingVerantwoordelijken, [existingVerantwoordelijken]);

  // Focus op titel veld wanneer dialog opent (met delay om dropdown te laten sluiten)
  useEffect(() => {
    if (open && titleInputRef.current) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    begindatum: "",
    deadline: "",
    status: "Te doen",
    prioriteit: "Middel",
    verantwoordelijke: "",
    deel_van_huis: "",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [initialImageUrls, setInitialImageUrls] = useState<string[]>([]);

  // Store initial values to compare for dirty state
  const [initialFormData, setInitialFormData] = useState(formData);
  const [initialCustomDeelVanHuis, setInitialCustomDeelVanHuis] = useState("");

  const lastInitializedTaskIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    // Initialiseer form state alleen bij (1) openen, of (2) andere task.
    if (!open || !task?.id) {
      wasOpenRef.current = open;
      return;
    }

    const isFirstOpen = !wasOpenRef.current && open;
    const isNewTask = lastInitializedTaskIdRef.current !== task.id;

    if (!isFirstOpen && !isNewTask) {
      wasOpenRef.current = open;
      return;
    }

    const deelVanHuis = task.deel_van_huis || "";
    const isExisting = availableDelenVanHuis.includes(deelVanHuis);

    const newFormData = {
      titel: task.titel || "",
      beschrijving: task.beschrijving || "",
      begindatum: task.begindatum || "",
      deadline: task.deadline || "",
      status: task.status || "Te doen",
      prioriteit: task.prioriteit || "Middel",
      verantwoordelijke: task.verantwoordelijke || "",
      deel_van_huis: deelVanHuis && !isExisting && deelVanHuis !== "" ? "__custom__" : deelVanHuis,
    };

    setFormData(newFormData);
    setInitialFormData(newFormData);

    const customValue = deelVanHuis && !isExisting && deelVanHuis !== "" ? deelVanHuis : "";
    setCustomDeelVanHuis(customValue);
    setInitialCustomDeelVanHuis(customValue);

    // Initialize image URLs
    const taskImageUrls = task.image_urls || [];
    setImageUrls(taskImageUrls);
    setInitialImageUrls(taskImageUrls);

    lastInitializedTaskIdRef.current = task.id;
    wasOpenRef.current = open;
  }, [open, task?.id]);

  // Calculate dirty state
  const isDirty = useMemo(() => {
    if (!open) return false;
    
    const formChanged = 
      formData.titel !== initialFormData.titel ||
      formData.beschrijving !== initialFormData.beschrijving ||
      formData.begindatum !== initialFormData.begindatum ||
      formData.deadline !== initialFormData.deadline ||
      formData.status !== initialFormData.status ||
      formData.prioriteit !== initialFormData.prioriteit ||
      formData.verantwoordelijke !== initialFormData.verantwoordelijke ||
      formData.deel_van_huis !== initialFormData.deel_van_huis;

    const customChanged = 
      formData.deel_van_huis === "__custom__" && 
      customDeelVanHuis !== initialCustomDeelVanHuis;

    const imagesChanged = JSON.stringify(imageUrls) !== JSON.stringify(initialImageUrls);

    return formChanged || customChanged || imagesChanged;
  }, [formData, initialFormData, customDeelVanHuis, initialCustomDeelVanHuis, imageUrls, initialImageUrls, open]);

  const isDeadlineInvalid = formData.begindatum && formData.deadline && formData.deadline < formData.begindatum;

  // Handle close with dirty check
  const handleCloseRequest = (newOpen: boolean) => {
    if (newOpen) {
      onOpenChange(true);
      return;
    }
    
    // Closing requested
    if (isDirty) {
      setShowUnsavedWarning(true);
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    onOpenChange(false);
  };

  const handleCancelClose = () => {
    setShowUnsavedWarning(false);
  };

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      // Queue voor offline sync als offline
      if (!navigator.onLine) {
        addToQueue({ type: 'update', table: 'tasks', data: { id: task.id, ...updates } });
        return { id: task.id, ...updates };
      }

      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", task.id);

      if (error) throw error;
      return { id: task.id, ...updates };
    },
    onMutate: async (updates) => {
      // Cancel lopende fetches
      await queryClient.cancelQueries({ queryKey: ["tasks", task.project_id] });
      
      // Sla huidige state op voor rollback
      const previousTasks = queryClient.getQueryData(["tasks", task.project_id]);
      
      // Optimistic update
      queryClient.setQueryData(["tasks", task.project_id], (old: any[] | undefined) =>
        old?.map((t) =>
          t.id === task.id ? { ...t, ...updates } : t
        )
      );
      
      return { previousTasks };
    },
    onError: (error: any, variables, context) => {
      // Rollback bij error
      queryClient.setQueryData(["tasks", task.project_id], context?.previousTasks);
      toast.error(error?.message || error?.error_description || "Er is een fout opgetreden");
    },
    onSuccess: () => {
      toast.success(navigator.onLine ? "Taak bijgewerkt" : "Taak lokaal bijgewerkt (wordt gesync'd)");
      onSuccess();
      onOpenChange(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlineInvalid) {
      toast.error("Deadline kan niet voor begindatum liggen");
      return;
    }

    const finalDeelVanHuis =
      formData.deel_van_huis === "__custom__"
        ? customDeelVanHuis
        : formData.deel_van_huis === "__none__"
          ? null
          : formData.deel_van_huis;

    updateTaskMutation.mutate({
      titel: formData.titel,
      beschrijving: formData.beschrijving || null,
      begindatum: formData.begindatum || null,
      deadline: formData.deadline || null,
      status: formData.status as any,
      prioriteit: formData.prioriteit as any,
      verantwoordelijke: formData.verantwoordelijke || null,
      deel_van_huis: finalDeelVanHuis || null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
    });
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Dirty state indicator */}
      {isDirty && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">Je hebt niet-opgeslagen wijzigingen</span>
        </div>
      )}

      <div>
        <Label htmlFor="titel">Titel *</Label>
        <Input
          id="titel"
          ref={titleInputRef}
          value={formData.titel}
          onChange={(e) => setFormData((prev) => ({ ...prev, titel: e.target.value }))}
          placeholder="Taak titel"
          required
        />
      </div>

      <div>
        <Label htmlFor="beschrijving">Beschrijving</Label>
        <Textarea
          id="beschrijving"
          name="beschrijving"
          value={formData.beschrijving}
          onChange={(e) => setFormData((prev) => ({ ...prev, beschrijving: e.target.value }))}
          placeholder="Taak beschrijving..."
          rows={3}
          className="text-base"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prioriteit">Prioriteit</Label>
          <Select
            value={formData.prioriteit}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, prioriteit: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Laag">Laag</SelectItem>
              <SelectItem value="Middel">Middel</SelectItem>
              <SelectItem value="Hoog">Hoog</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Te doen">Te doen</SelectItem>
              <SelectItem value="Bezig">Bezig</SelectItem>
              <SelectItem value="Gereed">Gereed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="begindatum">Begindatum</Label>
          <Input
            id="begindatum"
            type="date"
            value={formData.begindatum}
            onChange={(e) => {
              const newBegindatum = e.target.value;
              setFormData((prev) => ({
                ...prev,
                begindatum: newBegindatum,
                deadline: prev.deadline || newBegindatum,
              }));
            }}
          />
        </div>

        <div>
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            value={formData.deadline}
            min={formData.begindatum || undefined}
            onChange={(e) => setFormData((prev) => ({ ...prev, deadline: e.target.value }))}
          />
          {formData.begindatum && formData.deadline && formData.deadline < formData.begindatum && (
            <p className="text-sm text-destructive mt-1">Deadline kan niet voor begindatum liggen</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="deel_van_huis">Deel van huis</Label>
        <Select
          value={formData.deel_van_huis || "__none__"}
          onValueChange={(value) => setFormData((prev) => ({ ...prev, deel_van_huis: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecteer of voer nieuw in" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Geen</SelectItem>
            {availableDelenVanHuis.map((deel) => (
              <SelectItem key={deel} value={deel}>
                {deel}
              </SelectItem>
            ))}
            <SelectItem value="__custom__">+ Nieuw toevoegen...</SelectItem>
          </SelectContent>
        </Select>
        {formData.deel_van_huis === "__custom__" && (
          <Input
            className="mt-2"
            value={customDeelVanHuis}
            onChange={(e) => setCustomDeelVanHuis(e.target.value)}
            placeholder="Voer nieuw deel van huis in"
          />
        )}
      </div>

      <div>
        <Label htmlFor="verantwoordelijke">Verantwoordelijke</Label>
        <AutocompleteInput
          placeholder="Typ een naam..."
          value={formData.verantwoordelijke}
          onChange={(value) => setFormData((prev) => ({ ...prev, verantwoordelijke: value }))}
          suggestions={availableVerantwoordelijken}
          allowCreate={true}
          createLabel="Voeg toe:"
          showAllOnFocus={true}
        />
      </div>

      <Separator className="my-4" />

      {/* Images Section */}
      {task?.id && (
        <TaskImagesSection
          taskId={task.id}
          projectId={task.project_id}
          imageUrls={imageUrls}
          onImagesChange={setImageUrls}
        />
      )}

      <Separator className="my-4" />

      {/* Updates Section */}
      {task?.id && (
        <TaskUpdatesSection taskId={task.id} />
      )}

      {/* Buttons - sticky on mobile */}
      <div className={`flex gap-3 pt-4 ${isMobile ? "sticky bottom-0 bg-background pb-2 border-t -mx-4 px-4 pt-4" : "justify-end"}`}>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => handleCloseRequest(true)}
          className={isMobile ? "flex-1" : ""}
        >
          Annuleren
        </Button>
        <Button 
          type="submit" 
          disabled={updateTaskMutation.isPending} 
          className={`gradient-primary ${isMobile ? "flex-1" : ""}`}
        >
          {updateTaskMutation.isPending ? "Opslaan..." : isDirty ? "Opslaan *" : "Opslaan"}
        </Button>
      </div>
    </form>
  );

  // Unsaved changes warning dialog
  const unsavedWarningDialog = (
    <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Niet-opgeslagen wijzigingen
          </AlertDialogTitle>
          <AlertDialogDescription>
            Je hebt wijzigingen gemaakt die nog niet zijn opgeslagen. Weet je zeker dat je wilt sluiten? Je wijzigingen gaan verloren.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancelClose}>
            Terug naar bewerken
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sluiten zonder opslaan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Mobile: use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={handleCloseRequest}>
          <KeyboardAwareDrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <div className="flex items-center gap-2">
                <DrawerTitle>Taak Bewerken</DrawerTitle>
                {isDirty && (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    Niet opgeslagen
                  </Badge>
                )}
              </div>
              <DrawerDescription className="sr-only">
                Bewerk de taakgegevens zoals titel, beschrijving, prioriteit, status en data.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {formContent}
            </div>
          </KeyboardAwareDrawerContent>
        </Drawer>
        {unsavedWarningDialog}
      </>
    );
  }

  // Desktop: use Dialog
  return (
    <>
      <Dialog open={open} onOpenChange={handleCloseRequest}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <DialogTitle>Taak Bewerken</DialogTitle>
              {isDirty && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                  Niet opgeslagen
                </Badge>
              )}
            </div>
            <DialogDescription className="sr-only">
              Bewerk de taakgegevens zoals titel, beschrijving, prioriteit, status en data.
            </DialogDescription>
          </DialogHeader>
          {formContent}
        </DialogContent>
      </Dialog>
      {unsavedWarningDialog}
    </>
  );
};

export default EditTaskDialog;
