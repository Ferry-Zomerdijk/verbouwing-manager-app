import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, FileText, Trash2, Upload as UploadIcon, X, Filter, Crown, LayoutGrid, List, Search, Pencil } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

interface ProjectDocumentsProps {
  projectId: string;
  isAdminOrOwner?: boolean;
  readOnly?: boolean;
  publicDocuments?: any[];
}

type DocumentType = "Contract" | "Offerte" | "Vergunning" | "Handleiding" | "Garantie" | "Plattegrond" | "Overig";

interface FileUpload {
  file: File;
  bestandsnaam: string;
  type: DocumentType;
}

const ProjectDocuments = ({ projectId, isAdminOrOwner = false, readOnly = false, publicDocuments }: ProjectDocumentsProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Use public data in readOnly mode, otherwise fetch from database
  const displayDocuments = readOnly && publicDocuments ? publicDocuments : null;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [newDocumentName, setNewDocumentName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<FileUpload[]>([]);
  const [defaultType, setDefaultType] = useState<DocumentType>("Contract");
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);
const [typeFilter, setTypeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const { currentTier, hasReachedLimit, limits } = useSubscription();

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
    enabled: !readOnly,
  });

  // Fetch invoices from costs table (only for admin/owner, not in readOnly mode)
  const { data: invoices } = useQuery({
    queryKey: ["cost-invoices", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costs")
        .select("id, factuur_url, leverancier, beschrijving, datum, categorie")
        .eq("project_id", projectId)
        .not("factuur_url", "is", null)
        .order("datum", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isAdminOrOwner && !readOnly,
  });

  // Combine documents and invoices into a unified list (or use public data)
  const allDocuments = readOnly && displayDocuments 
    ? displayDocuments.map(doc => ({ ...doc, source: 'document' as const }))
    : [
        ...(documents || []).map(doc => ({
          ...doc,
          source: 'document' as const,
        })),
        ...(invoices || []).map(inv => ({
          id: inv.id,
          bestandsnaam: inv.leverancier 
            ? `Factuur - ${inv.leverancier}` 
            : inv.beschrijving 
              ? `Factuur - ${inv.beschrijving.slice(0, 30)}` 
              : 'Factuur',
          bestand_url: inv.factuur_url!,
          type: 'Factuur' as const,
          upload_datum: inv.datum,
          source: 'cost' as const,
          categorie: inv.categorie,
        })),
      ].sort((a, b) => new Date(b.upload_datum).getTime() - new Date(a.upload_datum).getTime());

  // Calculate document count (excluding invoices from costs)
  const documentCount = documents?.length || 0;
  const isLimitReached = hasReachedLimit("maxDocuments", documentCount);

  // Get unique document types for filter
  const availableTypes = [...new Set(allDocuments.map(doc => doc.type))];

  // Filter documents by type and search query
  const filteredDocuments = allDocuments.filter(doc => {
    const matchesType = typeFilter === "all" || doc.type === typeFilter;
    const matchesSearch = searchQuery === "" || 
      doc.bestandsnaam.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleFilesSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles: FileUpload[] = Array.from(files).map(file => ({
      file,
      bestandsnaam: file.name,
      type: defaultType,
    }));
    
    setFilesToUpload(prev => [...prev, ...newFiles]);
  }, [defaultType]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelect(e.target.files);
    e.target.value = ""; // Reset input so same files can be selected again
  };

  const updateFileInList = (index: number, updates: Partial<FileUpload>) => {
    setFilesToUpload(prev => prev.map((f, i) => 
      i === index ? { ...f, ...updates } : f
    ));
  };

  const removeFileFromList = (index: number) => {
    setFilesToUpload(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: filesToUpload.length });
    
    let successCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const { file, bestandsnaam, type } = filesToUpload[i];
      setUploadProgress({ current: i + 1, total: filesToUpload.length });

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          errors.push(`${bestandsnaam}: Niet ingelogd`);
          continue;
        }
        
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${projectId}/${Date.now()}_${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("invoices")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { error: dbError } = await supabase.from("documents").insert([{
          project_id: projectId,
          bestandsnaam,
          type,
          bestand_url: fileName,
        }]);

        if (dbError) throw dbError;
        successCount++;
      } catch (error: any) {
        errors.push(`${bestandsnaam}: ${error.message}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} document${successCount > 1 ? "en" : ""} geüpload`);
      refetch();
    }
    
    if (errors.length > 0) {
      toast.error(`${errors.length} upload${errors.length > 1 ? "s" : ""} mislukt`);
    }

    setUploadDialogOpen(false);
    setFilesToUpload([]);
    setUploadProgress({ current: 0, total: 0 });
    setUploading(false);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  }, [handleFilesSelect]);

  const handleDownload = async (doc: any) => {
    try {
      const { data, error } = await supabase.storage
        .from("invoices")
        .download(doc.bestand_url);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = doc.bestandsnaam;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

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

  const handleRename = async () => {
    if (!selectedDocument || !newDocumentName.trim()) return;
    setRenaming(true);
    try {
      const { error } = await supabase
        .from("documents")
        .update({ bestandsnaam: newDocumentName.trim() })
        .eq("id", selectedDocument.id);
      
      if (error) throw error;
      
      toast.success("Document hernoemd");
      setRenameDialogOpen(false);
      setSelectedDocument(null);
      setNewDocumentName("");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setRenaming(false);
    }
  };

  const openRenameDialog = (doc: any) => {
    setSelectedDocument(doc);
    setNewDocumentName(doc.bestandsnaam);
    setRenameDialogOpen(true);
  };

  const typeColors: Record<string, string> = {
    Contract: "bg-blue-500",
    Offerte: "bg-purple-500",
    Vergunning: "bg-orange-500",
    Handleiding: "bg-green-500",
    Garantie: "bg-teal-500",
    Plattegrond: "bg-indigo-500",
    Factuur: "bg-emerald-500",
    Overig: "bg-gray-500",
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const totalSize = filesToUpload.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-2xl font-bold truncate">Documenten</h2>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Zoeken..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8 w-[120px] sm:w-[180px] h-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2 hover:bg-transparent"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-1 border rounded-lg p-0.5">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {availableTypes.length > 1 && (
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[100px] sm:w-[140px]">
                <Filter className="w-4 h-4 shrink-0" />
                <span className="truncate ml-1 sm:ml-2"><SelectValue placeholder="Type" /></span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {!readOnly && (
            <div className="flex items-center gap-2">
              {limits.maxDocuments !== -1 && (
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {documentCount}/{limits.maxDocuments}
                </span>
              )}
              <Button 
                onClick={() => {
                  if (isLimitReached) {
                    toast.error("Documentlimiet bereikt. Upgrade je abonnement.");
                    return;
                  }
                  setUploadDialogOpen(true);
                }} 
                className="gradient-primary shrink-0" 
                size="sm"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Uploaden</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Upgrade prompt for limit reached */}
      {!readOnly && isLimitReached && (
        <UpgradePrompt currentTier={currentTier} limitType="maxDocuments" compact />
      )}

      {filteredDocuments.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={`${doc.source}-${doc.id}`} className="shadow-card hover:shadow-hover transition-smooth">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{doc.bestandsnaam}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${typeColors[doc.type] || typeColors.Overig} text-white text-xs`}>
                          {doc.type}
                        </Badge>
                        {doc.source === 'cost' && (
                          <Badge variant="outline" className="text-xs">
                            Via Kosten
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(doc.upload_datum), "dd MMM yyyy", { locale: nl })}
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
                    {!readOnly && doc.source === 'document' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRenameDialog(doc)}
                        >
                          <Pencil className="w-4 h-4" />
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
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden sm:table-cell">Datum</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={`${doc.source}-${doc.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-muted shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{doc.bestandsnaam}</p>
                          <div className="flex items-center gap-2 sm:hidden mt-1">
                            <Badge className={`${typeColors[doc.type] || typeColors.Overig} text-white text-xs`}>
                              {doc.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(doc.upload_datum), "dd MMM yyyy", { locale: nl })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <Badge className={`${typeColors[doc.type] || typeColors.Overig} text-white text-xs`}>
                          {doc.type}
                        </Badge>
                        {doc.source === 'cost' && (
                          <Badge variant="outline" className="text-xs">
                            Via Kosten
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                      {format(new Date(doc.upload_datum), "dd MMM yyyy", { locale: nl })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {!readOnly && doc.source === 'document' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openRenameDialog(doc)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">
              {typeFilter !== "all" ? "Geen documenten gevonden met dit type" : "Nog geen documenten geüpload"}
            </p>
            {typeFilter !== "all" && (
              <Button variant="link" onClick={() => setTypeFilter("all")} className="mt-2">
                Toon alle documenten
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => {
        setUploadDialogOpen(open);
        if (!open) {
          setFilesToUpload([]);
          setUploadProgress({ current: 0, total: 0 });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Documenten Uploaden</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleBulkUpload} className="space-y-4">
            {/* Default type selector */}
            <div>
              <Label>Standaard type voor nieuwe bestanden</Label>
              <Select
                value={defaultType}
                onValueChange={(value) => setDefaultType(value as DocumentType)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Offerte">Offerte</SelectItem>
                  <SelectItem value="Vergunning">Vergunning</SelectItem>
                  <SelectItem value="Handleiding">Handleiding</SelectItem>
                  <SelectItem value="Garantie">Garantie</SelectItem>
                  <SelectItem value="Plattegrond">Plattegrond</SelectItem>
                  <SelectItem value="Overig">Overig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("multi-file")?.click()}
            >
              <UploadIcon className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Sleep bestanden hierheen of <span className="text-primary font-medium">klik om te selecteren</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Word, Excel, afbeeldingen
              </p>
              <Input
                id="multi-file"
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={handleFileInputChange}
                className="hidden"
                multiple
              />
            </div>

            {/* File list */}
            {filesToUpload.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{filesToUpload.length} bestand{filesToUpload.length > 1 ? "en" : ""} geselecteerd</span>
                  <span className="text-muted-foreground">{formatFileSize(totalSize)}</span>
                </div>
                
                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="p-2 space-y-2">
                    {filesToUpload.map((fileUpload, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                          value={fileUpload.bestandsnaam}
                          onChange={(e) => updateFileInList(index, { bestandsnaam: e.target.value })}
                          className="h-8 text-sm flex-1"
                        />
                        <Select
                          value={fileUpload.type}
                          onValueChange={(value) => updateFileInList(index, { type: value as DocumentType })}
                        >
                          <SelectTrigger className="h-8 w-[120px] text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Contract">Contract</SelectItem>
                            <SelectItem value="Offerte">Offerte</SelectItem>
                            <SelectItem value="Vergunning">Vergunning</SelectItem>
                            <SelectItem value="Handleiding">Handleiding</SelectItem>
                            <SelectItem value="Garantie">Garantie</SelectItem>
                            <SelectItem value="Plattegrond">Plattegrond</SelectItem>
                            <SelectItem value="Overig">Overig</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => removeFileFromList(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Upload progress */}
            {uploading && uploadProgress.total > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploaden...</span>
                  <span>{uploadProgress.current} van {uploadProgress.total}</span>
                </div>
                <Progress value={(uploadProgress.current / uploadProgress.total) * 100} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={uploading || filesToUpload.length === 0} 
                className="gradient-primary"
              >
                {uploading ? "Uploaden..." : `${filesToUpload.length} bestand${filesToUpload.length !== 1 ? "en" : ""} uploaden`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {selectedDocument && (
        <>
          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Document Verwijderen"
            description="Dit kan niet ongedaan worden gemaakt."
            itemName={selectedDocument.bestandsnaam}
            onConfirm={handleDelete}
            loading={deleting}
          />
          
          <Dialog open={renameDialogOpen} onOpenChange={(open) => {
            setRenameDialogOpen(open);
            if (!open) {
              setNewDocumentName("");
            }
          }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Document Hernoemen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="new-name">Nieuwe naam</Label>
                  <Input
                    id="new-name"
                    value={newDocumentName}
                    onChange={(e) => setNewDocumentName(e.target.value)}
                    placeholder="Voer een nieuwe naam in"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newDocumentName.trim()) {
                        handleRename();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button 
                  onClick={handleRename} 
                  disabled={renaming || !newDocumentName.trim()}
                  className="gradient-primary"
                >
                  {renaming ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default ProjectDocuments;
