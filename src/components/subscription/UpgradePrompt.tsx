import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionTier } from "@/hooks/useSubscription";

interface UpgradePromptProps {
  currentTier: SubscriptionTier;
  feature?: string;
  limitType?: string;
  compact?: boolean;
}

export function UpgradePrompt({ currentTier, feature, limitType, compact = false }: UpgradePromptProps) {
  const navigate = useNavigate();

  const upgradeMessages: Record<string, string> = {
    maxProjects: "Je hebt het maximale aantal projecten bereikt",
    maxTasks: "Je hebt het maximale aantal taken bereikt",
    maxPhotos: "Je hebt het maximale aantal foto's bereikt",
    maxDocuments: "Je hebt het maximale aantal documenten bereikt",
    maxContractors: "Je hebt het maximale aantal aannemers bereikt",
  };

  const featureMessages: Record<string, string> = {
    team_sharing: "Teamleden uitnodigen is alleen beschikbaar in het Pro abonnement",
    public_links: "Publieke links zijn alleen beschikbaar in het Pro abonnement",
    import_export: "Importeren en exporteren is beschikbaar vanaf het Basis abonnement",
    contractors: "Aannemers beheren is beschikbaar vanaf het Basis abonnement",
    ai_invoice_scan: "AI factuurscanning is alleen beschikbaar in het Pro abonnement",
  };

  const message = limitType 
    ? upgradeMessages[limitType] 
    : feature 
      ? featureMessages[feature] 
      : "Upgrade naar een hoger abonnement voor meer mogelijkheden";

  const nextTier = currentTier === "free" ? "Basis" : "Pro";

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <p className="text-sm">{message}</p>
        </div>
        <Button size="sm" onClick={() => navigate(`/checkout?plan=${feature && ["team_sharing","public_links","ai_invoice_scan"].includes(feature) ? "pro" : currentTier === "free" ? "basis" : "pro"}`)}>
          Upgrade naar {nextTier}
        </Button>
      </div>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Upgrade je abonnement</CardTitle>
        </div>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => navigate(`/checkout?plan=${feature && ["team_sharing","public_links","ai_invoice_scan"].includes(feature) ? "pro" : currentTier === "free" ? "basis" : "pro"}`)} className="w-full">
          Bekijk abonnementen
        </Button>
      </CardContent>
    </Card>
  );
}
