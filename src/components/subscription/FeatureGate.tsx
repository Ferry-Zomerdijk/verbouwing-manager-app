import React from "react";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { UpgradePrompt } from "./UpgradePrompt";
import { Lock } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
  minTier?: SubscriptionTier;
}

/**
 * FeatureGate component that conditionally renders children based on subscription tier.
 * 
 * @param feature - The feature key to check (e.g., "team_sharing", "public_links")
 * @param children - Content to render if user has access
 * @param fallback - Optional custom fallback content if user doesn't have access
 * @param showUpgradePrompt - Whether to show the upgrade prompt (default: true)
 * @param minTier - Optional minimum tier required (overrides feature check)
 */
export function FeatureGate({ 
  feature, 
  children, 
  fallback,
  showUpgradePrompt = true,
  minTier,
}: FeatureGateProps) {
  const { canUseFeature, currentTier, isLoading } = useSubscription();

  // Loading state - show children to prevent flicker
  if (isLoading) {
    return <>{children}</>;
  }

  // Check tier-based access if minTier is specified
  const tierOrder: SubscriptionTier[] = ["free", "basis", "pro"];
  const hasMinTierAccess = minTier 
    ? tierOrder.indexOf(currentTier) >= tierOrder.indexOf(minTier)
    : true;

  // Check feature-based access
  const hasFeatureAccess = canUseFeature(feature);

  // User has access
  if (hasFeatureAccess && hasMinTierAccess) {
    return <>{children}</>;
  }

  // User doesn't have access - show fallback or upgrade prompt
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} currentTier={currentTier} compact />;
  }

  return null;
}

interface FeatureLockedButtonProps {
  feature: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * A button wrapper that shows a locked state if user doesn't have access to the feature.
 * Shows a tooltip explaining the feature is locked.
 */
export function FeatureLockedOverlay({ 
  feature, 
  children,
}: { 
  feature: string;
  children: React.ReactNode;
}) {
  const { canUseFeature, isLoading } = useSubscription();

  if (isLoading || canUseFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Pro</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if a feature is available for the current user's subscription.
 * Use this for more granular control in components.
 */
export function useFeatureAccess(feature: string) {
  const { canUseFeature, currentTier, isLoading } = useSubscription();

  return {
    hasAccess: canUseFeature(feature),
    currentTier,
    isLoading,
    requiredTier: getRequiredTierForFeature(feature),
  };
}

function getRequiredTierForFeature(feature: string): SubscriptionTier {
  const proFeatures = ["team_sharing", "public_links", "priority_support"];
  const basisFeatures = ["import_export", "contractors"];

  if (proFeatures.includes(feature)) return "pro";
  if (basisFeatures.includes(feature)) return "basis";
  return "free";
}
