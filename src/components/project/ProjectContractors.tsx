import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Phone, Mail, MoreVertical, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import CreateContractorDialog from "./CreateContractorDialog";
import EditContractorDialog from "./EditContractorDialog";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import { toast } from "sonner";

interface ProjectContractorsProps {
  projectId: string;
}

const ProjectContractors = ({ projectId }: ProjectContractorsProps) => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: contractors, refetch } = useQuery({
    queryKey: ["contractors", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const handleDelete = async () => {
    if (!selectedContractor) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("contractors").delete().eq("id", selectedContractor.id);
      if (error) throw error;
      toast.success("Aannemer verwijderd");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Aannemers & Leveranciers</h2>
        <Button onClick={() => setCreateDialogOpen(true)} className="gradient-primary">
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe Aannemer
        </Button>
      </div>

      {contractors && contractors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractors.map((contractor) => (
            <Card key={contractor.id} className="shadow-card hover:shadow-hover transition-smooth">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contractor.naam}</CardTitle>
                    {contractor.bedrijf && (
                      <p className="text-sm text-muted-foreground mt-1">{contractor.bedrijf}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedContractor(contractor);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedContractor(contractor);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {contractor.rol && (
                  <Badge variant="outline" className="mt-2 w-fit">{contractor.rol}</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {contractor.email && (
                  <a 
                    href={`mailto:${contractor.email}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-smooth"
                  >
                    <Mail className="w-4 h-4" />
                    {contractor.email}
                  </a>
                )}
                {contractor.telefoon && (
                  <a 
                    href={`tel:${contractor.telefoon}`}
                    className="flex items-center gap-2 text-sm hover:text-primary transition-smooth"
                  >
                    <Phone className="w-4 h-4" />
                    {contractor.telefoon}
                  </a>
                )}
                {contractor.notities && (
                  <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                    {contractor.notities}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nog geen aannemers toegevoegd</p>
          </CardContent>
        </Card>
      )}

      <CreateContractorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        projectId={projectId}
        onSuccess={() => {
          refetch();
          toast.success("Aannemer toegevoegd!");
        }}
      />

      {selectedContractor && (
        <>
          <EditContractorDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            contractor={selectedContractor}
            onSuccess={() => {
              refetch();
              toast.success("Aannemer bijgewerkt!");
            }}
          />

          <DeleteConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Aannemer Verwijderen"
            description="Dit kan niet ongedaan worden gemaakt."
            itemName={selectedContractor.naam}
            onConfirm={handleDelete}
            loading={deleting}
          />
        </>
      )}
    </div>
  );
};

export default ProjectContractors;
