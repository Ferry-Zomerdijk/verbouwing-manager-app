import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Mail, CreditCard, Crown, RotateCcw } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestartOnboarding?: () => void;
}

const AccountSettingsDialog = ({ open, onOpenChange, onRestartOnboarding }: AccountSettingsDialogProps) => {
  const navigate = useNavigate();
  const [naam, setNaam] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const isMobile = useIsMobile();
  const { currentTier, subscription, openPortal, isOpeningPortal } = useSubscription();

  const tierNames: Record<string, string> = {
    free: "Gratis",
    basis: "Basis",
    pro: "Pro",
  };

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    setProfileLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("naam")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) {
          setNaam(profile.naam || "");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Niet ingelogd");

      const { error } = await supabase
        .from("profiles")
        .update({ naam })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profiel bijgewerkt");
    } catch (error: any) {
      toast.error("Fout bij opslaan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens zijn");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      
      toast.success("Wachtwoord succesvol gewijzigd");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Fout bij wijzigen wachtwoord: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const content = profileLoading ? (
    <div className="py-8 text-center text-muted-foreground">Laden...</div>
  ) : (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground">Profiel</h3>
        
        <div className="space-y-2">
          <Label htmlFor="naam">Naam</Label>
          <Input
            id="naam"
            value={naam}
            onChange={(e) => setNaam(e.target.value)}
            placeholder="Je naam"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </Label>
          <Input
            id="email"
            value={email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email kan niet worden gewijzigd</p>
        </div>

        <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
          Profiel Opslaan
        </Button>
      </div>

      {/* Subscription Section */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Abonnement
        </h3>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            {currentTier !== "free" && <Crown className="w-4 h-4 text-primary" />}
            <span className="font-medium">{tierNames[currentTier]}</span>
          </div>
          <Badge variant={currentTier === "free" ? "secondary" : "default"}>
            {currentTier === "free" ? "Gratis" : "Actief"}
          </Badge>
        </div>

        <div className="flex gap-2">
          {currentTier === "free" ? (
            <Button 
              onClick={() => {
                onOpenChange(false);
                navigate("/pricing");
              }}
              className="w-full gradient-primary"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgraden
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => openPortal()}
              disabled={isOpeningPortal}
              className="w-full"
            >
              Beheer abonnement
            </Button>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Wachtwoord Wijzigen
        </h3>

        <div className="space-y-2">
          <Label htmlFor="newPassword">Nieuw wachtwoord</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button 
          onClick={handleChangePassword} 
          disabled={loading || !newPassword || !confirmPassword}
          variant="outline"
          className="w-full"
        >
          Wachtwoord Wijzigen
        </Button>
      </div>

      {/* Onboarding Section */}
      {onRestartOnboarding && (
        <div className="border-t pt-6 space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Hulp
          </h3>
          <Button 
            onClick={() => {
              onOpenChange(false);
              onRestartOnboarding();
            }}
            variant="outline"
            className="w-full"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Bekijk introductie opnieuw
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Mijn Account
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {content}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Sluiten
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Mijn Account
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default AccountSettingsDialog;
