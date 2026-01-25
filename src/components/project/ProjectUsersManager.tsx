import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, UserPlus, Lock } from "lucide-react";
import { InviteProjectUserDialog } from "./InviteProjectUserDialog";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";

interface ProjectUsersManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const ProjectUsersManager = ({ open, onOpenChange, projectId }: ProjectUsersManagerProps) => {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { canUseFeature, currentTier } = useSubscription();
  const hasTeamSharingAccess = canUseFeature("team_sharing");

  const { data: projectUsers, isLoading } = useQuery({
    queryKey: ['project-users', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          id,
          user_id,
          created_at,
          profiles!user_id (
            email,
            naam
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleRemoveUser = async (projectUserId: string) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return;

    try {
      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('id', projectUserId);

      if (error) throw error;

      toast.success("Gebruiker verwijderd");
      queryClient.invalidateQueries({ queryKey: ['project-users', projectId] });
    } catch (error: any) {
      console.error('Error removing user:', error);
      toast.error("Kon gebruiker niet verwijderen");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Projectgebruikers Beheren</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {hasTeamSharingAccess ? (
              <Button 
                onClick={() => setInviteDialogOpen(true)}
                className="w-full"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nieuwe gebruiker uitnodigen
              </Button>
            ) : (
              <div className="space-y-3">
                <Button 
                  disabled
                  className="w-full opacity-60"
                  variant="secondary"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Nieuwe gebruiker uitnodigen
                </Button>
                <UpgradePrompt 
                  currentTier={currentTier} 
                  feature="team_sharing" 
                  compact 
                />
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laden...
              </div>
            ) : projectUsers && projectUsers.length > 0 ? (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Huidige Gebruikers</h3>
                {projectUsers.map((pu: any) => (
                  <div 
                    key={pu.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{pu.profiles?.naam || 'Naamloos'}</p>
                      <p className="text-sm text-muted-foreground">{pu.profiles?.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Toegevoegd: {new Date(pu.created_at).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveUser(pu.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nog geen projectgebruikers toegevoegd
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InviteProjectUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        projectId={projectId}
      />
    </>
  );
};
