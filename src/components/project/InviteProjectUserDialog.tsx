import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

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
      const { data, error } = await supabase.functions.invoke('generate-project-access-token', {
        body: { projectId, userEmail: email }
      });

      if (error) throw error;

      setGeneratedUrl(data.accessUrl);
      setExpiresAt(data.expiresAt);
      toast.success("Toegangslink gegenereerd!");
    } catch (error: any) {
      console.error('Error generating link:', error);
      toast.error("Kon geen toegangslink genereren");
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Projectgebruiker Uitnodigen</DialogTitle>
          <DialogDescription>
            Genereer een toegangslink voor een projectgebruiker. De link is 7 dagen geldig.
          </DialogDescription>
        </DialogHeader>

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

              <Button 
                onClick={handleGenerateLink} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Genereren..." : "Genereer Toegangslink"}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Toegangslink</Label>
                <div className="p-3 bg-muted rounded-md break-all text-sm">
                  {generatedUrl}
                </div>
              </div>

              {expiresAt && (
                <p className="text-sm text-muted-foreground">
                  Geldig tot: {formatExpiryDate(expiresAt)}
                </p>
              )}

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
                      Kopieer Link
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

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-900">
                  💡 Deel deze link met <strong>{email}</strong>. 
                  Ze kunnen direct inloggen en toegang krijgen tot de takenlijst.
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
