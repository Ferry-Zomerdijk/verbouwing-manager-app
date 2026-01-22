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
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
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

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: {
    id: string;
    voornaam?: string | null;
    achternaam?: string | null;
    bedrijf?: string | null;
    rol?: string | null;
    email?: string | null;
    telefoon?: string | null;
    website?: string | null;
    adres?: string | null;
    notities?: string | null;
    label?: string | null;
    category_id?: string | null;
    is_actief?: boolean | null;
  };
  categories: { id: string; naam: string }[];
  onSuccess: () => void;
}

const NO_CATEGORY = "no-category";

const SUGGESTED_LABELS = [
  "Huidige leverancier",
  "Vorige leverancier",
  "Backup contact",
  "Primair contact",
  "Servicemonteur",
  "Verkoop",
];

const EditContactDialog = ({
  open,
  onOpenChange,
  contact,
  categories,
  onSuccess,
}: EditContactDialogProps) => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    voornaam: "",
    achternaam: "",
    bedrijf: "",
    rol: "",
    email: "",
    telefoon: "",
    website: "",
    adres: "",
    notities: "",
    label: "",
    category_id: "",
    is_actief: true,
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        voornaam: contact.voornaam || "",
        achternaam: contact.achternaam || "",
        bedrijf: contact.bedrijf || "",
        rol: contact.rol || "",
        email: contact.email || "",
        telefoon: contact.telefoon || "",
        website: contact.website || "",
        adres: contact.adres || "",
        notities: contact.notities || "",
        label: contact.label || "",
        category_id: contact.category_id || NO_CATEGORY,
        is_actief: contact.is_actief ?? true,
      });
    }
  }, [contact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.voornaam.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("contractors")
        .update({
          voornaam: formData.voornaam.trim(),
          achternaam: formData.achternaam.trim() || null,
          bedrijf: formData.bedrijf.trim() || null,
          rol: formData.rol.trim() || null,
          email: formData.email.trim() || null,
          telefoon: formData.telefoon.trim() || null,
          website: formData.website.trim() || null,
          adres: formData.adres.trim() || null,
          notities: formData.notities.trim() || null,
          label: formData.label.trim() || null,
          category_id: formData.category_id === NO_CATEGORY ? null : formData.category_id || null,
          is_actief: formData.is_actief,
        })
        .eq("id", contact.id);

      if (error) throw error;
      
      toast.success("Contact bijgewerkt!");
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
          <Label htmlFor="voornaam">Voornaam *</Label>
          <Input
            id="voornaam"
            value={formData.voornaam}
            onChange={(e) => setFormData({ ...formData, voornaam: e.target.value })}
            placeholder="Voornaam"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="achternaam">Achternaam</Label>
          <Input
            id="achternaam"
            value={formData.achternaam}
            onChange={(e) => setFormData({ ...formData, achternaam: e.target.value })}
            placeholder="Achternaam"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bedrijf">Bedrijf</Label>
          <Input
            id="bedrijf"
            value={formData.bedrijf}
            onChange={(e) => setFormData({ ...formData, bedrijf: e.target.value })}
            placeholder="Bedrijfsnaam"
          />
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
            <SelectItem value={NO_CATEGORY}>Geen rubriek</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.naam}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          placeholder="https://www.voorbeeld.nl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="adres">Adres</Label>
        <Textarea
          id="adres"
          value={formData.adres}
          onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
          placeholder="Straat, postcode, plaats"
          rows={2}
          className="text-base"
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
          className="text-base"
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
        <Button type="submit" disabled={loading || !formData.voornaam.trim()} className="flex-1 gradient-primary">
          {loading ? "Bezig..." : "Opslaan"}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <KeyboardAwareDrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Contact Bewerken</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 pb-6 max-h-[calc(90vh-80px)]">
            {formContent}
          </ScrollArea>
        </KeyboardAwareDrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Bewerken</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
};

export default EditContactDialog;
