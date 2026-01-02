import { useState, useEffect, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldX, LogIn } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requiredRole?: AppRole;
  unauthorizedRedirect?: string;
}

const ProtectedRoute = ({ 
  children, 
  redirectTo = "/auth",
  requiredRole,
  unauthorizedRedirect = "/dashboard"
}: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // Include current path as returnUrl parameter
          const returnUrl = encodeURIComponent(location.pathname + location.search);
          navigate(`${redirectTo}?returnUrl=${returnUrl}`);
          return;
        }

        setIsAuthenticated(true);

        // If no role is required, we're done
        if (!requiredRole) {
          setHasRequiredRole(true);
          setIsLoading(false);
          return;
        }

        // Check for the required role
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", requiredRole)
          .maybeSingle();

        setHasRequiredRole(!!userRole);
      } catch (error) {
        console.error("Error checking access:", error);
        setIsAuthenticated(false);
        setHasRequiredRole(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        navigate(redirectTo);
      }
    });

    checkAccess();

    return () => subscription.unsubscribe();
  }, [navigate, redirectTo, requiredRole]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <LogIn className="h-16 w-16 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Inloggen Vereist</h2>
            <p className="text-muted-foreground">
              Je moet ingelogd zijn om deze pagina te bekijken.
            </p>
            <Button onClick={() => navigate(redirectTo)} className="w-full">
              Naar Inloggen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated but missing required role
  if (requiredRole && !hasRequiredRole) {
    const roleLabels: Record<AppRole, string> = {
      admin: "beheerders",
      project_user: "projectgebruikers"
    };

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardContent className="pt-6 text-center space-y-4">
            <ShieldX className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Geen Toegang</h2>
            <p className="text-muted-foreground">
              Je hebt geen toegang tot deze pagina. Alleen {roleLabels[requiredRole]} kunnen deze pagina bekijken.
            </p>
            <Button onClick={() => navigate(unauthorizedRedirect)} className="w-full">
              Terug naar Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
