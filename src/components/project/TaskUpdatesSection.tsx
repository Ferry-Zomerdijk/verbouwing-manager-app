import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus, MessageSquare, ImagePlus, X, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";

interface TaskUpdate {
  id: string;
  task_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  image_urls: string[] | null;
}

interface TaskUpdatesSectionProps {
  taskId: string;
  onUpdateAdded?: () => void;
}

export const TaskUpdatesSection = ({ taskId, onUpdateAdded }: TaskUpdatesSectionProps) => {
  const [newUpdate, setNewUpdate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
  });

  const { data: updates, isLoading } = useQuery({
    queryKey: ["task-updates", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_updates")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TaskUpdate[];
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error("Maximaal 5 foto's per update");
      return;
    }

    const validFiles = files.filter(file => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is geen afbeelding`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is te groot (max 5MB)`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      setPreviewUrls(prev => [...prev, url]);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    for (const file of selectedImages) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${taskId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task-update-images")
        .upload(fileName, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("task-update-images")
        .getPublicUrl(fileName);

      uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const addUpdateMutation = useMutation({
    mutationFn: async ({ content, imageUrls }: { content: string; imageUrls: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase.from("task_updates").insert({
        task_id: taskId,
        content,
        created_by: user.id,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewUpdate("");
      setSelectedImages([]);
      setPreviewUrls([]);
      setIsAdding(false);
      toast.success("Update toegevoegd");
      queryClient.invalidateQueries({ queryKey: ["task-updates", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onUpdateAdded?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Fout bij toevoegen update");
    },
  });

  const deleteUpdateMutation = useMutation({
    mutationFn: async (updateId: string) => {
      const { error } = await supabase.from("task_updates").delete().eq("id", updateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Update verwijderd");
      queryClient.invalidateQueries({ queryKey: ["task-updates", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Fout bij verwijderen update");
    },
  });

  const handleAddUpdate = async () => {
    if (!newUpdate.trim() && selectedImages.length === 0) return;
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await uploadImages(user.id);
      }

      await addUpdateMutation.mutateAsync({ content: newUpdate.trim(), imageUrls });
    } catch (error: any) {
      toast.error(error.message || "Fout bij uploaden");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setNewUpdate("");
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedImages([]);
    setPreviewUrls([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium">Updates</h4>
      </div>

      {/* Add new update */}
      {isAdding ? (
        <div className="space-y-3">
          <Textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Schrijf een update..."
            rows={2}
            autoFocus
          />

          {/* Image previews */}
          {previewUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              className="hidden"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={selectedImages.length >= 5 || uploading}
            >
              <ImagePlus className="h-4 w-4 mr-1" />
              Foto's
            </Button>
            <div className="flex-1" />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={uploading}
            >
              Annuleren
            </Button>
            <Button
              size="sm"
              onClick={handleAddUpdate}
              disabled={(!newUpdate.trim() && selectedImages.length === 0) || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Uploaden...
                </>
              ) : (
                "Toevoegen"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Update toevoegen
        </Button>
      )}

      {/* List of updates */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : updates && updates.length > 0 ? (
          updates.map((update) => (
            <div
              key={update.id}
              className="bg-muted/50 rounded-md p-3 text-sm space-y-2 group relative"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(update.created_at), "d MMM yyyy HH:mm", { locale: nl })}
                </span>
                {currentUser?.id === update.created_by && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteUpdateMutation.mutate(update.id)}
                    disabled={deleteUpdateMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
              {update.content && (
                <p className="whitespace-pre-wrap">{update.content}</p>
              )}
              {/* Display images */}
              {update.image_urls && update.image_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {update.image_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={url}
                        alt={`Afbeelding ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nog geen updates
          </p>
        )}
      </div>
    </div>
  );
};

export default TaskUpdatesSection;
