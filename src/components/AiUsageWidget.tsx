import { Sparkles, Lock, Infinity, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAiUsage } from "@/hooks/useAiUsage";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

const AiUsageWidget = () => {
  const navigate = useNavigate();
  const { currentTier } = useSubscription();
  const { currentMonthUsage, limit, remaining, canUseAi, isUnlimited, isLoading } = useAiUsage();

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-card border animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
    );
  }

  // Free tier - no AI access
  if (limit === 0) {
    return (
      <div className="p-4 rounded-lg bg-card border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm">AI Factuur Scanner</h3>
            <p className="text-xs text-muted-foreground">Niet beschikbaar</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Upgrade naar Pro om facturen automatisch te laten scannen met AI.
        </p>
        <Button 
          size="sm" 
          variant="outline" 
          className="w-full text-xs"
          onClick={() => navigate("/checkout?plan=pro")}
        >
          Bekijk plannen
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  // Pro tier - unlimited
  if (isUnlimited) {
    return (
      <div className="p-4 rounded-lg bg-card border">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">AI Factuur Scanner</h3>
            <div className="flex items-center gap-1 text-xs text-primary">
              <Infinity className="w-3 h-3" />
              <span>Onbeperkt</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {currentMonthUsage} scan{currentMonthUsage !== 1 ? 's' : ''} deze maand gebruikt
        </p>
      </div>
    );
  }

  // Basis tier - limited usage
  const usagePercentage = limit > 0 ? (currentMonthUsage / limit) * 100 : 0;
  const isNearLimit = remaining <= 2 && remaining > 0;
  const isAtLimit = remaining === 0;

  return (
    <div className="p-4 rounded-lg bg-card border">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isAtLimit ? 'bg-destructive/10' : isNearLimit ? 'bg-chart-1/20' : 'bg-primary/10'
        }`}>
          <Sparkles className={`w-4 h-4 ${
            isAtLimit ? 'text-destructive' : isNearLimit ? 'text-chart-1' : 'text-primary'
          }`} />
        </div>
        <div>
          <h3 className="font-medium text-sm">AI Factuur Scanner</h3>
          <p className="text-xs text-muted-foreground">
            {remaining} van {limit} scans resterend
          </p>
        </div>
      </div>
      
      <Progress 
        value={usagePercentage} 
        className={`h-2 mb-2 ${isAtLimit ? '[&>div]:bg-destructive' : isNearLimit ? '[&>div]:bg-chart-1' : ''}`}
      />
      
      {isAtLimit ? (
        <>
          <p className="text-xs text-destructive mb-2">
            Je hebt je maandelijkse limiet bereikt.
          </p>
          <Button 
            size="sm" 
            className="w-full text-xs gradient-primary"
            onClick={() => navigate("/checkout?plan=pro")}
          >
            Upgrade naar Pro
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </>
      ) : isNearLimit ? (
        <p className="text-xs text-chart-1">
          Bijna op! Upgrade naar Pro voor onbeperkt scannen.
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {currentMonthUsage} scan{currentMonthUsage !== 1 ? 's' : ''} deze maand gebruikt
        </p>
      )}
    </div>
  );
};

export default AiUsageWidget;
