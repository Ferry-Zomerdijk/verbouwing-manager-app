import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHouseParts(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["house-parts", projectId],
    queryFn: async () => {
      // Initialize house parts if none exist
      await supabase.rpc("initialize_house_parts", { p_project_id: projectId });

      const { data, error } = await (supabase as any)
        .from("house_parts")
        .select("*")
        .eq("project_id", projectId)
        .order("volgorde");

      if (error) throw error;
      return (data || []) as Array<{ id: string; naam: string; volgorde: number; project_id: string; created_at: string }>;
    },
    enabled: !!projectId,
  });

  const housePartNames = (query.data || []).map((hp) => hp.naam);

  // Auto-add a new house part if it doesn't exist yet
  const ensureHousePart = async (naam: string) => {
    if (!naam.trim() || housePartNames.includes(naam.trim())) return;

    const maxVolgorde = Math.max(0, ...(query.data || []).map((hp) => hp.volgorde));
    
    await (supabase as any).from("house_parts").insert({
      project_id: projectId,
      naam: naam.trim(),
      volgorde: maxVolgorde + 1,
    });

    queryClient.invalidateQueries({ queryKey: ["house-parts", projectId] });
  };

  return {
    houseParts: query.data || [],
    housePartNames,
    isLoading: query.isLoading,
    ensureHousePart,
  };
}
