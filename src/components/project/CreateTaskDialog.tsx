import { useState, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToQueue } from "@/lib/offlineQueue";
import { resizeImage, generateUniqueFilename } from "@/lib/imageUtils";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useQuery } from "@tanstack/react-query";
import { AutocompleteInput } from "./AutocompleteInput";
import { DatePicker } from "@/components/ui/date-picker";
import MobileTaskWizard from "./MobileTaskWizard";
import { UI } from "@/lib/uiTexts";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

const CreateTaskDialog = ({ open, onOpenChange, projectId, onSuccess, availableDelenVanHuis = [] }: CreateTaskDialogProps) => {
  
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    begindatum: "",
    deadline: "",
    status: "Te doen",
    prioriteit: "Middel",
    verantwoordelijke: "",
    deel_van_huis: "",
    type_id: "",
  });

  const isMobile = useIsMobile();
  const { currentTier, hasReachedLimit, limits } = useSubscription();
  const queryClient = useQueryClient();

  // Get current task count for this project
  const { data: taskCount = 0 } = useQuery({
    queryKey: ["taskCount", projectId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);
      
      if (error) return 0;
      return count || 0;
    },
    enabled: open,
  });

  // Get available verantwoordelijken from existing tasks
  const { data: existingVerantwoordelijken = [] } = useQuery({
    queryKey: ["available-verantwoordelijken", projectId],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("verantwoordelijke")
        .eq("project_id", projectId);
      const unique = [...new Set(data?.map(t => t.verantwoordelijke).filter(Boolean) as string[])];
      return unique.sort();
    },
    enabled: open,
  });

  // Get voornamen from Bouwvakkers contacts
  const { data: contactVoornamen = [] } = useQuery({
    queryKey: ["contractor-voornamen", projectId],
    queryFn: async () => {
      // First get the Bouwvakkers category
      const { data: category } = await supabase
        .from("contact_categories")
        .select("id")
        .eq("project_id", projectId)
        .eq("naam", "Bouwvakkers")
        .maybeSingle();

      if (!category?.id) return [];

      // Then get voornamen from active contractors in that category
      const { data } = await supabase
        .from("contractors")
        .select("voornaam")
        .eq("project_id", projectId)
        .eq("category_id", category.id)
        .eq("is_actief", true);

      return data?.map(c => c.voornaam).filter(Boolean) as string[] || [];
    },
    enabled: open,
  });

  // Fetch task types
  const { data: taskTypes = [] } = useQuery({
    queryKey: ["task-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_types")
        .select("id, naam, kleur")
        .order("volgorde", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const availableVerantwoordelijken = useMemo(() => {
    const combined = new Set([...existingVerantwoordelijken, ...contactVoornamen]);
    return Array.from(combined).sort();
  }, [existingVerantwoordelijken, contactVoornamen]);

  const isLimitReached = hasReachedLimit("maxTasks", taskCount);

  const isDeadlineInvalid = formData.begindatum && formData.deadline && formData.deadline < formData.begindatum;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages = Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

    setPendingImages((prev) => [...prev, ...newImages]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (taskId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const { file } of pendingImages) {
      try {
        const resizedBlob = await resizeImage(file);
        const filename = generateUniqueFilename(file.name);
        const path = `${projectId}/${taskId}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("task-images")
          .upload(path, resizedBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from("task-images")
          .getPublicUrl(path);

        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }

    return uploadedUrls;
  };

  type TaskPriority = "Hoog" | "Laag" | "Middel";
  type TaskStatus = "Te doen" | "Bezig" | "Gereed";

  const getTaskTypeColorClass = (kleur: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500", orange: "bg-orange-500", purple: "bg-purple-500",
      green: "bg-green-500", yellow: "bg-yellow-500", gray: "bg-gray-500",
      red: "bg-red-500", pink: "bg-pink-500", cyan: "bg-cyan-500",
    };
    return colorMap[kleur] || "bg-gray-500";
  };

  const createTaskMutation = useMutation({
    mutationFn: async (taskData: {
      project_id: string;
      titel: string;
      beschrijving: string | null;
      begindatum: string | null;
      deadline: string | null;
      status: TaskStatus;
      prioriteit: TaskPriority;
      verantwoordelijke: string | null;
      deel_van_huis: string | null;
      type_id: string | null;
    }) => {
      // Offline: genereer lokaal ID en queue
      if (!navigator.onLine) {
        const tempId = crypto.randomUUID();
        const newTask = { id: tempId, ...taskData, created_at: new Date().toISOString() };
        addToQueue({ type: 'insert', table: 'tasks', data: newTask });
        return newTask;
      }

      const { data: newTask, error } = await supabase.from("tasks").insert([taskData]).select().single();
      if (error) throw error;

      // Upload pending images if any
      if (pendingImages.length > 0 && newTask) {
        setUploadingImages(true);
        const imageUrls = await uploadImages(newTask.id);
        
        if (imageUrls.length > 0) {
          await supabase
            .from("tasks")
            .update({ image_urls: imageUrls })
            .eq("id", newTask.id);
          newTask.image_urls = imageUrls;
        }
        setUploadingImages(false);
      }

      return newTask;
    },
    onMutate: async (taskData) => {
      // Cancel lopende fetches
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      
      // Sla huidige state op voor rollback
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      
      // Optimistic update met temp ID
      const tempTask = {
        id: crypto.randomUUID(),
        ...taskData,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(["tasks", projectId], (old: any[] | undefined) =>
        old ? [...old, tempTask] : [tempTask]
      );
      
      return { previousTasks };
    },
    onError: (error: any, variables, context) => {
      // Rollback bij error
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
      toast.error(error.message || "Er is een fout opgetreden");
    },
    onSuccess: () => {
      // Cleanup previews
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
      
      toast.success(navigator.onLine ? "Taak aangemaakt" : "Taak lokaal aangemaakt (wordt gesync'd)");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      onSuccess();
      onOpenChange(false);
      setFormData({
        titel: "",
        beschrijving: "",
        begindatum: "",
        deadline: "",
        status: "Te doen",
        prioriteit: "Middel",
        verantwoordelijke: "",
        deel_van_huis: "",
        type_id: "",
      });
      
      setPendingImages([]);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlineInvalid) {
      toast.error("Deadline kan niet voor begindatum liggen");
      return;
    }


    createTaskMutation.mutate({
      project_id: projectId,
      titel: formData.titel,
      beschrijving: formData.beschrijving || null,
      begindatum: formData.begindatum || null,
      deadline: formData.deadline || null,
      status: formData.status as TaskStatus,
      prioriteit: formData.prioriteit as TaskPriority,
      verantwoordelijke: formData.verantwoordelijke || null,
      deel_van_huis: formData.deel_van_huis || null,
      type_id: formData.type_id || null,
    });
  };

  // Show upgrade prompt if limit reached
  if (isLimitReached) {
    const upgradeContent = (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Je hebt {taskCount} van {limits.maxTasks} taken gebruikt in dit project.
        </p>
        <UpgradePrompt currentTier={currentTier} limitType="maxTasks" />
      </div>
    );

    if (isMobile) {
      return (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <KeyboardAwareDrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Takenlimiet bereikt</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              {upgradeContent}
            </div>
          </KeyboardAwareDrawerContent>
        </Drawer>
      );
    }

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Takenlimiet bereikt</DialogTitle>
          </DialogHeader>
          {upgradeContent}
        </DialogContent>
      </Dialog>
    );
  }

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="titel">Titel *</Label>
        <Input
          id="titel"
          value={formData.titel}
          onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
          placeholder="Taak titel"
          required
        />
      </div>

      <div>
        <Label htmlFor="beschrijving">Beschrijving</Label>
        <Textarea
          id="beschrijving"
          value={formData.beschrijving}
          onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
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
            onValueChange={(value) => setFormData({ ...formData, prioriteit: value })}
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
            onValueChange={(value) => setFormData({ ...formData, status: value })}
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

        <div>
          <Label htmlFor="type">Type taak</Label>
          <Select
            value={formData.type_id}
            onValueChange={(value) => setFormData({ ...formData, type_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer type..." />
            </SelectTrigger>
            <SelectContent>
              {taskTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${getTaskTypeColorClass(type.kleur)}`} />
                    {type.naam}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Begindatum</Label>
          <DatePicker
            value={formData.begindatum}
            onChange={(newBegindatum) => {
              setFormData(prev => {
                // Auto-update deadline if empty OR if deadline is before new begindatum
                const shouldUpdateDeadline = !prev.deadline || prev.deadline < newBegindatum;
                return {
                  ...prev,
                  begindatum: newBegindatum,
                  deadline: shouldUpdateDeadline ? newBegindatum : prev.deadline
                };
              });
            }}
            placeholder="Selecteer datum"
          />
        </div>

        <div className="space-y-2">
          <Label>Deadline</Label>
          <DatePicker
            value={formData.deadline}
            onChange={(value) => setFormData({ ...formData, deadline: value })}
            minDate={formData.begindatum || undefined}
            placeholder="Selecteer datum"
          />
          {formData.begindatum && formData.deadline && formData.deadline < formData.begindatum && (
            <p className="text-sm text-destructive">Deadline kan niet voor begindatum liggen</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="deel_van_huis">Deel van huis</Label>
        <AutocompleteInput
          placeholder="Typ of selecteer..."
          value={formData.deel_van_huis}
          onChange={(value) => setFormData({ ...formData, deel_van_huis: value })}
          suggestions={availableDelenVanHuis}
          allowCreate={true}
          createLabel="Voeg toe:"
          showAllOnFocus={true}
        />
      </div>

      <div>
        <Label htmlFor="verantwoordelijke">Verantwoordelijke</Label>
        <AutocompleteInput
          placeholder="Typ een naam..."
          value={formData.verantwoordelijke}
          onChange={(value) => setFormData({ ...formData, verantwoordelijke: value })}
          suggestions={availableVerantwoordelijken}
          allowCreate={true}
          createLabel="Voeg toe:"
          showAllOnFocus={true}
        />
      </div>

      <Separator className="my-4" />

      {/* Images Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Foto's</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImages}
          >
            {uploadingImages ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-2" />
            )}
            Foto toevoegen
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {pendingImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {pendingImages.map((img, index) => (
              <div
                key={img.preview}
                className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={img.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removePendingImage(index)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Geen foto's geselecteerd</p>
        )}
      </div>

      {!isMobile && (
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {UI.actions.cancel}
          </Button>
          <Button type="submit" disabled={createTaskMutation.isPending || uploadingImages} className="gradient-primary">
            {createTaskMutation.isPending || uploadingImages ? UI.actions.processing : UI.tasks.buttons.create}
          </Button>
        </div>
      )}
    </form>
  );

  // Use the new wizard for mobile
  if (isMobile) {
    return (
      <MobileTaskWizard
        open={open}
        onOpenChange={onOpenChange}
        projectId={projectId}
        onSuccess={onSuccess}
        availableDelenVanHuis={availableDelenVanHuis}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{UI.tasks.dialogs.createTitle}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
