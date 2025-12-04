import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, Shield, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: string;
  naam: string | null;
  email: string | null;
  isAdmin: boolean;
}

const AdminUsersDialog = ({ open, onOpenChange }: AdminUsersDialogProps) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      // Get all profiles (admin only via RLS)
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, naam, email")
        .order("naam");

      if (profilesError) throw profilesError;

      // Get all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => ({
        id: profile.id,
        naam: profile.naam,
        email: profile.email,
        isAdmin: adminUserIds.has(profile.id),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error("Error loading users:", error);
      toast.error("Kon gebruikers niet laden");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (userId === currentUserId) {
      toast.error("Je kunt je eigen admin rol niet wijzigen");
      return;
    }

    setUpdating(userId);
    try {
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
        toast.success("Admin rol verwijderd");
      } else {
        // Add admin role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
        toast.success("Admin rol toegevoegd");
      }

      // Refresh users list
      await loadUsers();
    } catch (error: any) {
      toast.error("Fout bij wijzigen rol: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const getInitials = (naam: string | null, email: string | null) => {
    if (naam) {
      return naam.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "?";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Gebruikers Beheren
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Laden...</div>
        ) : users.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            Geen gebruikers gevonden
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.naam, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {user.naam || "Onbekend"}
                      {user.id === currentUserId && (
                        <span className="text-xs text-muted-foreground">(jij)</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor={`admin-${user.id}`} 
                    className="flex items-center gap-1 text-sm cursor-pointer"
                  >
                    <Shield className={`w-4 h-4 ${user.isAdmin ? 'text-primary' : 'text-muted-foreground'}`} />
                    Admin
                  </Label>
                  <Switch
                    id={`admin-${user.id}`}
                    checked={user.isAdmin}
                    onCheckedChange={() => handleToggleAdmin(user.id, user.isAdmin)}
                    disabled={updating === user.id || user.id === currentUserId}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminUsersDialog;
