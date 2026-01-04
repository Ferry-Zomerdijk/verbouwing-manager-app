import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription, TIER_LIMITS } from "./useSubscription";

export interface AiUsage {
  currentMonthUsage: number;
  limit: number;
  remaining: number;
  canUseAi: boolean;
  isUnlimited: boolean;
}

export function useAiUsage() {
  const { currentTier, isLoading: isLoadingSubscription } = useSubscription();

  const { data: usageCount, isLoading: isLoadingUsage, refetch } = useQuery({
    queryKey: ["ai-usage", currentTier],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      // Get first day of current month
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { count, error } = await supabase
        .from("ai_usage")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("usage_type", "invoice_scan")
        .gte("created_at", firstDayOfMonth);

      if (error) {
        console.error("Error fetching AI usage:", error);
        return 0;
      }

      return count || 0;
    },
    enabled: !isLoadingSubscription,
  });

  const limit = TIER_LIMITS[currentTier].maxAiScansPerMonth;
  const isUnlimited = limit === -1;
  const currentMonthUsage = usageCount || 0;
  const remaining = isUnlimited ? -1 : Math.max(0, limit - currentMonthUsage);
  const canUseAi = isUnlimited || currentMonthUsage < limit;

  return {
    currentMonthUsage,
    limit,
    remaining,
    canUseAi,
    isUnlimited,
    isLoading: isLoadingSubscription || isLoadingUsage,
    refetch,
  };
}
