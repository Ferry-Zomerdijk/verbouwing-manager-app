import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProPlan {
  name: string;
  amount_cents: number;
  currency: string;
  interval: "month" | "year";
  price_id: string;
  terms: string;
}

export const formatEuro = (cents: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(cents / 100);

export const intervalLabel = (i: string) => (i === "year" ? "jaar" : "maand");

export function useProPlan() {
  return useQuery({
    queryKey: ["app_settings", "pro_plan"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("app_settings").select("value").eq("key", "pro_plan").maybeSingle();
      if (error) throw error;
      return data?.value as ProPlan;
    },
    staleTime: 60_000,
  });
}
