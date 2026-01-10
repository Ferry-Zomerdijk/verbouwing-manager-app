import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  categoryId?: string;
  categories: { id: string; naam: string }[];
  onSuccess: () => void;
}

const SUGGESTED_LABELS = [
  "Huidige leverancier",
  "Vorige leverancier",
  "Backup contact",
  "Primair contact",
  "Servicemonteur",
  "Verkoop",
];

const CreateContactDialog = ({
  open,
  onOpenChange,
  projectId,
  categoryId,
  categories,
  onSuccess,
}: CreateContactDialogProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    naam: "",
    bedrijf: "",
    rol: "",
    email: "",
    telefoon: "",
    adres: "",
    notities: "",
    label: "",
    category_id: categoryId || "",
    is_actief: true,
  });

  useEffect(() => {
    if (categoryId) {
      setFormData(prev => ({ ...prev, category_id: categoryId }));
    }
  }, [categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.naam.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("contractors").insert({
        project_id: projectId,
        naam: formData.naam.trim(),
        bedrijf: formData.bedrijf.trim() || null,
        rol: formData.rol.trim() || null,
        email: formData.email.trim() || null,
        telefoon: formData.telefoon.trim() || null,
        adres: formData.adres.trim() || null,
        notities: formData.notities.trim() || null,
        label: formData.label.trim() || null,
        category_id: formData.category_id || null,
        is_actief: formData.is_actief,
      });

      if (error) throw error;
      
      toast.success("Contact toegevoegd!");
      setFormData({
        naam: "",
        bedrijf: "",
        rol: "",
        email: "",
        telefoon: "",
        adres: "",
        notities: "",
        label: "",
        category_id: categoryId || "",
        is_actief: true,
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="naam">Naam *</Label>
          <Input
            id="naam"
            value={formData.naam}
            onChange={(e) => setFormData({ ...formData, naam: e.target.value })}
            placeholder="Contactpersoon naam"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bedrijf">Bedrijf</Label>
          <Input
            id="bedrijf"
            value={formData.bedrijf}
            onChange={(e) => setFormData({ ...formData, bedrijf: e.target.value })}
            placeholder="Bedrijfsnaam"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Rubriek</Label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => setFormData({ ...formData, category_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecteer rubriek" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Geen rubriek</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.naam}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rol">Rol/Functie</Label>
          <Input
            id="rol"
            value={formData.rol}
            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            placeholder="Bijv. Monteur, Verkoper"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@voorbeeld.nl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefoon">Telefoon</Label>
          <Input
            id="telefoon"
            type="tel"
            value={formData.telefoon}
            onChange={(e) => setFormData({ ...formData, telefoon: e.target.value })}
            placeholder="06-12345678"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adres">Adres</Label>
        <Textarea
          id="adres"
          value={formData.adres}
          onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
          placeholder="Straat, postcode, plaats"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="label">Label</Label>
        <Input
          id="label"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          placeholder="Bijv. Huidige leverancier"
        />
        <div className="flex flex-wrap gap-1 mt-1">
          {SUGGESTED_LABELS.map((label) => (
            <Button
              key={label}
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setFormData({ ...formData, label })}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notities">Notities</Label>
        <Textarea
          id="notities"
          value={formData.notities}
          onChange={(e) => setFormData({ ...formData, notities: e.target.value })}
          placeholder="Extra informatie..."
          rows={2}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <Switch
            id="is_actief"
            checked={formData.is_actief}
            onCheckedChange={(checked) => setFormData({ ...formData, is_actief: checked })}
          />
          <Label htmlFor="is_actief" className="cursor-pointer">
            Actief contact
          </Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
          Annuleren
        </Button>
        <Button type="submit" disabled={loading || !formData.naam.trim()} className="flex-1 gradient-primary">
          {loading ? "Bezig..." : "Toevoegen"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Nieuw Contact</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-6 max-h-[calc(90vh-80px)]">
            {formContent}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nieuw Contact</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default CreateContactDialog;
