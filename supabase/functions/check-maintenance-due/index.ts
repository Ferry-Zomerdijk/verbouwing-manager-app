import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MaintenanceInstruction {
  id: string;
  project_id: string;
  titel: string;
  frequentie: string | null;
  laatste_onderhoud: string | null;
  status: string;
  deel_van_huis: string | null;
}

function addToDate(date: Date, frequentie: string): Date | null {
  const map: Record<string, [number, string]> = {
    "Wekelijks": [7, "days"],
    "Tweewekelijks": [14, "days"],
    "Maandelijks": [1, "months"],
    "Per kwartaal": [3, "months"],
    "Halfjaarlijks": [6, "months"],
    "Jaarlijks": [1, "years"],
  };

  if (map[frequentie]) {
    const [amount, unit] = map[frequentie];
    const result = new Date(date);
    if (unit === "days") result.setDate(result.getDate() + amount);
    else if (unit === "months") result.setMonth(result.getMonth() + amount);
    else if (unit === "years") result.setFullYear(result.getFullYear() + amount);
    return result;
  }

  const customMatch = frequentie.match(/^Elke (\d+) (\w+)$/);
  if (customMatch) {
    const amount = parseInt(customMatch[1]);
    const unit = customMatch[2];
    const result = new Date(date);
    if (unit === "dagen") result.setDate(result.getDate() + amount);
    else if (unit === "weken") result.setDate(result.getDate() + amount * 7);
    else if (unit === "maanden") result.setMonth(result.getMonth() + amount);
    else if (unit === "jaren") result.setFullYear(result.getFullYear() + amount);
    return result;
  }

  return null;
}

function formatDate(date: Date): string {
  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get all maintenance instructions with frequentie and laatste_onderhoud
    const { data: instructions, error: instrError } = await supabase
      .from('maintenance_instructions')
      .select('id, project_id, titel, frequentie, laatste_onderhoud, status, deel_van_huis')
      .not('frequentie', 'is', null)
      .not('laatste_onderhoud', 'is', null)
      .neq('status', 'Gedaan');

    if (instrError) throw instrError;
    if (!instructions || instructions.length === 0) {
      return new Response(JSON.stringify({ message: 'No instructions to check', sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let notificationCount = 0;

    for (const instr of instructions as MaintenanceInstruction[]) {
      const lastDate = new Date(instr.laatste_onderhoud! + 'T00:00:00');
      const nextDue = addToDate(lastDate, instr.frequentie!);
      if (!nextDue) continue;

      nextDue.setHours(0, 0, 0, 0);

      // Check if due today or overdue
      if (nextDue > today) continue;

      const isOverdue = nextDue < today;
      const label = isOverdue ? 'achterstallig' : 'vandaag gepland';
      const locationStr = instr.deel_van_huis ? ` (${instr.deel_van_huis})` : '';

      // Check if we already sent a notification today for this instruction
      const todayStr = today.toISOString().split('T')[0];
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('project_id', instr.project_id)
        .eq('type', 'Taak')
        .gte('datum', todayStr + 'T00:00:00')
        .lte('datum', todayStr + 'T23:59:59')
        .like('bericht', `%${instr.id}%`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Get all users with access: project owner + project_users
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', instr.project_id)
        .single();

      if (!project) continue;

      const { data: projectUsers } = await supabase
        .from('project_users')
        .select('user_id')
        .eq('project_id', instr.project_id);

      const userIds = new Set<string>();
      userIds.add(project.user_id);
      projectUsers?.forEach((pu: { user_id: string }) => userIds.add(pu.user_id));

      const title = isOverdue
        ? `⚠️ Onderhoud achterstallig: ${instr.titel}`
        : `🔧 Onderhoud vandaag: ${instr.titel}`;
      const body = isOverdue
        ? `${instr.titel}${locationStr} is achterstallig (verlopen op ${formatDate(nextDue)}). Plan dit zo snel mogelijk in.`
        : `${instr.titel}${locationStr} staat vandaag gepland. Vergeet het niet uit te voeren!`;

      for (const userId of userIds) {
        // In-app notification
        await supabase.from('notifications').insert({
          user_id: userId,
          project_id: instr.project_id,
          type: 'Taak',
          titel: title,
          bericht: `${body} [ref:${instr.id}]`,
        });

        // Push notification (fire-and-forget)
        try {
          await supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: userId,
              title,
              body,
              url: `/project/${instr.project_id}`,
              tag: `maintenance-${instr.id}`,
            },
          });
        } catch (pushErr) {
          console.error(`Push failed for user ${userId}:`, pushErr);
        }

        notificationCount++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificationsSent: notificationCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-maintenance-due:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
