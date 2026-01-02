import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Home, Eye, EyeOff, ArrowLeft, KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";

type LoginMethod = "pin" | "password";
type Mode = "login" | "register" | "forgot-password";

// Determine where to redirect the user after login
const getRedirectPath = async (userId: string): Promise<string> => {
  // First check if onboarding is completed - if not, always go to dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  // If onboarding not completed, always redirect to dashboard where the modal will show
  if (profile && !profile.onboarding_completed) {
    return "/dashboard";
  }

  // Check if user is admin
  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  // Admins always go to dashboard
  if (adminRole) {
    return "/dashboard";
  }

  // Check how many projects the user has access to via project_users
  const { data: projectUsers } = await supabase
    .from("project_users")
    .select("project_id")
    .eq("user_id", userId);

  // If exactly 1 project, redirect directly to that project
  if (projectUsers && projectUsers.length === 1) {
    return `/project-tasks/${projectUsers[0].project_id}`;
  }

  // Otherwise (0 or multiple projects, or project owner): go to dashboard
  return "/dashboard";
};

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("pin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [naam, setNaam] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const path = await getRedirectPath(session.user.id);
        navigate(path);
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          const path = await getRedirectPath(session.user.id);
          navigate(path);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      toast.error("Voer een 6-cijferige pincode in");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('pin-login', {
        body: { email, pin }
      });

      if (error) {
        throw new Error(error.message || 'Inloggen mislukt');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
        toast.success("Succesvol ingelogd!");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Er is een fout opgetreden";
      
      // Check if the error indicates no PIN is set - suggest password login
      if (errorMessage.includes("pincode ingesteld") || errorMessage.includes("no PIN")) {
        toast.error("Geen pincode ingesteld. Gebruik wachtwoord login.", {
          action: {
            label: "Wachtwoord",
            onClick: () => setLoginMethod("password"),
          },
        });
        setLoginMethod("password");
      } else {
        toast.error(errorMessage);
      }
      setPin(""); // Clear PIN on error
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Succesvol ingelogd!");
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              naam: naam,
            },
          },
        });
        if (error) throw error;
        toast.success("Account aangemaakt! Check je email voor bevestiging.");
      }
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Wachtwoord reset email verzonden! Check je inbox.");
      setMode("login");
    } catch (error: any) {
      toast.error(error.message || "Er is een fout opgetreden");
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login": 
        return loginMethod === "pin" ? "Log in met pincode" : "Log in met wachtwoord";
      case "register": 
        return "Maak een nieuw account aan";
      case "forgot-password": 
        return "Wachtwoord vergeten";
    }
  };

  const resetForm = () => {
    setPin("");
    setPassword("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary flex items-center justify-center">
            <Home className="w-10 h-10 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">De Renovatie App</CardTitle>
          <CardDescription>{getTitle()}</CardDescription>
        </CardHeader>

        <CardContent>
          {mode === "forgot-password" ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  required
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Voer je email adres in en we sturen je een link om je wachtwoord te resetten.
              </p>

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? "Bezig..." : "Verstuur reset link"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Terug naar inloggen
                </button>
              </div>
            </form>
          ) : mode === "login" ? (
            <div className="space-y-4">
              {/* Login method toggle */}
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  type="button"
                  onClick={() => { setLoginMethod("pin"); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === "pin" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <KeyRound className="w-4 h-4" />
                  Pincode
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod("password"); resetForm(); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    loginMethod === "password" 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Wachtwoord
                </button>
              </div>

              {loginMethod === "pin" ? (
                <form onSubmit={handlePinLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Pincode</Label>
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
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary" 
                    disabled={loading || pin.length !== 6}
                  >
                    {loading ? "Bezig..." : "Inloggen"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Pincode login is voor projectgebruikers die zijn uitgenodigd.
                  </p>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password">Wachtwoord</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode("forgot-password")}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      Wachtwoord vergeten?
                    </button>
                  </div>

                  <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                    {loading ? "Bezig..." : "Inloggen"}
                  </Button>
                </form>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-sm text-primary hover:underline"
                >
                  Nog geen account? Registreer hier
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <Label htmlFor="naam">Naam</Label>
                <Input
                  id="naam"
                  value={naam}
                  onChange={(e) => setNaam(e.target.value)}
                  placeholder="Jouw naam"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jouw@email.nl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Wachtwoord</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={loading}>
                {loading ? "Bezig..." : "Registreren"}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-sm text-primary hover:underline"
                >
                  Heb je al een account? Log in
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
