import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, ZoomIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resizeImage, generateUniqueFilename } from "@/lib/imageUtils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface TaskImagesSectionProps {
  taskId: string;
  projectId: string;
  imageUrls: string[];
  onImagesChange: (urls: string[]) => void;
  readOnly?: boolean;
}

export function TaskImagesSection({
  taskId,
  projectId,
  imageUrls,
  onImagesChange,
  readOnly = false,
}: TaskImagesSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is geen afbeelding`);
          continue;
        }

        // Resize image
        const resizedBlob = await resizeImage(file);
        const filename = generateUniqueFilename(file.name);
        const path = `${projectId}/${taskId}/${filename}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("task-images")
          .upload(path, resizedBlob, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast.error(`Fout bij uploaden: ${file.name}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("task-images")
          .getPublicUrl(path);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        onImagesChange([...imageUrls, ...newUrls]);
        toast.success(
          `${newUrls.length} foto${newUrls.length > 1 ? "'s" : ""} toegevoegd`
        );
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Er ging iets mis bij het uploaden");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async (urlToRemove: string) => {
    try {
      // Extract path from URL
      const url = new URL(urlToRemove);
      const pathMatch = url.pathname.match(/\/task-images\/(.+)$/);
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        const { error } = await supabase.storage
          .from("task-images")
          .remove([filePath]);

        if (error) {
          console.error("Error deleting file:", error);
        }
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }

    // Update local state regardless of storage deletion result
    onImagesChange(imageUrls.filter((url) => url !== urlToRemove));
    toast.success("Foto verwijderd");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Foto's</span>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="h-4 w-4 mr-2" />
            )}
            Foto toevoegen
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {imageUrls.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {imageUrls.map((url, index) => (
            <div
              key={url}
              className="relative group aspect-square rounded-lg overflow-hidden bg-muted"
            >
              <img
                src={url}
                alt={`Taak foto ${index + 1}`}
                className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105"
                onClick={() => setLightboxImage(url)}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
              <button
                type="button"
                className="absolute top-1 left-1 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setLightboxImage(url)}
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              {!readOnly && (
                <button
                  type="button"
                  className="absolute top-1 right-1 p-1.5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(url)}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nog geen foto's toegevoegd</p>
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/90 border-none">
          {lightboxImage && (
            <img
              src={lightboxImage}
              alt="Volledige weergave"
              className="w-full h-auto max-h-[85vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
