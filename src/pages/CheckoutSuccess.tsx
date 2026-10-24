import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    // Pull the new subscription from Stripe right away so Pro features unlock immediately
    supabase.functions.invoke("sync-subscription").finally(() => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    });
  }, [queryClient]);

  useEffect(() => {
    // Fire confetti on mount
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#f59e0b", "#10b981", "#3b82f6"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#f59e0b", "#10b981", "#3b82f6"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    // Initial burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"],
    });

    frame();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center animate-scale-in">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-primary" />
            </div>
            <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
          </div>
          <CardTitle className="text-2xl">Betaling geslaagd!</CardTitle>
          <CardDescription className="text-base">
            Welkom bij je nieuwe abonnement. Je hebt nu toegang tot alle premium features.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Wat kun je nu doen?</h3>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Meer projecten aanmaken
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Onbeperkt taken toevoegen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Teamleden uitnodigen
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Documenten importeren & exporteren
              </li>
            </ul>
          </div>
          
          <Button 
            onClick={() => navigate("/dashboard")} 
            className="w-full"
            size="lg"
          >
            Naar mijn dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
