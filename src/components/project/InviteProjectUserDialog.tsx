import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, Mail } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { UI } from "@/lib/uiTexts";

interface InviteProjectUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const InviteProjectUserDialog = ({ open, onOpenChange, projectId }: InviteProjectUserDialogProps) => {
  const [email, setEmail] = useState("");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const handleGenerateLink = async () => {
    if (!email) {
      toast.error("Vul een email adres in");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Vul een geldig email adres in");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-project-invitation', {
        body: { projectId, userEmail: email }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedUrl(data.inviteUrl);
      setExpiresAt(data.expiresAt);
      setIsNewUser(data.isNewUser);
      setEmailSent(data.emailSent || false);
      setEmailError(data.emailError || null);
      if (data.emailSent) {
        toast.success("Uitnodiging verstuurd per email!");
      } else {
        toast.success("Uitnodigingslink gegenereerd! (email kon niet worden verstuurd)");
      }
    } catch (error: any) {
      console.error('Error generating link:', error);
      toast.error(error.message || "Kon geen uitnodigingslink genereren");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedUrl) return;

    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      toast.success("Link gekopieerd naar klembord!");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Kon link niet kopiëren");
    }
  };

  const handleClose = () => {
    setEmail("");
    setGeneratedUrl(null);
    setExpiresAt(null);
    setCopied(false);
    setIsNewUser(false);
    setEmailSent(false);
    setEmailError(null);
    onOpenChange(false);
  };

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const content = (
    <div className="space-y-4 py-4">
      {!generatedUrl ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email Adres</Label>
            <Input
              id="email"
              type="email"
              placeholder="naam@voorbeeld.nl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateLink()}
            />
          </div>

          {!isMobile && (
            <Button 
              onClick={handleGenerateLink} 
              disabled={loading}
              className="w-full"
            >
              {loading ? "Genereren..." : "Genereer Uitnodigingslink"}
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Uitnodigingslink</Label>
            <div className="p-3 bg-muted rounded-md break-all text-sm font-mono">
              {generatedUrl}
            </div>
          </div>

          {expiresAt && (
            <p className="text-sm text-muted-foreground">
              Geldig tot: {formatExpiryDate(expiresAt)}
            </p>
          )}

          {!isMobile && (
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyLink}
                className="flex-1"
                variant={copied ? "outline" : "default"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Gekopieerd!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Kopieer link
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleClose}
                variant="outline"
              >
                Sluiten
              </Button>
            </div>
          )}

          <div className={`p-3 border rounded-md ${emailSent ? 'bg-green-500/10 border-green-500/20' : 'bg-primary/10 border-primary/20'}`}>
            <div className="flex items-start gap-2">
              <Mail className={`w-5 h-5 mt-0.5 flex-shrink-0 ${emailSent ? 'text-green-600' : 'text-primary'}`} />
              <div className="text-sm">
                <p className="font-medium text-foreground">
                  {emailSent 
                    ? `Uitnodiging verstuurd naar ${email}`
                    : `Deel deze link met ${email}`}
                </p>
                <p className="text-muted-foreground mt-1">
                  {emailSent
                    ? isNewUser
                      ? "De gebruiker ontvangt een email met een link om een pincode aan te maken en toegang te krijgen."
                      : "De gebruiker ontvangt een email met een link voor directe toegang tot het project."
                    : isNewUser 
                      ? "Via deze link kan de gebruiker een pincode aanmaken en direct toegang krijgen tot het project."
                      : "De gebruiker heeft al een account en krijgt via deze link direct toegang tot het project."}
                </p>
                {emailError && (
                  <p className="text-destructive mt-1 text-xs">
                    ⚠️ {emailError} — kopieer de link handmatig.
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Projectgebruiker uitnodigen</DrawerTitle>
            <DrawerDescription>
              Genereer een uitnodigingslink. De ontvanger kan zelf een pincode instellen.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {content}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t flex gap-3">
            {!generatedUrl ? (
              <>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Annuleren
                </Button>
                <Button onClick={handleGenerateLink} disabled={loading} className="flex-1">
                  {loading ? "Genereren..." : "Genereer link"}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={handleCopyLink}
                  className="flex-1"
                  variant={copied ? "outline" : "default"}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Gekopieerd!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Kopieer link
                    </>
                  )}
                </Button>
                <Button onClick={handleClose} variant="outline" className="flex-1">
                  Sluiten
                </Button>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Projectgebruiker uitnodigen</DialogTitle>
          <DialogDescription>
            Genereer een uitnodigingslink. De ontvanger kan zelf een pincode instellen en krijgt direct toegang tot het project.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
