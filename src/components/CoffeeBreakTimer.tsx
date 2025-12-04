import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { getRandomWisdom } from "@/lib/builderJokes";

const COFFEE_BREAK_KEY = "lastCoffeeBreak";

const CoffeeBreakTimer = () => {
  const [minutesSinceBreak, setMinutesSinceBreak] = useState(0);

  useEffect(() => {
    const calculateMinutes = () => {
      const lastBreak = localStorage.getItem(COFFEE_BREAK_KEY);
      if (lastBreak) {
        const diff = Date.now() - parseInt(lastBreak);
        setMinutesSinceBreak(Math.floor(diff / 60000));
      } else {
        // Als er nog geen pauze is geweest, start vanaf nu
        localStorage.setItem(COFFEE_BREAK_KEY, Date.now().toString());
        setMinutesSinceBreak(0);
      }
    };

    calculateMinutes();
    const interval = setInterval(calculateMinutes, 60000); // Update elke minuut

    return () => clearInterval(interval);
  }, []);

  const takeCoffeeBreak = () => {
    localStorage.setItem(COFFEE_BREAK_KEY, Date.now().toString());
    setMinutesSinceBreak(0);
    
    const messages = [
      "Ahh, verse koffie! ☕ Nu kun je er weer tegenaan!",
      "Koffiepauze! De brandstof van elke bouwvakker. ☕",
      "Even opladen... met koffie natuurlijk! ☕",
      "☕ Koffie = Productiviteit. Wiskundig bewezen.",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    toast.success(randomMessage, {
      description: getRandomWisdom(),
      duration: 5000,
    });
  };

  const isOverdue = minutesSinceBreak >= 120; // 2 uur
  const isWarning = minutesSinceBreak >= 90; // 1.5 uur

  const formatTime = () => {
    const hours = Math.floor(minutesSinceBreak / 60);
    const mins = minutesSinceBreak % 60;
    if (hours > 0) {
      return `${hours}u ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={takeCoffeeBreak}
            className={`gap-1.5 text-xs transition-colors ${
              isOverdue
                ? "text-destructive hover:text-destructive animate-pulse"
                : isWarning
                ? "text-amber-500 hover:text-amber-600"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span className="hidden sm:inline">{formatTime()}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-medium">
            {isOverdue
              ? "🚨 KOFFIEPAUZE NODIG! Al 2+ uur bezig!"
              : isWarning
              ? "⚠️ Bijna tijd voor koffie..."
              : "☕ Tijd sinds laatste pauze"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Klik om een koffiepauze te nemen
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default CoffeeBreakTimer;
