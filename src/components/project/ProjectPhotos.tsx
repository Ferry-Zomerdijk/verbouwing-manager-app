import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X, Upload as UploadIcon, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { toast } from "sonner";

interface ProjectPhotosProps {
  projectId: string;
}

type PhotoPhase = "Voor" | "Tijdens" | "Na";

interface PhotoUpload {
  file: File;
  preview: string;
  fase: PhotoPhase;
  notitie: string;
}

const ProjectPhotos = ({ projectId }: ProjectPhotosProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  
  // Multi-upload state
  const [photosToUpload, setPhotosToUpload] = useState<PhotoUpload[]>([]);
  const [defaultFase, setDefaultFase] = useState<PhotoPhase>("Voor");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const { data: photos, refetch } = useQuery({
    queryKey: ["photos", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const filteredPhotos = photos?.filter(photo => 
    filter === "all" ? true : photo.fase === filter
  );

  const handleFilesSelect = (files: FileList | null) => {
    if (!files) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length === 0) {
      toast.error("Selecteer alleen afbeeldingsbestanden");
      return;
    }

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotosToUpload(prev => [...prev, {
          file,
          preview: reader.result as string,
          fase: defaultFase,
          notitie: ""
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelect(e.target.files);
    e.target.value = "";
  };

  const updatePhotoInList = (index: number, updates: Partial<PhotoUpload>) => {
    setPhotosToUpload(prev => prev.map((photo, i) => 
      i === index ? { ...photo, ...updates } : photo
    ));
  };

  const removePhotoFromList = (index: number) => {
    setPhotosToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async () => {
    if (photosToUpload.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: photosToUpload.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < photosToUpload.length; i++) {
      const photo = photosToUpload[i];
      try {
        const fileExt = photo.file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${projectId}/photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(filePath, photo.file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("photos").insert([{
          project_id: projectId,
          fase: photo.fase,
          afbeelding_url: filePath,
          notitie: photo.notitie || null,
        }]);

        if (dbError) throw dbError;
        successCount++;
      } catch (error: any) {
        console.error("Upload error:", error);
        errorCount++;
      }
      setUploadProgress({ current: i + 1, total: photosToUpload.length });
    }

    if (successCount > 0) {
      toast.success(`${successCount} foto('s) geüpload`);
      refetch();
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} foto('s) konden niet worden geüpload`);
    }

    setUploading(false);
    setUploadProgress({ current: 0, total: 0 });
    setPhotosToUpload([]);
    setUploadDialogOpen(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  };

  const getPhotoUrl = (path: string) => {
    const { data } = supabase.storage.from("invoices").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleDelete = async () => {
    if (!selectedPhoto) return;
    setDeleting(true);
    try {
      await supabase.storage.from("invoices").remove([selectedPhoto.afbeelding_url]);
      
      const { error } = await supabase.from("photos").delete().eq("id", selectedPhoto.id);
      if (error) throw error;
      
      toast.success("Foto verwijderd");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
    }
  };

  const faseColors: Record<string, string> = {
    Voor: "bg-blue-500",
    Tijdens: "bg-yellow-500",
    Na: "bg-green-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-2xl font-bold">Foto's</h2>
        <Button onClick={() => setUploadDialogOpen(true)} className="gradient-primary shrink-0" size="sm">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Uploaden</span>
        </Button>
      </div>

      <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="text-xs sm:text-sm shrink-0"
        >
          Alle
        </Button>
        <Button
          variant={filter === "Voor" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("Voor")}
          className="text-xs sm:text-sm shrink-0"
        >
          Voor
        </Button>
        <Button
          variant={filter === "Tijdens" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("Tijdens")}
          className="text-xs sm:text-sm shrink-0"
        >
          Tijdens
        </Button>
        <Button
          variant={filter === "Na" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("Na")}
          className="text-xs sm:text-sm shrink-0"
        >
          Na
        </Button>
      </div>

      {filteredPhotos && filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <Card
              key={photo.id}
              className="shadow-card hover:shadow-hover transition-smooth cursor-pointer overflow-hidden group relative"
              onClick={() => {
                setSelectedPhoto(photo);
                setLightboxOpen(true);
              }}
            >
              <div className="aspect-square relative">
                <img
                  src={getPhotoUrl(photo.afbeelding_url)}
                  alt={photo.notitie || "Project foto"}
                  className="w-full h-full object-cover"
                />
                <Badge className={`${faseColors[photo.fase]} text-white absolute top-2 left-2`}>
                  {photo.fase}
                </Badge>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto(photo);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {photo.notitie && (
                <CardContent className="p-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{photo.notitie}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nog geen foto's geüpload</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) {
          setPhotosToUpload([]);
          setUploadProgress({ current: 0, total: 0 });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto's Uploaden</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Standaard fase voor nieuwe foto's</Label>
              <Select
                value={defaultFase}
                onValueChange={(value) => setDefaultFase(value as PhotoPhase)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Voor">Voor</SelectItem>
                  <SelectItem value="Tijdens">Tijdens</SelectItem>
                  <SelectItem value="Na">Na</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <UploadIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Sleep foto's hierheen of klik om te selecteren
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, GIF - Meerdere bestanden mogelijk
              </p>
              <Input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>

            {photosToUpload.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>{photosToUpload.length} foto('s) geselecteerd</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPhotosToUpload([])}
                  >
                    Alles verwijderen
                  </Button>
                </div>

                <ScrollArea className="h-64 border rounded-lg p-3">
                  <div className="space-y-3">
                    {photosToUpload.map((photo, index) => (
                      <div key={index} className="flex gap-3 items-start p-2 bg-muted/50 rounded-lg">
                        <img
                          src={photo.preview}
                          alt={photo.file.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 space-y-2 min-w-0">
                          <p className="text-sm font-medium truncate">{photo.file.name}</p>
                          <div className="flex gap-2">
                            <Select
                              value={photo.fase}
                              onValueChange={(value) => updatePhotoInList(index, { fase: value as PhotoPhase })}
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Voor">Voor</SelectItem>
                                <SelectItem value="Tijdens">Tijdens</SelectItem>
                                <SelectItem value="Na">Na</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              placeholder="Notitie..."
                              value={photo.notitie}
                              onChange={(e) => updatePhotoInList(index, { notitie: e.target.value })}
                              className="h-8 flex-1"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removePhotoFromList(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
                <p className="text-sm text-center text-muted-foreground">
                  {uploadProgress.current} van {uploadProgress.total} geüpload
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setUploadDialogOpen(false)}
                disabled={uploading}
              >
                Annuleren
              </Button>
              <Button 
                onClick={handleBulkUpload}
                disabled={uploading || photosToUpload.length === 0} 
                className="gradient-primary"
              >
                {uploading ? "Uploaden..." : `${photosToUpload.length} Foto('s) Uploaden`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={getPhotoUrl(selectedPhoto.afbeelding_url)}
                alt={selectedPhoto.notitie || "Project foto"}
                className="w-full rounded-lg"
              />
              {selectedPhoto.notitie && (
                <p className="text-muted-foreground">{selectedPhoto.notitie}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedPhoto && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Foto Verwijderen"
          description="Dit kan niet ongedaan worden gemaakt."
          itemName="deze foto"
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default ProjectPhotos;
