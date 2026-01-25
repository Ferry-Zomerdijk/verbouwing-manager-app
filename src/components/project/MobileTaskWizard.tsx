import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Drawer, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { addToQueue } from "@/lib/offlineQueue";
import { resizeImage, generateUniqueFilename } from "@/lib/imageUtils";
import { ImagePlus, X, Loader2, ChevronLeft, ChevronRight, Check, Calendar } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { cn } from "@/lib/utils";
import { AutocompleteInput } from "./AutocompleteInput";
import { format, parseISO, addDays } from "date-fns";
import { nl } from "date-fns/locale";

interface MobileTaskWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

type TaskPriority = "Hoog" | "Laag" | "Middel";
type TaskStatus = "Te doen" | "Bezig" | "Gereed";

const STEPS = [
  { id: 1, title: "Basis", description: "Titel & beschrijving" },
  { id: 2, title: "Planning", description: "Datum & verantwoordelijke" },
  { id: 3, title: "Details", description: "Prioriteit & extra info" },
];

const MobileTaskWizard = ({ open, onOpenChange, projectId, onSuccess, availableDelenVanHuis = [] }: MobileTaskWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    titel: "",
    beschrijving: "",
    begindatum: "",
    deadline: "",
    status: "Te doen" as TaskStatus,
    prioriteit: "Middel" as TaskPriority,
    verantwoordelijke: "",
    deel_van_huis: "",
    type_id: "",
  });

  const { currentTier, hasReachedLimit, limits } = useSubscription();
  const queryClient = useQueryClient();

  // Get current task count
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

  // Get available verantwoordelijken
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
      const { data: category } = await supabase
        .from("contact_categories")
        .select("id")
        .eq("project_id", projectId)
        .eq("naam", "Bouwvakkers")
        .maybeSingle();

      if (!category?.id) return [];

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

  const uploadImages = async (taskId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const { file } of pendingImages) {
      try {
        const resizedBlob = await resizeImage(file);
        const filename = generateUniqueFilename(file.name);
        const path = `${projectId}/${taskId}/${filename}`;

        const { error: uploadError } = await supabase.storage
          .from("task-images")
          .upload(path, resizedBlob, { contentType: "image/jpeg", upsert: false });

        if (uploadError) continue;

        const { data: urlData } = supabase.storage.from("task-images").getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
    return uploadedUrls;
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
      if (!navigator.onLine) {
        const tempId = crypto.randomUUID();
        const newTask = { id: tempId, ...taskData, created_at: new Date().toISOString() };
        addToQueue({ type: 'insert', table: 'tasks', data: newTask });
        return newTask;
      }

      const { data: newTask, error } = await supabase.from("tasks").insert([taskData]).select().single();
      if (error) throw error;

      if (pendingImages.length > 0 && newTask) {
        setUploadingImages(true);
        const imageUrls = await uploadImages(newTask.id);
        
        if (imageUrls.length > 0) {
          await supabase.from("tasks").update({ image_urls: imageUrls }).eq("id", newTask.id);
          newTask.image_urls = imageUrls;
        }
        setUploadingImages(false);
      }

      return newTask;
    },
    onMutate: async (taskData) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previousTasks = queryClient.getQueryData(["tasks", projectId]);
      const tempTask = { id: crypto.randomUUID(), ...taskData, created_at: new Date().toISOString() };
      queryClient.setQueryData(["tasks", projectId], (old: any[] | undefined) =>
        old ? [...old, tempTask] : [tempTask]
      );
      return { previousTasks };
    },
    onError: (error: any, variables, context) => {
      queryClient.setQueryData(["tasks", projectId], context?.previousTasks);
      toast.error(error.message || "Er is een fout opgetreden");
    },
    onSuccess: () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
      toast.success(navigator.onLine ? "Taak aangemaakt" : "Taak lokaal aangemaakt (wordt gesync'd)");
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      onSuccess();
      handleClose();
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setCurrentStep(1);
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
    }, 300);
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.titel.trim()) {
      toast.error("Vul een titel in");
      return;
    }
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    if (formData.begindatum && formData.deadline && formData.deadline < formData.begindatum) {
      toast.error("Deadline kan niet voor begindatum liggen");
      return;
    }

    createTaskMutation.mutate({
      project_id: projectId,
      titel: formData.titel,
      beschrijving: formData.beschrijving || null,
      begindatum: formData.begindatum || null,
      deadline: formData.deadline || null,
      status: formData.status,
      prioriteit: formData.prioriteit,
      verantwoordelijke: formData.verantwoordelijke || null,
      deel_van_huis: formData.deel_van_huis || null,
      type_id: formData.type_id || null,
    });
  };

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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const getTaskTypeColorClass = (kleur: string) => {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-500", orange: "bg-orange-500", purple: "bg-purple-500",
      green: "bg-green-500", yellow: "bg-yellow-500", gray: "bg-gray-500",
      red: "bg-red-500", pink: "bg-pink-500", cyan: "bg-cyan-500",
    };
    return colorMap[kleur] || "bg-gray-500";
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return format(parseISO(dateStr), "d MMM yyyy", { locale: nl });
    } catch {
      return dateStr;
    }
  };

  // Upgrade prompt
  if (isLimitReached) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <KeyboardAwareDrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Takenlimiet bereikt</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Je hebt {taskCount} van {limits.maxTasks} taken gebruikt.
            </p>
            <UpgradePrompt currentTier={currentTier} limitType="maxTasks" />
          </div>
        </KeyboardAwareDrawerContent>
      </Drawer>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <KeyboardAwareDrawerContent className="h-[95dvh] max-h-[95dvh] flex flex-col">
        {/* Header with step indicator */}
        <DrawerHeader className="shrink-0 pb-2">
          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0 h-10 w-10">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="flex-1">
              <DrawerTitle className="text-lg">Nieuwe taak</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Stap {currentStep} van 3: {STEPS[currentStep - 1].description}
              </p>
            </div>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-3">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  step.id === currentStep ? "w-8 bg-primary" : "w-2 bg-muted",
                  step.id < currentStep && "bg-primary/50"
                )}
              />
            ))}
          </div>
        </DrawerHeader>

        {/* Scrollable content */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-2">
          {/* Step 1: Basis */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="titel" className="text-base font-medium">
                  Titel <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="titel"
                  value={formData.titel}
                  onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                  placeholder="Wat moet er gebeuren?"
                  className="h-14 text-lg px-4"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="beschrijving" className="text-base font-medium">
                  Beschrijving <span className="text-muted-foreground text-sm">(optioneel)</span>
                </Label>
                <Textarea
                  id="beschrijving"
                  value={formData.beschrijving}
                  onChange={(e) => setFormData({ ...formData, beschrijving: e.target.value })}
                  placeholder="Extra details of notities..."
                  rows={4}
                  className="text-base px-4 py-3 resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Planning */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Date inputs using native date picker */}
              {(() => {
                const todayStr = format(new Date(), "yyyy-MM-dd");
                
                const setStartToday = () => {
                  setFormData(prev => ({
                    ...prev,
                    begindatum: todayStr,
                    deadline: !prev.deadline || prev.deadline < todayStr ? todayStr : prev.deadline
                  }));
                };

                const setDeadlineToday = () => {
                  const minDate = formData.begindatum || todayStr;
                  setFormData(prev => ({
                    ...prev,
                    deadline: todayStr >= minDate ? todayStr : minDate
                  }));
                };

                const setDeadlineNextWeek = () => {
                  const baseDate = formData.begindatum ? parseISO(formData.begindatum) : new Date();
                  const nextWeek = format(addDays(baseDate, 7), "yyyy-MM-dd");
                  setFormData(prev => ({ ...prev, deadline: nextWeek }));
                };

                const clearStartDate = () => {
                  setFormData(prev => ({ ...prev, begindatum: "" }));
                };

                const clearDeadline = () => {
                  setFormData(prev => ({ ...prev, deadline: "" }));
                };

                return (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Wanneer?</Label>
                    
                    {/* Startdatum */}
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Startdatum</span>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={formData.begindatum}
                          onChange={(e) => {
                            const newDate = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              begindatum: newDate,
                              deadline: !prev.deadline || prev.deadline < newDate ? newDate : prev.deadline
                            }));
                          }}
                          className="h-14 text-base pl-11 pr-3"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.begindatum === todayStr ? "default" : "outline"}
                          size="sm"
                          onClick={setStartToday}
                          className={cn(
                            "h-10 px-4 text-sm",
                            formData.begindatum === todayStr && "gradient-primary"
                          )}
                        >
                          Vandaag
                        </Button>
                        {formData.begindatum && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearStartDate}
                            className="h-10 px-3 text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Wissen
                          </Button>
                        )}
                      </div>
                      {formData.begindatum && (
                        <p className="text-xs text-muted-foreground pl-1">
                          {formatDateDisplay(formData.begindatum)}
                        </p>
                      )}
                    </div>

                    {/* Deadline */}
                    <div className="space-y-2">
                      <span className="text-sm text-muted-foreground">Deadline</span>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                        <Input
                          type="date"
                          value={formData.deadline}
                          min={formData.begindatum || undefined}
                          onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                          className="h-14 text-base pl-11 pr-3"
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          type="button"
                          variant={formData.deadline === todayStr ? "default" : "outline"}
                          size="sm"
                          onClick={setDeadlineToday}
                          className={cn(
                            "h-10 px-4 text-sm",
                            formData.deadline === todayStr && "gradient-primary"
                          )}
                        >
                          Vandaag
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={setDeadlineNextWeek}
                          className="h-10 px-4 text-sm"
                        >
                          +1 week
                        </Button>
                        {formData.deadline && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearDeadline}
                            className="h-10 px-3 text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Wissen
                          </Button>
                        )}
                      </div>
                      {formData.deadline && (
                        <p className="text-xs text-muted-foreground pl-1">
                          {formatDateDisplay(formData.deadline)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Verantwoordelijke - Quick select buttons */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Wie is verantwoordelijk?</Label>
                
                {/* Quick select chips */}
                {availableVerantwoordelijken.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {availableVerantwoordelijken.slice(0, 6).map((name) => (
                      <Button
                        key={name}
                        type="button"
                        variant={formData.verantwoordelijke === name ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormData({ ...formData, verantwoordelijke: name })}
                        className={cn(
                          "h-11 px-4 text-base rounded-full",
                          formData.verantwoordelijke === name && "gradient-primary"
                        )}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                )}
                
                {/* Autocomplete input met suggesties */}
                <AutocompleteInput
                  value={formData.verantwoordelijke}
                  onChange={(value) => setFormData({ ...formData, verantwoordelijke: value })}
                  suggestions={availableVerantwoordelijken}
                  placeholder="Typ een naam..."
                  className="h-12 text-base"
                  allowCreate={true}
                  createLabel="Nieuw"
                  showAllOnFocus={true}
                />
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-5">
              {/* Prioriteit - Button group */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Prioriteit</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Laag", "Middel", "Hoog"] as TaskPriority[]).map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant={formData.prioriteit === p ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, prioriteit: p })}
                      className={cn(
                        "h-12 text-base font-medium",
                        formData.prioriteit === p && (
                          p === "Hoog" ? "bg-red-500 hover:bg-red-600 border-red-500" :
                          p === "Middel" ? "bg-orange-500 hover:bg-orange-600 border-orange-500" :
                          "bg-green-500 hover:bg-green-600 border-green-500"
                        )
                      )}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Status - Button group */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Status</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Te doen", "Bezig", "Gereed"] as TaskStatus[]).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={formData.status === s ? "default" : "outline"}
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={cn(
                        "h-12 text-sm font-medium",
                        formData.status === s && "gradient-primary"
                      )}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Type taak - Native select */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Type taak</Label>
                <select
                  value={formData.type_id}
                  onChange={(e) => setFormData({ ...formData, type_id: e.target.value })}
                  className="native-select w-full h-12 rounded-lg border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecteer type...</option>
                  {taskTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.naam}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deel van huis - Native select or custom input */}
              <div className="space-y-2">
                <Label className="text-base font-medium">Deel van huis</Label>
                {availableDelenVanHuis.length > 0 ? (
                  <>
                    <select
                      value={availableDelenVanHuis.includes(formData.deel_van_huis) ? formData.deel_van_huis : "__custom__"}
                      onChange={(e) => {
                        if (e.target.value === "__custom__") {
                          setFormData({ ...formData, deel_van_huis: "" });
                        } else {
                          setFormData({ ...formData, deel_van_huis: e.target.value });
                        }
                      }}
                      className="native-select w-full h-12 rounded-lg border border-input bg-background px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Selecteer locatie...</option>
                      {availableDelenVanHuis.map((deel) => (
                        <option key={deel} value={deel}>{deel}</option>
                      ))}
                      <option value="__custom__">Anders...</option>
                    </select>
                    {(!availableDelenVanHuis.includes(formData.deel_van_huis) && formData.deel_van_huis !== "") || 
                     (formData.deel_van_huis === "" && !availableDelenVanHuis.includes(formData.deel_van_huis)) ? null : null}
                    {!availableDelenVanHuis.includes(formData.deel_van_huis) && (
                      <Input
                        value={formData.deel_van_huis}
                        onChange={(e) => setFormData({ ...formData, deel_van_huis: e.target.value })}
                        placeholder="Typ een nieuwe locatie..."
                        className="h-12 text-base"
                        autoFocus
                      />
                    )}
                  </>
                ) : (
                  <Input
                    value={formData.deel_van_huis}
                    onChange={(e) => setFormData({ ...formData, deel_van_huis: e.target.value })}
                    placeholder="Typ een locatie..."
                    className="h-12 text-base"
                  />
                )}
              </div>

              {/* Foto's */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Foto's</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImages}
                    className="h-10"
                  >
                    {uploadingImages ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4 mr-2" />
                    )}
                    Toevoegen
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
                  <div className="grid grid-cols-3 gap-2">
                    {pendingImages.map((img, index) => (
                      <div
                        key={img.preview}
                        className="relative aspect-square rounded-lg overflow-hidden bg-muted"
                      >
                        <img
                          src={img.preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground"
                          onClick={() => removePendingImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Geen foto's geselecteerd</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <div className="shrink-0 p-4 bg-background border-t safe-area-bottom">
          {currentStep < 3 ? (
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-12"
              >
                Annuleren
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-12 gradient-primary text-base font-medium"
              >
                Volgende
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={createTaskMutation.isPending || uploadingImages}
              className="w-full h-14 gradient-primary text-lg font-semibold"
            >
              {createTaskMutation.isPending || uploadingImages ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Bezig...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" />
                  Taak aanmaken
                </>
              )}
            </Button>
          )}
        </div>
      </KeyboardAwareDrawerContent>
    </Drawer>
  );
};

export default MobileTaskWizard;
