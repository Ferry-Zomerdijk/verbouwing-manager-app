import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, Shield, UserPlus, Trash2, Home, Mail, Clock, X, RefreshCw, Copy, Pencil, KeyRound, MessageCircle, Sparkles, Activity, Key, Crown, Tag } from "lucide-react";
import { toast } from "sonner";
import { InviteProjectUserDialog } from "@/components/project/InviteProjectUserDialog";
import { EditProjectUserDialog } from "@/components/project/EditProjectUserDialog";
import { EditPlatformUserDialog } from "@/components/EditPlatformUserDialog";
import { CreatePlatformUserDialog } from "@/components/CreatePlatformUserDialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import AiUsageAnalytics from "@/components/admin/AiUsageAnalytics";
import WebhookHealthMonitor from "@/components/admin/WebhookHealthMonitor";
import { KeyManagement } from "@/components/admin/KeyManagement";
import { ManageSubscriptionDialog } from "@/components/admin/ManageSubscriptionDialog";
import TaskTypesManager from "@/components/admin/TaskTypesManager";

interface PlatformUser {
  id: string;
  naam: string | null;
  email: string | null;
  isAdmin: boolean;
  subscriptionTier: "free" | "basis" | "pro";
}

const UserManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project");
  const queryClient = useQueryClient();
  
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editPlatformUserDialogOpen, setEditPlatformUserDialogOpen] = useState(false);
  const [createPlatformUserDialogOpen, setCreatePlatformUserDialogOpen] = useState(false);
  const [selectedProjectUser, setSelectedProjectUser] = useState<any>(null);
  const [selectedPlatformUser, setSelectedPlatformUser] = useState<PlatformUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(projectId ? "project" : "platform");
  const [manageSubscriptionDialogOpen, setManageSubscriptionDialogOpen] = useState(false);
  const [selectedUserForSubscription, setSelectedUserForSubscription] = useState<PlatformUser | null>(null);
  const [taskTypesDialogOpen, setTaskTypesDialogOpen] = useState(false);

  // Load current user info
  useEffect(() => {
    const loadUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        const { data: adminRole } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!adminRole);
      }
    };
    loadUserInfo();
  }, []);

  // Fetch project details if projectId is provided
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("id, naam")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch project users - separate queries since no FK relationship
  const { data: projectUsers, isLoading: loadingProjectUsers, refetch: refetchProjectUsers } = useQuery({
    queryKey: ["project-users", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      
      // First get project_users
      const { data: puData, error: puError } = await supabase
        .from("project_users")
        .select("id, user_id, created_at")
        .eq("project_id", projectId);

      if (puError) throw puError;
      if (!puData || puData.length === 0) return [];

      // Then get profiles for those users
      const userIds = puData.map(pu => pu.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, naam")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine the data
      return puData.map(pu => ({
        ...pu,
        profiles: profilesData?.find(p => p.id === pu.user_id) || null
      }));
    },
    enabled: !!projectId,
  });

  // Fetch pending invitations for this project
  const { data: pendingInvitations, isLoading: loadingInvitations, refetch: refetchInvitations } = useQuery({
    queryKey: ["pending-invitations", projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("project_invitations")
        .select("*")
        .eq("project_id", projectId)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch all platform users (admin only)
  const { data: platformUsers, isLoading: loadingPlatformUsers, refetch: refetchPlatformUsers } = useQuery({
    queryKey: ["platform-users"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, naam, email")
        .order("naam");

      if (profilesError) throw profilesError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (rolesError) throw rolesError;

      // Fetch active subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select("user_id, tier, status")
        .in("status", ["active", "trialing"]);

      if (subsError) throw subsError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      return (profiles || []).map(profile => {
        const userSub = subscriptions?.find(s => s.user_id === profile.id);
        return {
          id: profile.id,
          naam: profile.naam,
          email: profile.email,
          isAdmin: adminUserIds.has(profile.id),
          subscriptionTier: (userSub?.tier || "free") as "free" | "basis" | "pro",
        };
      });
    },
    enabled: isAdmin,
  });

  const handleRemoveProjectUser = async (projectUserId: string) => {
    if (!confirm("Weet je zeker dat je deze gebruiker wilt verwijderen van dit project?")) return;

    try {
      const { error } = await supabase
        .from("project_users")
        .delete()
        .eq("id", projectUserId);

      if (error) throw error;

      toast.success("Gebruiker verwijderd van project");
      refetchProjectUsers();
    } catch (error: any) {
      console.error("Error removing user:", error);
      toast.error("Kon gebruiker niet verwijderen");
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm("Weet je zeker dat je deze uitnodiging wilt annuleren?")) return;

    try {
      const { error } = await supabase
        .from("project_invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;

      toast.success("Uitnodiging geannuleerd");
      refetchInvitations();
    } catch (error: any) {
      console.error("Error canceling invitation:", error);
      toast.error("Kon uitnodiging niet annuleren");
    }
  };

  const [resending, setResending] = useState<string | null>(null);

  const handleResendInvitation = async (invitation: { id: string; email: string }) => {
    if (!projectId) return;
    
    setResending(invitation.id);
    try {
      // Delete the old invitation first
      await supabase
        .from("project_invitations")
        .delete()
        .eq("id", invitation.id);

      // Create a new invitation
      const { data, error } = await supabase.functions.invoke('create-project-invitation', {
        body: { projectId, email: invitation.email }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`Nieuwe uitnodiging verstuurd naar ${invitation.email}`);
      refetchInvitations();
    } catch (error: any) {
      console.error("Error resending invitation:", error);
      toast.error("Kon uitnodiging niet opnieuw versturen: " + error.message);
    } finally {
      setResending(null);
    }
  };

  const [sendingResetLink, setSendingResetLink] = useState<string | null>(null);

  const handleSendPasswordResetLink = async (email: string, userId: string) => {
    setSendingResetLink(userId);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success(`Wachtwoord reset link verstuurd naar ${email}`);
    } catch (error: any) {
      console.error("Error sending reset link:", error);
      toast.error("Kon reset link niet versturen: " + error.message);
    } finally {
      setSendingResetLink(null);
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
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;
        toast.success("Admin rol verwijderd");
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (error) throw error;
        toast.success("Admin rol toegevoegd");
      }

      refetchPlatformUsers();
    } catch (error: any) {
      toast.error("Fout bij wijzigen rol: " + error.message);
    } finally {
      setUpdating(null);
    }
  };

  const handleDeletePlatformUser = async (userId: string) => {
    if (userId === currentUserId) {
      toast.error("Je kunt jezelf niet verwijderen");
      return;
    }

    if (!confirm("Weet je zeker dat je deze gebruiker wilt verwijderen? Dit verwijdert ook alle gekoppelde data.")) {
      return;
    }

    setDeletingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Gebruiker verwijderd");
      refetchPlatformUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error("Kon gebruiker niet verwijderen: " + error.message);
    } finally {
      setDeletingUser(null);
    }
  };

  const handleEditPlatformUser = (user: PlatformUser) => {
    setSelectedPlatformUser(user);
    setEditPlatformUserDialogOpen(true);
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

  const getTierBadge = (tier: "free" | "basis" | "pro") => {
    switch (tier) {
      case "pro":
        return <Badge className="bg-primary text-primary-foreground text-xs">Pro</Badge>;
      case "basis":
        return <Badge className="bg-blue-500 text-white text-xs">Basis</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Gratis</Badge>;
    }
  };

  const handleBack = () => {
    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-2 hidden sm:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink 
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                  onClick={() => navigate("/dashboard")}
                >
                  <Home className="w-3 h-3" />
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              {project && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink 
                      className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                      onClick={() => navigate(`/project/${projectId}`)}
                    >
                      {project.naam}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs font-medium">
                  Gebruikers beheren
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors" 
              onClick={handleBack}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                Gebruikers beheren
              </h1>
              {project && (
                <p className="text-xs sm:text-sm text-muted-foreground">{project.naam}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            {projectId && (
              <TabsTrigger value="project" className="gap-2">
                <UserPlus className="w-4 h-4" />
                Projectgebruikers
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="platform" className="gap-2">
                <Shield className="w-4 h-4" />
                Platformgebruikers
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="ai-analytics" className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Analytics
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="webhooks" className="gap-2">
                <Activity className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="task-types" className="gap-2">
                <Tag className="w-4 h-4" />
                Taaktypes
              </TabsTrigger>
            )}
            {projectId && (
              <TabsTrigger value="keys" className="gap-2">
                <Key className="w-4 h-4" />
                Beheer
              </TabsTrigger>
            )}
          </TabsList>

          {/* Project Users Tab */}
          {projectId && (
            <TabsContent value="project">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Projectgebruikers</span>
                    <Button onClick={() => setInviteDialogOpen(true)} size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Uitnodigen
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Gebruikers die toegang hebben tot dit project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingProjectUsers ? (
                    <div className="text-center py-8 text-muted-foreground">Laden...</div>
                  ) : projectUsers && projectUsers.length > 0 ? (
                    <div className="space-y-2">
                      {projectUsers.map((pu: any) => (
                        <div 
                          key={pu.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(pu.profiles?.naam, pu.profiles?.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{pu.profiles?.naam || "Naamloos"}</p>
                              <p className="text-sm text-muted-foreground">{pu.profiles?.email}</p>
                              <p className="text-xs text-muted-foreground">
                                Toegevoegd: {new Date(pu.created_at).toLocaleDateString("nl-NL")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProjectUser(pu);
                                setEditDialogOpen(true);
                              }}
                              title="Bewerken"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {pu.profiles?.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendPasswordResetLink(pu.profiles.email!, pu.user_id)}
                                disabled={sendingResetLink === pu.user_id}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Wachtwoord reset link versturen"
                              >
                                <KeyRound className={`w-4 h-4 ${sendingResetLink === pu.user_id ? 'animate-pulse' : ''}`} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveProjectUser(pu.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Verwijderen"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Nog geen projectgebruikers toegevoegd
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pending Invitations Card */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Openstaande uitnodigingen
                  </CardTitle>
                  <CardDescription>
                    Uitnodigingen die nog niet zijn geaccepteerd
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingInvitations ? (
                    <div className="text-center py-8 text-muted-foreground">Laden...</div>
                  ) : pendingInvitations && pendingInvitations.length > 0 ? (
                    <div className="space-y-2">
                      {pendingInvitations.map((invitation) => {
                        const expiresAt = new Date(invitation.expires_at);
                        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        
                        return (
                          <div 
                            key={invitation.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{invitation.email}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Verzonden: {new Date(invitation.created_at!).toLocaleDateString("nl-NL")}
                                  </span>
                                  <Badge 
                                    variant={daysLeft <= 2 ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {daysLeft > 0 ? `Verloopt over ${daysLeft} ${daysLeft === 1 ? 'dag' : 'dagen'}` : 'Bijna verlopen'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const inviteUrl = `${window.location.origin}/accept-invite/${invitation.invite_token}`;
                                  navigator.clipboard.writeText(inviteUrl);
                                  toast.success("Uitnodigingslink gekopieerd naar klembord");
                                }}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Kopieer link"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const inviteUrl = `${window.location.origin}/accept-invite/${invitation.invite_token}`;
                                  const message = `Hoi! Je bent uitgenodigd voor het project "${project?.naam || 'een project'}". Klik hier om toegang te krijgen: ${inviteUrl}`;
                                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                                  window.open(whatsappUrl, '_blank');
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="Delen via WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResendInvitation(invitation)}
                                disabled={resending === invitation.id}
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                title="Opnieuw versturen"
                              >
                                <RefreshCw className={`w-4 h-4 ${resending === invitation.id ? 'animate-spin' : ''}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Annuleren"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Geen openstaande uitnodigingen
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Platform Users Tab */}
          {isAdmin && (
            <TabsContent value="platform">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Platformgebruikers</span>
                    <Button onClick={() => setCreatePlatformUserDialogOpen(true)} size="sm">
                      <UserPlus className="w-4 h-4 mr-2" />
                      Nieuwe gebruiker
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Beheer admin rechten voor alle gebruikers op het platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPlatformUsers ? (
                    <div className="text-center py-8 text-muted-foreground">Laden...</div>
                  ) : platformUsers && platformUsers.length > 0 ? (
                    <div className="space-y-2">
                      {platformUsers.map((user) => (
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
                                {getTierBadge(user.subscriptionTier)}
                                {user.id === currentUserId && (
                                  <span className="text-xs text-muted-foreground">(jij)</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlatformUser(user)}
                              title="Bewerken"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUserForSubscription(user);
                                setManageSubscriptionDialogOpen(true);
                              }}
                              className="text-primary hover:text-primary hover:bg-primary/10"
                              title="Abonnement beheren"
                            >
                              <Crown className="w-4 h-4" />
                            </Button>
                            {user.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSendPasswordResetLink(user.email!, user.id)}
                                disabled={sendingResetLink === user.id}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Wachtwoord reset link versturen"
                              >
                                <KeyRound className={`w-4 h-4 ${sendingResetLink === user.id ? 'animate-pulse' : ''}`} />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlatformUser(user.id)}
                              disabled={deletingUser === user.id || user.id === currentUserId}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              title="Verwijderen"
                            >
                              <Trash2 className={`w-4 h-4 ${deletingUser === user.id ? 'animate-pulse' : ''}`} />
                            </Button>
                            <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                              <Label 
                                htmlFor={`admin-${user.id}`} 
                                className="flex items-center gap-1 text-sm cursor-pointer"
                              >
                                <Shield className={`w-4 h-4 ${user.isAdmin ? "text-primary" : "text-muted-foreground"}`} />
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
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Geen gebruikers gevonden
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* AI Analytics Tab */}
          {isAdmin && (
            <TabsContent value="ai-analytics">
              <AiUsageAnalytics />
            </TabsContent>
          )}

          {/* Webhook Health Tab */}
          {isAdmin && (
            <TabsContent value="webhooks">
              <WebhookHealthMonitor />
            </TabsContent>
          )}

          {/* Task Types Tab */}
          {isAdmin && (
            <TabsContent value="task-types">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Taaktypes beheren</span>
                    <Button onClick={() => setTaskTypesDialogOpen(true)} size="sm">
                      <Tag className="w-4 h-4 mr-2" />
                      Types beheren
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Beheer de taaktypes die beschikbaar zijn voor alle projecten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Klik op "Types beheren" om taaktypes toe te voegen, te bewerken of te verwijderen.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Key Management Tab */}
          {projectId && (
            <TabsContent value="keys">
              <KeyManagement projectId={projectId} />
            </TabsContent>
          )}
        </Tabs>

        {/* Show message if no access */}
        {!projectId && !isAdmin && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Je hebt geen toegang tot gebruikersbeheer.
            </CardContent>
          </Card>
        )}
      </main>

      {projectId && (
        <>
          <InviteProjectUserDialog
            open={inviteDialogOpen}
            onOpenChange={(open) => {
              setInviteDialogOpen(open);
              if (!open) {
                // Refresh invitations when dialog closes
                refetchInvitations();
              }
            }}
            projectId={projectId}
          />
          <EditProjectUserDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            projectUser={selectedProjectUser}
            projectId={projectId}
          />
        </>
      )}

      <EditPlatformUserDialog
        open={editPlatformUserDialogOpen}
        onOpenChange={setEditPlatformUserDialogOpen}
        user={selectedPlatformUser}
      />

      <CreatePlatformUserDialog
        open={createPlatformUserDialogOpen}
        onOpenChange={setCreatePlatformUserDialogOpen}
      />

      <ManageSubscriptionDialog
        open={manageSubscriptionDialogOpen}
        onOpenChange={setManageSubscriptionDialogOpen}
        user={selectedUserForSubscription}
        onSuccess={() => refetchPlatformUsers()}
      />

      <TaskTypesManager
        open={taskTypesDialogOpen}
        onOpenChange={setTaskTypesDialogOpen}
      />
    </div>
  );
};

export default UserManagement;
