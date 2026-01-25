import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

interface CreatePlatformUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreatePlatformUserDialog = ({
  open,
  onOpenChange,
}: CreatePlatformUserDialogProps) => {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [naam, setNaam] = useState("");
  const [sendResetLink, setSendResetLink] = useState(true);
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Email is verplicht");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error("Voer een geldig emailadres in");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: email.trim(),
          naam: naam.trim() || undefined,
          sendResetLink,
          makeAdmin,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data?.message || "Gebruiker succesvol aangemaakt");
      
      // Reset form
      setEmail("");
      setNaam("");
      setSendResetLink(true);
      setMakeAdmin(false);
      
      // Close dialog and refresh list
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["platform-users"] });
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Kon gebruiker niet aanmaken");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setEmail("");
      setNaam("");
      setSendResetLink(true);
      setMakeAdmin(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Nieuwe gebruiker toevoegen
          </DialogTitle>
          <DialogDescription>
            Maak een nieuwe gebruiker aan op het platform. De gebruiker ontvangt een email om een wachtwoord in te stellen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="gebruiker@voorbeeld.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="naam">Naam</Label>
            <Input
              id="naam"
              type="text"
              placeholder="Jan de Vries"
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sendResetLink"
                checked={sendResetLink}
                onCheckedChange={(checked) => setSendResetLink(checked as boolean)}
                disabled={isLoading}
              />
              <Label 
                htmlFor="sendResetLink" 
                className="text-sm font-normal cursor-pointer"
              >
                Verstuur wachtwoord reset link naar gebruiker
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="makeAdmin"
                checked={makeAdmin}
                onCheckedChange={(checked) => setMakeAdmin(checked as boolean)}
                disabled={isLoading}
              />
              <Label 
                htmlFor="makeAdmin" 
                className="text-sm font-normal cursor-pointer"
              >
                Maak deze gebruiker admin
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Annuleren
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Bezig...
                </>
              ) : (
                "Gebruiker Maken"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
