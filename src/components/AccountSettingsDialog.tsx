import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { KeyboardAwareDrawerContent } from "@/components/ui/keyboard-aware-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Lock, Mail, CreditCard, Crown, RotateCcw, KeyRound, Trash2, Eye, EyeOff, Check, Bell, Info, RefreshCw, Download, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscription } from "@/hooks/useSubscription";
import { Badge } from "@/components/ui/badge";
import { NotificationSettings } from "@/components/NotificationSettings";
import { getFullVersion, getFormattedBuildDate, getPlatformInfo, getLatestChangelog } from "@/lib/version";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAppUpdate } from "@/hooks/useAppUpdate";

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

  // PIN state
  const [hasPin, setHasPin] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinPassword, setPinPassword] = useState("");
  const [showPinPassword, setShowPinPassword] = useState(false);

  const isMobile = useIsMobile();
  const { currentTier, subscription, openPortal, isOpeningPortal } = useSubscription();
  const { updateAvailable, isChecking, checkForUpdate, applyUpdate, getLastCheckedText } = useAppUpdate();
  const platformInfo = getPlatformInfo();

  const tierNames: Record<string, string> = {
    free: "Gratis",
    basis: "Basis",
    pro: "Pro",
  };

  useEffect(() => {
    if (open) {
      loadProfile();
      checkPinStatus();
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

  const checkPinStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('pin-setup', {
        body: { action: 'check' }
      });
      
      if (!error && data) {
        setHasPin(data.hasPin);
      }
    } catch (error) {
      console.error("Error checking PIN status:", error);
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

  const handleSetupPin = async () => {
    if (newPin.length !== 6) {
      toast.error("Pincode moet 6 cijfers zijn");
      return;
    }

    if (newPin !== confirmPin) {
      toast.error("Pincodes komen niet overeen");
      return;
    }

    if (!pinPassword) {
      toast.error("Vul je huidige wachtwoord in");
      return;
    }

    setPinLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pin-setup', {
        body: { 
          action: 'set',
          pin: newPin,
          password: pinPassword
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(isChangingPin ? "Pincode gewijzigd!" : "Pincode ingesteld! Je kunt nu inloggen met je pincode.");
      setHasPin(true);
      setShowPinSetup(false);
      setIsChangingPin(false);
      resetPinForm();
    } catch (error: any) {
      toast.error(error.message || "Kon pincode niet instellen");
    } finally {
      setPinLoading(false);
    }
  };

  const handleRemovePin = async () => {
    setPinLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pin-setup', {
        body: { action: 'remove' }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Pincode verwijderd");
      setHasPin(false);
    } catch (error: any) {
      toast.error(error.message || "Kon pincode niet verwijderen");
    } finally {
      setPinLoading(false);
    }
  };

  const resetPinForm = () => {
    setNewPin("");
    setConfirmPin("");
    setPinPassword("");
    setShowPinPassword(false);
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

      {/* PIN Section */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <KeyRound className="w-4 h-4" />
          Snelle Login met Pincode
        </h3>

        {hasPin && !showPinSetup ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm">Pincode is ingesteld</span>
              </div>
              <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
                Actief
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Je kunt nu inloggen met je 6-cijferige pincode in plaats van je wachtwoord.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsChangingPin(true);
                  setShowPinSetup(true);
                }}
                disabled={pinLoading}
                className="flex-1"
              >
                <KeyRound className="w-4 h-4 mr-2" />
                Wijzigen
              </Button>
              <Button
                variant="outline"
                onClick={handleRemovePin}
                disabled={pinLoading}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {pinLoading ? "Bezig..." : "Verwijderen"}
              </Button>
            </div>
          </div>
        ) : showPinSetup ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {isChangingPin 
                ? "Voer je nieuwe 6-cijferige pincode in." 
                : "Stel een 6-cijferige pincode in om sneller in te loggen."}
            </p>

            <div className="space-y-3">
              <Label>Nieuwe Pincode</Label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={newPin} 
                  onChange={setNewPin}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Bevestig Pincode</Label>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={confirmPin} 
                  onChange={setConfirmPin}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pinPassword">Huidig Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="pinPassword"
                  type={showPinPassword ? "text" : "password"}
                  value={pinPassword}
                  onChange={(e) => setPinPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPinPassword(!showPinPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPinPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Je wachtwoord is nodig om de pincode te beveiligen
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPinSetup(false);
                  setIsChangingPin(false);
                  resetPinForm();
                }}
                className="flex-1"
              >
                Annuleren
              </Button>
              <Button
                onClick={handleSetupPin}
                disabled={pinLoading || newPin.length !== 6 || confirmPin.length !== 6 || !pinPassword}
                className="flex-1"
              >
                {pinLoading ? "Bezig..." : isChangingPin ? "Pincode Wijzigen" : "Pincode Instellen"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Stel een pincode in om sneller in te loggen met 6 cijfers in plaats van je wachtwoord.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowPinSetup(true)}
              className="w-full"
            >
              <KeyRound className="w-4 h-4 mr-2" />
              Pincode Instellen
            </Button>
          </div>
        )}
      </div>

      {/* Notification Settings Section */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notificaties
        </h3>
        <NotificationSettings />
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

      {/* About App Section */}
      <div className="border-t pt-6 space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Info className="w-4 h-4" />
          Over deze app
        </h3>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Versie</div>
            <div className="font-medium font-mono">{getFullVersion()}</div>
            
            <div className="text-muted-foreground">Build</div>
            <div className="font-medium">{getFormattedBuildDate()}</div>
            
            <div className="text-muted-foreground">Platform</div>
            <div className="font-medium">{platformInfo.displayName}</div>
          </div>

          {/* Wat is nieuw sectie */}
          {getLatestChangelog() && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-primary/5 hover:bg-primary/10 rounded-lg transition-colors group">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Wat is nieuw in v{getLatestChangelog()!.version}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <ul className="text-sm space-y-1">
                    {getLatestChangelog()!.changes.map((change, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground pt-1">
                    {getLatestChangelog()!.date}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {updateAvailable ? (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Download className="w-4 h-4" />
                <span className="font-medium text-sm">Update beschikbaar!</span>
              </div>
              <Button 
                onClick={applyUpdate} 
                className="w-full"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Update installeren
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={async () => {
                  const hasUpdate = await checkForUpdate();
                  if (!hasUpdate) {
                    toast.success("Je hebt de nieuwste versie!");
                  }
                }}
                disabled={isChecking}
                className="w-full"
                size="sm"
              >
                {isChecking ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Controleren...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Controleer op updates
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                {getLastCheckedText()}
              </p>
            </div>
          )}
        </div>
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
        <KeyboardAwareDrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Mijn Account
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            {content}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Sluiten
            </Button>
          </div>
        </KeyboardAwareDrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
