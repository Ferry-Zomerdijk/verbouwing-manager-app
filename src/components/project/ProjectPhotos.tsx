import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, X, Upload as UploadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { toast } from "sonner";

interface ProjectPhotosProps {
  projectId: string;
}

const ProjectPhotos = ({ projectId }: ProjectPhotosProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [formData, setFormData] = useState({
    fase: "Voor" as any,
    notitie: "",
    file: null as File | null,
    preview: "",
  });

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ 
          ...formData, 
          file,
          preview: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    try {
      const fileExt = formData.file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${projectId}/photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("photos").insert([{
        project_id: projectId,
        fase: formData.fase,
        afbeelding_url: filePath,
        notitie: formData.notitie || null,
      }]);

      if (dbError) throw dbError;

      toast.success("Foto geüpload");
      refetch();
      setUploadDialogOpen(false);
      setFormData({ fase: "Voor", notitie: "", file: null, preview: "" });
    } catch (error: any) {
      toast.error("Fout bij uploaden: " + error.message);
    } finally {
      setUploading(false);
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Foto's</h2>
        <Button onClick={() => setUploadDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Foto Uploaden
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Alle
        </Button>
        <Button
          variant={filter === "Voor" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("Voor")}
        >
          Voor
        </Button>
        <Button
          variant={filter === "Tijdens" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("Tijdens")}
        >
          Tijdens
        </Button>
        <Button
          variant={filter === "Na" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("Na")}
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Foto Uploaden</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">Foto *</Label>
              <div className="mt-2">
                {formData.preview ? (
                  <div className="relative">
                    <img
                      src={formData.preview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, file: null, preview: "" })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-48"
                    onClick={() => document.getElementById("file")?.click()}
                  >
                    <div className="text-center">
                      <UploadIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Klik om foto te selecteren</p>
                    </div>
                  </Button>
                )}
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="fase">Fase *</Label>
              <Select
                value={formData.fase}
                onValueChange={(value) => setFormData({ ...formData, fase: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Voor">Voor</SelectItem>
                  <SelectItem value="Tijdens">Tijdens</SelectItem>
                  <SelectItem value="Na">Na</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notitie">Notitie</Label>
              <Textarea
                id="notitie"
                value={formData.notitie}
                onChange={(e) => setFormData({ ...formData, notitie: e.target.value })}
                placeholder="Beschrijving van de foto..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={uploading || !formData.file} className="gradient-primary">
                {uploading ? "Uploaden..." : "Uploaden"}
              </Button>
            </div>
          </form>
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
