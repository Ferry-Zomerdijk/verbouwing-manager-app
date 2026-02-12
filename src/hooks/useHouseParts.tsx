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
        .order("naam");

      if (error) throw error;
      const houseParts = (data || []) as Array<{ id: string; naam: string; volgorde: number; project_id: string; created_at: string }>;

      // One-time sync: gather deel_van_huis values from all tables and insert missing ones
      const existingNames = new Set(houseParts.map((hp) => hp.naam));

      const [tasks, costs, photos, maint, keys] = await Promise.all([
        supabase.from("tasks").select("deel_van_huis").eq("project_id", projectId).not("deel_van_huis", "is", null),
        supabase.from("costs").select("deel_van_huis").eq("project_id", projectId).not("deel_van_huis", "is", null),
        supabase.from("photos").select("deel_van_huis").eq("project_id", projectId).not("deel_van_huis", "is", null),
        (supabase as any).from("maintenance_instructions").select("deel_van_huis").eq("project_id", projectId).not("deel_van_huis", "is", null),
        supabase.from("keys").select("deel_van_huis").eq("project_id", projectId).not("deel_van_huis", "is", null),
      ]);

      const allUsedValues = new Set(
        [tasks, costs, photos, maint, keys]
          .flatMap((r) => r.data?.map((d: any) => d.deel_van_huis) || [])
          .filter(Boolean)
      );

      const missing = [...allUsedValues].filter((v) => !existingNames.has(v));
      if (missing.length > 0) {
        await (supabase as any).from("house_parts").insert(
          missing.map((naam) => ({ project_id: projectId, naam, volgorde: 0 }))
        );

        // Re-fetch after inserting missing parts
        const { data: refreshed } = await (supabase as any)
          .from("house_parts")
          .select("*")
          .eq("project_id", projectId)
          .order("naam");

        return (refreshed || []) as Array<{ id: string; naam: string; volgorde: number; project_id: string; created_at: string }>;
      }

      return houseParts;
    },
    enabled: !!projectId,
  });

  const housePartNames = (query.data || []).map((hp) => hp.naam);

  // Auto-add a new house part if it doesn't exist yet
  const ensureHousePart = async (naam: string) => {
    if (!naam.trim() || housePartNames.includes(naam.trim())) return;

    await (supabase as any).from("house_parts").insert({
      project_id: projectId,
      naam: naam.trim(),
      volgorde: 0,
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
