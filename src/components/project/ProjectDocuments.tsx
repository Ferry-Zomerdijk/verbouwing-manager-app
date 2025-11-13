import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileText, Trash2, Upload as UploadIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

interface ProjectDocumentsProps {
  projectId: string;
}

const ProjectDocuments = ({ projectId }: ProjectDocumentsProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    bestandsnaam: "",
    type: "Contract" as any,
    file: null as File | null,
  });

  const { data: documents, refetch } = useQuery({
    queryKey: ["documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .order("upload_datum", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ 
        ...formData, 
        file,
        bestandsnaam: file.name 
      });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) return;

    setUploading(true);
    try {
      const fileExt = formData.file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("invoices")
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert([{
        project_id: projectId,
        bestandsnaam: formData.bestandsnaam,
        type: formData.type,
        bestand_url: filePath,
      }]);

      if (dbError) throw dbError;

      toast.success("Document geüpload");
      refetch();
      setUploadDialogOpen(false);
      setFormData({ bestandsnaam: "", type: "Contract", file: null });
    } catch (error: any) {
      toast.error("Fout bij uploaden: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (document: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("invoices")
        .download(document.bestand_url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = document.bestandsnaam;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Document gedownload");
    } catch (error: any) {
      toast.error("Fout bij downloaden: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;
    setDeleting(true);
    try {
      await supabase.storage.from("invoices").remove([selectedDocument.bestand_url]);
      
      const { error } = await supabase.from("documents").delete().eq("id", selectedDocument.id);
      if (error) throw error;
      
      toast.success("Document verwijderd");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
    }
  };

  const typeColors: Record<string, string> = {
    Contract: "bg-blue-500",
    Offerte: "bg-purple-500",
    Vergunning: "bg-orange-500",
    Tekening: "bg-green-500",
    Anders: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Documenten</h2>
        <Button onClick={() => setUploadDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Document Uploaden
        </Button>
      </div>

      {documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="shadow-card hover:shadow-hover transition-smooth">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{doc.bestandsnaam}</CardTitle>
                    <Badge className={`${typeColors[doc.type]} text-white text-xs mt-2`}>
                      {doc.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Geüpload op {format(new Date(doc.upload_datum), "dd MMM yyyy", { locale: nl })}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedDocument(doc);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nog geen documenten geüpload</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Document Uploaden</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="file">Bestand *</Label>
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById("file")?.click()}
                >
                  <UploadIcon className="w-4 h-4 mr-2" />
                  {formData.file ? formData.file.name : "Selecteer bestand"}
                </Button>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="bestandsnaam">Bestandsnaam *</Label>
              <Input
                id="bestandsnaam"
                value={formData.bestandsnaam}
                onChange={(e) => setFormData({ ...formData, bestandsnaam: e.target.value })}
                placeholder="Document naam"
                required
              />
            </div>

            <div>
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Offerte">Offerte</SelectItem>
                  <SelectItem value="Vergunning">Vergunning</SelectItem>
                  <SelectItem value="Tekening">Tekening</SelectItem>
                  <SelectItem value="Anders">Anders</SelectItem>
                </SelectContent>
              </Select>
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

      {selectedDocument && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Document Verwijderen"
          description="Dit kan niet ongedaan worden gemaakt."
          itemName={selectedDocument.bestandsnaam}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
};

export default ProjectDocuments;
