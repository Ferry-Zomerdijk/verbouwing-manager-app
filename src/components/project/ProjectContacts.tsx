import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, Phone, Mail, MapPin, MoreVertical, Edit, Trash2, 
  FolderPlus, ChevronDown, ChevronRight, Check, Building2, Search, X, Globe
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import DeleteConfirmationDialog from "../DeleteConfirmationDialog";
import CreateCategoryDialog from "./CreateCategoryDialog";
import EditCategoryDialog from "./EditCategoryDialog";
import CreateContactDialog from "./CreateContactDialog";
import EditContactDialog from "./EditContactDialog";
import { toast } from "sonner";

interface ProjectContactsProps {
  projectId: string;
  readOnly?: boolean;
  publicCategories?: any[];
  publicContacts?: any[];
}

const ProjectContacts = ({ 
  projectId, 
  readOnly = false, 
  publicCategories,
  publicContacts 
}: ProjectContactsProps) => {
  const queryClient = useQueryClient();
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [createContactOpen, setCreateContactOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [deleteCategoryOpen, setDeleteCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["contact-categories", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_categories")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde", { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !readOnly,
  });

  // Fetch contacts (from contractors table)
  const { data: contacts, refetch: refetchContacts } = useQuery({
    queryKey: ["contacts", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contractors")
        .select("*, contact_categories(naam, icoon)")
        .eq("project_id", projectId)
        .order("is_actief", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !readOnly,
  });

  const displayCategories = readOnly ? publicCategories : categories;
  const displayContacts = readOnly ? publicContacts : contacts;

  // Filter contacts based on search query
  const filteredContacts = displayContacts?.filter((contact: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const naam = contact.naam?.toLowerCase() || "";
    const voornaam = contact.voornaam?.toLowerCase() || "";
    const achternaam = contact.achternaam?.toLowerCase() || "";
    const bedrijf = contact.bedrijf?.toLowerCase() || "";
    const rol = contact.rol?.toLowerCase() || "";
    return naam.includes(query) || voornaam.includes(query) || achternaam.includes(query) || bedrijf.includes(query) || rol.includes(query);
  });

  const refetchAll = () => {
    refetchCategories();
    refetchContacts();
    queryClient.invalidateQueries({ queryKey: ["contractors", projectId] });
  };

  // Group filtered contacts by category
  const groupedContacts = filteredContacts?.reduce((acc: Record<string, any[]>, contact: any) => {
    const categoryId = contact.category_id || "uncategorized";
    if (!acc[categoryId]) acc[categoryId] = [];
    acc[categoryId].push(contact);
    return acc;
  }, {}) || {};

  const uncategorizedContacts = groupedContacts["uncategorized"] || [];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleDeleteContact = async () => {
    if (!selectedContact) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("contractors")
        .delete()
        .eq("id", selectedContact.id);
      if (error) throw error;
      toast.success("Contact verwijderd");
      refetchAll();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
      setDeleteContactOpen(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setDeleting(true);
    try {
      // First move all contacts in this category to uncategorized
      await supabase
        .from("contractors")
        .update({ category_id: null })
        .eq("category_id", selectedCategory.id);

      const { error } = await supabase
        .from("contact_categories")
        .delete()
        .eq("id", selectedCategory.id);
      if (error) throw error;
      toast.success("Rubriek verwijderd");
      refetchAll();
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setDeleting(false);
      setDeleteCategoryOpen(false);
    }
  };

  const ContactCard = ({ contact }: { contact: any }) => (
    <Card className="shadow-card hover:shadow-hover transition-smooth">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">{contact.naam}</CardTitle>
              {contact.is_actief && (
                <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30 shrink-0">
                  <Check className="w-3 h-3 mr-1" />
                  Actief
                </Badge>
              )}
            </div>
            {contact.bedrijf && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {contact.bedrijf}
              </p>
            )}
          </div>
          {!readOnly && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedContact(contact);
                    setEditContactOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Bewerken
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setSelectedContact(contact);
                    setDeleteContactOpen(true);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Verwijderen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {contact.label && (
            <Badge variant="secondary" className="text-xs">
              {contact.label}
            </Badge>
          )}
          {contact.rol && (
            <Badge variant="outline" className="text-xs">
              {contact.rol}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        {contact.email && (
          <a 
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm hover:text-primary transition-smooth"
          >
            <Mail className="w-4 h-4 shrink-0" />
            <span className="truncate">{contact.email}</span>
          </a>
        )}
        {contact.telefoon && (
          <a 
            href={`tel:${contact.telefoon}`}
            className="flex items-center gap-2 text-sm hover:text-primary transition-smooth"
          >
            <Phone className="w-4 h-4 shrink-0" />
            {contact.telefoon}
          </a>
        )}
        {contact.website && (
          <a 
            href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm hover:text-primary transition-smooth"
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span className="truncate">{contact.website.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
        {contact.adres && (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{contact.adres}</span>
          </p>
        )}
        {contact.notities && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 pt-2 border-t">
            {contact.notities}
          </p>
        )}
      </CardContent>
    </Card>
  );

  const CategorySection = ({ category, contacts }: { category: any; contacts: any[] }) => {
    const isExpanded = expandedCategories.has(category.id);
    
    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category.id)}>
        <div className="border rounded-lg bg-card overflow-hidden">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <h3 className="font-semibold">{category.naam}</h3>
                <Badge variant="secondary" className="text-xs">
                  {contacts.length}
                </Badge>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(category);
                      setCreateContactOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Contact</span>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(category);
                          setEditCategoryOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Rubriek bewerken
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCategory(category);
                          setDeleteCategoryOpen(true);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Rubriek verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <ContactCard key={contact.id} contact={contact} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground col-span-full py-4 text-center">
                  Nog geen contacten in deze rubriek
                </p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-2xl font-bold truncate">Contacten</h2>
          {!readOnly && (
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                onClick={() => setCreateCategoryOpen(true)} 
                size="sm"
              >
                <FolderPlus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nieuwe Rubriek</span>
              </Button>
              <Button 
                onClick={() => {
                  setSelectedCategory(null);
                  setCreateContactOpen(true);
                }} 
                className="gradient-primary" 
                size="sm"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Nieuw Contact</span>
              </Button>
            </div>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Zoek op naam, bedrijf of rol..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search results indicator */}
        {searchQuery && (
          <p className="text-sm text-muted-foreground">
            {filteredContacts?.length || 0} contact{(filteredContacts?.length || 0) !== 1 ? "en" : ""} gevonden
          </p>
        )}
      </div>

      {/* Categories with contacts */}
      <div className="space-y-3">
        {displayCategories?.map((category) => (
          <CategorySection 
            key={category.id} 
            category={category} 
            contacts={groupedContacts[category.id] || []} 
          />
        ))}
      </div>

      {/* Uncategorized contacts */}
      {uncategorizedContacts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
            Overige Contacten
            <Badge variant="secondary" className="text-xs">
              {uncategorizedContacts.length}
            </Badge>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uncategorizedContacts.map((contact: any) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!displayCategories || displayCategories.length === 0) && uncategorizedContacts.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground mb-4">Nog geen contacten toegevoegd</p>
            {!readOnly && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <Button variant="outline" onClick={() => setCreateCategoryOpen(true)}>
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Rubriek maken
                </Button>
                <Button onClick={() => setCreateContactOpen(true)} className="gradient-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Contact toevoegen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <CreateCategoryDialog
        open={createCategoryOpen}
        onOpenChange={setCreateCategoryOpen}
        projectId={projectId}
        onSuccess={refetchAll}
      />

      {selectedCategory && (
        <EditCategoryDialog
          open={editCategoryOpen}
          onOpenChange={setEditCategoryOpen}
          category={selectedCategory}
          onSuccess={refetchAll}
        />
      )}

      <CreateContactDialog
        open={createContactOpen}
        onOpenChange={setCreateContactOpen}
        projectId={projectId}
        categoryId={selectedCategory?.id}
        categories={displayCategories || []}
        onSuccess={refetchAll}
      />

      {selectedContact && (
        <EditContactDialog
          open={editContactOpen}
          onOpenChange={setEditContactOpen}
          contact={selectedContact}
          categories={displayCategories || []}
          onSuccess={refetchAll}
        />
      )}

      <DeleteConfirmationDialog
        open={deleteContactOpen}
        onOpenChange={setDeleteContactOpen}
        title="Contact Verwijderen"
        description="Dit kan niet ongedaan worden gemaakt."
        itemName={selectedContact?.naam}
        onConfirm={handleDeleteContact}
        loading={deleting}
      />

      <DeleteConfirmationDialog
        open={deleteCategoryOpen}
        onOpenChange={setDeleteCategoryOpen}
        title="Rubriek Verwijderen"
        description="Contacten in deze rubriek worden verplaatst naar 'Overige Contacten'."
        itemName={selectedCategory?.naam}
        onConfirm={handleDeleteCategory}
        loading={deleting}
      />
    </div>
  );
};

export default ProjectContacts;
