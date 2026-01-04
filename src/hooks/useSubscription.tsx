import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type SubscriptionTier = "free" | "basis" | "pro";
export type SubscriptionStatus = "trialing" | "active" | "canceled" | "incomplete" | "incomplete_expired" | "past_due" | "unpaid" | "paused";

export interface Subscription {
  id: string;
  user_id: string;
  customer_id: string | null;
  price_id: string | null;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
}

export interface Price {
  id: string;
  product_id: string | null;
  active: boolean;
  currency: string;
  unit_amount: number | null;
  interval: string | null;
  interval_count: number | null;
  trial_period_days: number | null;
  type: string | null;
  metadata: Record<string, string> | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  metadata: Record<string, string> | null;
}

// Stripe product and price IDs
export const STRIPE_TIERS = {
  basis: {
    product_id: "prod_TiJvrPggwqeBgF",
    price_id: "price_1SktI7GzO5wk8qyVK5wr1ENc",
  },
  pro: {
    product_id: "prod_TiJysg1CJilS1o",
    price_id: "price_1SktK8GzO5wk8qyVsW9NlTMb",
  },
};

// Tier limits configuration
export const TIER_LIMITS = {
  free: {
    maxProjects: 1,
    maxTasks: 5,
    maxPhotos: 10,
    maxDocuments: 3,
    maxContractors: 2,
    maxAiScansPerMonth: 0, // No AI access
    features: ["basic_tasks", "basic_photos"],
  },
  basis: {
    maxProjects: 3,
    maxTasks: -1, // unlimited
    maxPhotos: 100,
    maxDocuments: 20,
    maxContractors: 10,
    maxAiScansPerMonth: 10, // 10 scans per month
    features: ["basic_tasks", "basic_photos", "import_export", "contractors", "ai_invoice_scan"],
  },
  pro: {
    maxProjects: -1, // unlimited
    maxTasks: -1,
    maxPhotos: -1,
    maxDocuments: -1,
    maxContractors: -1,
    maxAiScansPerMonth: -1, // Unlimited
    features: ["basic_tasks", "basic_photos", "import_export", "contractors", "team_sharing", "public_links", "priority_support", "ai_invoice_scan"],
  },
};

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data: subscription, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }

      return data as Subscription | null;
    },
  });

  const { data: products, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true);

      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: prices, isLoading: isLoadingPrices } = useQuery({
    queryKey: ["prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("active", true);

      if (error) throw error;
      return data as Price[];
    },
  });

  const createCheckoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const { data, error } = await supabase.functions.invoke("stripe-checkout", {
        body: {
          priceId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/pricing?subscription=canceled`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Checkout error:", error);
      toast.error("Er ging iets mis bij het starten van de checkout");
    },
  });

  const openPortalMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("stripe-portal", {
        body: {
          returnUrl: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Portal error:", error);
      toast.error("Er ging iets mis bij het openen van het klantportaal");
    },
  });

  // Get current tier (defaults to free if no subscription)
  const currentTier: SubscriptionTier = subscription?.tier || "free";
  const isActive = subscription?.status === "active" || subscription?.status === "trialing";
  const limits = TIER_LIMITS[currentTier];

  // Check if user can perform an action based on their tier
  const canUseFeature = (feature: string): boolean => {
    return limits.features.includes(feature);
  };

  // Check if user has reached a limit
  const hasReachedLimit = (type: keyof typeof limits, currentCount: number): boolean => {
    const limit = limits[type] as number;
    if (limit === -1) return false; // unlimited
    return currentCount >= limit;
  };

  return {
    subscription,
    products,
    prices,
    currentTier,
    isActive,
    limits,
    isLoading: isLoadingSubscription || isLoadingProducts || isLoadingPrices,
    createCheckout: createCheckoutMutation.mutate,
    isCreatingCheckout: createCheckoutMutation.isPending,
    openPortal: openPortalMutation.mutate,
    isOpeningPortal: openPortalMutation.isPending,
    canUseFeature,
    hasReachedLimit,
    refetch: () => queryClient.invalidateQueries({ queryKey: ["subscription"] }),
  };
}
