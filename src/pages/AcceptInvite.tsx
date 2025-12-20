import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, Check, X } from "lucide-react";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password validation
  const passwordCriteria = useMemo(() => ({
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  }), [password]);

  const isPasswordValid = useMemo(() => 
    Object.values(passwordCriteria).every(Boolean),
    [passwordCriteria]
  );

  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

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
    
    if (!isPasswordValid) {
      toast.error("Wachtwoord voldoet niet aan alle vereisten");
      return;
    }

    if (!passwordsMatch) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }

    setSubmitting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('accept-project-invitation', {
        body: { token, password, name: name || undefined }
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

  const CriteriaItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
      <span className={met ? "text-green-600" : "text-muted-foreground"}>
        {label}
      </span>
    </div>
  );

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
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Kies een sterk wachtwoord"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Password criteria checklist */}
              {password.length > 0 && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-1.5">
                  <CriteriaItem met={passwordCriteria.minLength} label="Minimaal 8 tekens" />
                  <CriteriaItem met={passwordCriteria.hasLowercase} label="Minimaal 1 kleine letter (a-z)" />
                  <CriteriaItem met={passwordCriteria.hasUppercase} label="Minimaal 1 hoofdletter (A-Z)" />
                  <CriteriaItem met={passwordCriteria.hasNumber} label="Minimaal 1 cijfer (0-9)" />
                  <CriteriaItem met={passwordCriteria.hasSpecial} label="Minimaal 1 speciaal teken (!@#$%...)" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Herhaal je wachtwoord"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-sm text-destructive">Wachtwoorden komen niet overeen</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting || !isPasswordValid || !passwordsMatch}
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
