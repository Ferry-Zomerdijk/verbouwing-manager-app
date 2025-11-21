import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProjectTasksWithDnd from "@/components/project/ProjectTasksWithDnd";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const ProjectTasksView = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const authenticateWithToken = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        try {
          // Sign in with the magic link token
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'magiclink',
          });
          
          if (error) {
            console.error('Token verification error:', error);
            toast.error('Ongeldige of verlopen toegangslink');
            navigate('/auth');
            return;
          }

          // Mark token as used
          await supabase
            .from('project_access_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('token', token);

          // Remove token from URL for security
          window.history.replaceState({}, '', `/project-tasks/${projectId}`);
          
          toast.success('Succesvol ingelogd');
        } catch (err) {
          console.error('Authentication error:', err);
          toast.error('Er ging iets mis bij het inloggen');
          navigate('/auth');
          return;
        }
      }

      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);
      setIsAuthenticating(false);
    };

    authenticateWithToken();
  }, [searchParams, projectId, navigate]);

  const { data: hasAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ['project-access', projectId, user?.id],
    queryFn: async () => {
      if (!user || !projectId) return false;
      
      const { data, error } = await supabase.rpc('has_project_access', {
        _user_id: user.id,
        _project_id: projectId,
      });

      if (error) {
        console.error('Access check error:', error);
        return false;
      }
      return data;
    },
    enabled: !!user && !!projectId,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('naam')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!hasAccess,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (isAuthenticating || checkingAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 animate-pulse" />
          <p className="text-muted-foreground">Toegang controleren...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold mb-2">Geen toegang</h2>
          <p className="text-muted-foreground mb-4">
            Je hebt geen toegang tot dit project.
          </p>
          <Button onClick={() => navigate('/auth')}>Naar Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              {project?.naam || 'Project Taken'}
            </h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Uitloggen
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ProjectTasksWithDnd projectId={projectId!} isProjectUserView={true} />
      </main>
    </div>
  );
};

export default ProjectTasksView;
