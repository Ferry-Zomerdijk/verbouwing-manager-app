import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Check, X } from "lucide-react";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // PIN validation
  const isPinValid = pin.length === 6 && /^\d{6}$/.test(pin);
  const pinsMatch = pin === confirmPin && confirmPin.length === 6;

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    if (!token) {
      setError("Geen uitnodigingstoken gevonden");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-invitation-token', {
        body: { token }
      });

      if (error || !data?.valid) {
        setError(data?.error || "Ongeldige of verlopen uitnodiging");
        setInviteValid(false);
      } else {
        setInviteValid(true);
        setInviteEmail(data.email);
      }
    } catch (err: any) {
      console.error('Error validating token:', err);
      setError("Kon uitnodiging niet valideren");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPinValid) {
      toast.error("Pincode moet 6 cijfers zijn");
      return;
    }

    if (!pinsMatch) {
      toast.error("Pincodes komen niet overeen");
      return;
    }

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('accept-project-invitation', {
        body: { token, pin, name: name || undefined }
      });

      if (error) {
        throw new Error(error.message || 'Fout bij accepteren uitnodiging');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success("Account aangemaakt! Je wordt doorgestuurd...");

      if (data.autoSignIn && data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        navigate(`/project-tasks/${data.projectId}`);
      } else {
        navigate('/auth');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      toast.error(err.message || "Kon uitnodiging niet accepteren");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Uitnodiging valideren...</p>
        </div>
      </div>
    );
  }

  if (error || !inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Uitnodiging Ongeldig</CardTitle>
            <CardDescription>{error || "Deze uitnodiging is niet meer geldig"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
              variant="outline"
            >
              Ga naar inlogpagina
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
          <CardTitle>Welkom!</CardTitle>
          <CardDescription>
            Je bent uitgenodigd om deel te nemen aan een project.
            {inviteEmail && (
              <span className="block mt-1 font-medium text-foreground">
                {inviteEmail}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Je naam (optioneel)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Voer je naam in"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div className="space-y-3">
              <Label>Kies een 6-cijferige pincode</Label>
              <p className="text-sm text-muted-foreground">
                Je gebruikt deze pincode om in te loggen
              </p>
              <div className="flex justify-center">
                <InputOTP 
                  maxLength={6} 
                  value={pin} 
                  onChange={setPin}
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
              {pin.length > 0 && pin.length < 6 && (
                <p className="text-sm text-muted-foreground text-center">
                  Nog {6 - pin.length} cijfer{6 - pin.length === 1 ? '' : 's'}
                </p>
              )}
              {isPinValid && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Pincode ingevuld</span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Bevestig je pincode</Label>
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
              {confirmPin.length === 6 && !pinsMatch && (
                <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                  <X className="h-4 w-4" />
                  <span>Pincodes komen niet overeen</span>
                </div>
              )}
              {pinsMatch && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span>Pincodes komen overeen</span>
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || !isPinValid || !pinsMatch}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Account aanmaken...
                </>
              ) : (
                "Account aanmaken & Toegang krijgen"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
