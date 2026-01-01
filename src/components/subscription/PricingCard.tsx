import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function PricingCard({
  name,
  description,
  price,
  currency,
  interval,
  features,
  isPopular,
  isCurrent,
  onSelect,
  isLoading,
  disabled,
}: PricingCardProps) {
  const formatPrice = (amount: number, curr: string) => {
    return new Intl.NumberFormat("nl-NL", {
      style: "currency",
      currency: curr.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  return (
    <Card
      className={cn(
        "relative flex flex-col transition-all duration-300",
        isPopular && "border-primary shadow-lg scale-105",
        isCurrent && "border-primary/50 bg-primary/5"
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Meest gekozen
        </Badge>
      )}
      {isCurrent && (
        <Badge variant="outline" className="absolute -top-3 left-1/2 -translate-x-1/2">
          Huidig abonnement
        </Badge>
      )}
      
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1">
        <div className="text-center mb-6">
          <span className="text-4xl font-bold">{formatPrice(price, currency)}</span>
          <span className="text-muted-foreground">/{interval === "month" ? "maand" : "jaar"}</span>
        </div>
        
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          variant={isPopular ? "default" : "outline"}
          onClick={onSelect}
          disabled={disabled || isLoading || isCurrent}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Laden...
            </>
          ) : isCurrent ? (
            "Huidig plan"
          ) : (
            "Selecteer"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
