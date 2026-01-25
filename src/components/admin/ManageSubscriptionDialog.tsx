import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Crown, User } from "lucide-react";

interface ManageSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    naam: string | null;
    email: string | null;
  } | null;
  onSuccess: () => void;
}

type SubscriptionTier = "free" | "basis" | "pro";

interface CurrentSubscription {
  tier: SubscriptionTier;
  status: string;
  current_period_end: string | null;
}

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Gratis",
  basis: "Basis",
  pro: "Pro",
};

const DURATION_OPTIONS = [
  { value: "1", label: "1 maand" },
  { value: "3", label: "3 maanden" },
  { value: "6", label: "6 maanden" },
  { value: "12", label: "1 jaar" },
  { value: "unlimited", label: "Onbeperkt" },
];

export function ManageSubscriptionDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: ManageSubscriptionDialogProps) {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("pro");
  const [duration, setDuration] = useState("12");
  const [createStripeCustomer, setCreateStripeCustomer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchCurrentSubscription();
    }
  }, [open, user]);

  const fetchCurrentSubscription = async () => {
    if (!user) return;
    
    setLoadingSubscription(true);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("tier, status, current_period_end")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCurrentSubscription({
          tier: data.tier as SubscriptionTier,
          status: data.status,
          current_period_end: data.current_period_end,
        });
      } else {
        setCurrentSubscription(null);
      }
    } catch (error) {
      console.error("Error fetching subscription:", error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error("Je bent niet ingelogd");
      }

      const durationMonths = duration === "unlimited" ? null : parseInt(duration);

      const { data, error } = await supabase.functions.invoke("admin-manage-subscription", {
        body: {
          userId: user.id,
          tier: selectedTier,
          durationMonths,
          createStripeCustomer,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        selectedTier === "free"
          ? `Abonnement van ${user.naam || user.email} is gedowngraded naar Gratis`
          : `${user.naam || user.email} heeft nu een ${TIER_LABELS[selectedTier]} abonnement`
      );
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error managing subscription:", error);
      toast.error(error.message || "Er ging iets mis bij het beheren van het abonnement");
    } finally {
      setIsLoading(false);
    }
  };

  const getTierBadgeVariant = (tier: SubscriptionTier) => {
    switch (tier) {
      case "pro":
        return "default";
      case "basis":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Abonnement beheren
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user?.naam || "Onbekend"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          {/* Current Subscription */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Huidig abonnement</Label>
            {loadingSubscription ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Laden...</span>
              </div>
            ) : currentSubscription ? (
              <div className="flex items-center gap-2">
                <Badge variant={getTierBadgeVariant(currentSubscription.tier)}>
                  {TIER_LABELS[currentSubscription.tier]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({currentSubscription.status})
                </span>
                {currentSubscription.current_period_end && (
                  <span className="text-xs text-muted-foreground">
                    tot {new Date(currentSubscription.current_period_end).toLocaleDateString("nl-NL")}
                  </span>
                )}
              </div>
            ) : (
              <Badge variant="outline">Gratis</Badge>
            )}
          </div>

          {/* New Tier Selection */}
          <div className="space-y-2">
            <Label htmlFor="tier">Nieuw abonnement</Label>
            <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as SubscriptionTier)}>
              <SelectTrigger id="tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Gratis</SelectItem>
                <SelectItem value="basis">Basis - €4,99/maand</SelectItem>
                <SelectItem value="pro">Pro - €9,99/maand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration Selection - only show for paid tiers */}
          {selectedTier !== "free" && (
            <div className="space-y-2">
              <Label htmlFor="duration">Looptijd</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger id="duration">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Stripe Customer Option */}
          {selectedTier !== "free" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stripe-customer"
                checked={createStripeCustomer}
                onCheckedChange={(checked) => setCreateStripeCustomer(checked === true)}
              />
              <Label htmlFor="stripe-customer" className="text-sm cursor-pointer">
                Creëer ook Stripe customer (voor toekomstige facturering)
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Annuleren
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Bezig...
              </>
            ) : selectedTier === "free" ? (
              "Downgraden naar Gratis"
            ) : (
              "Abonnement Toekennen"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
