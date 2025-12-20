import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

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
      // We need to check if token exists via edge function since RLS blocks direct access
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
    
    if (password !== confirmPassword) {
      toast.error("Wachtwoorden komen niet overeen");
      return;
    }

    if (password.length < 6) {
      toast.error("Wachtwoord moet minimaal 6 tekens zijn");
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
        // Set the session
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        
        // Navigate to project tasks
        navigate(`/project-tasks/${data.projectId}`);
      } else {
        // Redirect to login
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Je naam (optioneel)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Voer je naam in"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Wachtwoord</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimaal 6 tekens"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Bevestig wachtwoord</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Herhaal je wachtwoord"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
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
