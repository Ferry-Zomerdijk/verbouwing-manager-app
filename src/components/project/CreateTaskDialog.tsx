import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { resizeImage, generateUniqueFilename } from "@/lib/imageUtils";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { useQuery } from "@tanstack/react-query";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess: () => void;
  availableDelenVanHuis?: string[];
}

const CreateTaskDialog = ({ open, onOpenChange, projectId, onSuccess, availableDelenVanHuis = [] }: CreateTaskDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [customDeelVanHuis, setCustomDeelVanHuis] = useState("");
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
  });

  const isMobile = useIsMobile();
  const { currentTier, hasReachedLimit, limits } = useSubscription();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeadlineInvalid) {
      toast.error("Deadline kan niet voor begindatum liggen");
      return;
    }
    setLoading(true);

    const finalDeelVanHuis = formData.deel_van_huis === "__custom__" 
      ? customDeelVanHuis 
      : formData.deel_van_huis;

    try {
      // First create the task
      const { data: newTask, error } = await supabase.from("tasks").insert([{
        project_id: projectId,
        titel: formData.titel,
        beschrijving: formData.beschrijving || null,
        begindatum: formData.begindatum || null,
        deadline: formData.deadline || null,
        status: formData.status as any,
        prioriteit: formData.prioriteit as any,
        verantwoordelijke: formData.verantwoordelijke || null,
        deel_van_huis: finalDeelVanHuis || null,
      }]).select().single();

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
        }
        setUploadingImages(false);
      }

      // Cleanup previews
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));

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
      });
      setCustomDeelVanHuis("");
      setPendingImages([]);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
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
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="text-left">
              <DrawerTitle>Takenlimiet bereikt</DrawerTitle>
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
              setFormData(prev => ({
                ...prev,
                begindatum: newBegindatum,
                deadline: prev.deadline || newBegindatum
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
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
          />
          {formData.begindatum && formData.deadline && formData.deadline < formData.begindatum && (
            <p className="text-sm text-destructive mt-1">Deadline kan niet voor begindatum liggen</p>
          )}
        </div>
      </div>

      <div>
        <Label htmlFor="deel_van_huis">Deel van huis</Label>
        <Select
          value={formData.deel_van_huis}
          onValueChange={(value) => setFormData({ ...formData, deel_van_huis: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecteer of voer nieuw in" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Geen</SelectItem>
            {availableDelenVanHuis.map((deel) => (
              <SelectItem key={deel} value={deel}>{deel}</SelectItem>
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
        <Input
          id="verantwoordelijke"
          value={formData.verantwoordelijke}
          onChange={(e) => setFormData({ ...formData, verantwoordelijke: e.target.value })}
          placeholder="Naam"
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
            Annuleren
          </Button>
          <Button type="submit" disabled={loading || uploadingImages} className="gradient-primary">
            {loading || uploadingImages ? "Bezig..." : "Taak Aanmaken"}
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
            <DrawerTitle>Nieuwe Taak</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {formContent}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Annuleren
            </Button>
            <Button onClick={(e) => { e.preventDefault(); document.querySelector('form')?.requestSubmit(); }} disabled={loading || uploadingImages} className="flex-1 gradient-primary">
              {loading || uploadingImages ? "Bezig..." : "Taak Aanmaken"}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nieuwe Taak</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskDialog;
