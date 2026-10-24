import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shareToken } = await req.json();

    if (!shareToken) {
      console.log("No share token provided");
      return new Response(
        JSON.stringify({ error: "Share token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Validating share token");

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate share token and get project info
    const { data: share, error: shareError } = await supabaseAdmin
      .from("public_project_shares")
      .select("*, projects(*)")
      .eq("share_token", shareToken)
      .eq("is_active", true)
      .maybeSingle();

    if (shareError) {
      console.error("Error fetching share:", shareError);
      return new Response(
        JSON.stringify({ error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!share) {
      console.log("Share not found or inactive");
      return new Response(
        JSON.stringify({ error: "Invalid or inactive share link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      console.log("Share has expired");
      return new Response(
        JSON.stringify({ error: "This share link has expired" }),
        { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const projectId = share.project_id;

    console.log("Fetching project data for:", projectId);

    // Increment view count
    await supabaseAdmin
      .from("public_project_shares")
      .update({ view_count: (share.view_count || 0) + 1 })
      .eq("id", share.id);

    // Fetch project (without budget info)
    const project = share.projects;
    const publicProject = {
      id: project.id,
      naam: project.naam,
      type: project.type,
      status: project.status,
      beschrijving: project.beschrijving,
      startdatum: project.startdatum,
      einddatum: project.einddatum,
      voortgang: project.voortgang,
      // No budget or cost info!
    };

    // Fetch tasks
    const { data: tasks } = await supabaseAdmin
      .from("tasks")
      .select("id, titel, beschrijving, status, prioriteit, deadline, begindatum, deel_van_huis, verantwoordelijke, image_urls, created_at, updated_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Fetch task updates for the latest update per task
    const taskIds = tasks?.map((t: any) => t.id) || [];
    let latestUpdateByTask: Record<string, string> = {};
    
    if (taskIds.length > 0) {
      const { data: updates } = await supabaseAdmin
        .from("task_updates")
        .select("task_id, content, created_at")
        .in("task_id", taskIds)
        .order("created_at", { ascending: false });
      
      updates?.forEach((update: any) => {
        if (!latestUpdateByTask[update.task_id]) {
          latestUpdateByTask[update.task_id] = update.content;
        }
      });
    }

    const tasksWithUpdates = tasks?.map((task: any) => ({
      ...task,
      latest_update: latestUpdateByTask[task.id] || null,
    }));

    // Fetch documents
    const { data: documents } = await supabaseAdmin
      .from("documents")
      .select("id, bestandsnaam, bestand_url, type, upload_datum")
      .eq("project_id", projectId)
      .order("upload_datum", { ascending: false });

    // Fetch photos
    const { data: photos } = await supabaseAdmin
      .from("photos")
      .select("id, afbeelding_url, fase, notitie, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Fetch contractors
    const { data: contractors } = await supabaseAdmin
      .from("contractors")
      .select("id, naam, bedrijf, rol, email, telefoon, notities, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    // Fetch recent task activity (last 20)
    const { data: activity } = await supabaseAdmin
      .from("task_activity_log")
      .select("id, task_id, task_title, action, changes, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(20);

    console.log("Successfully fetched project data");

    return new Response(
      JSON.stringify({
        project: publicProject,
        tasks: tasksWithUpdates || [],
        documents: documents || [],
        photos: photos || [],
        contractors: contractors || [],
        activity: activity || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in get-public-project-data:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
