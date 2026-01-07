import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all photos from the database
    const { data: photos, error: photosError } = await supabase
      .from("photos")
      .select("id, afbeelding_url");

    if (photosError) {
      throw new Error(`Failed to fetch photos: ${photosError.message}`);
    }

    console.log(`Found ${photos?.length || 0} photos to check for migration`);

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const photo of photos || []) {
      const path = photo.afbeelding_url;
      
      // Skip if path doesn't look like a photo path
      if (!path || !path.includes("/photos/")) {
        skippedCount++;
        continue;
      }

      try {
        // Check if file exists in old bucket
        const { data: oldFile, error: downloadError } = await supabase.storage
          .from("invoices")
          .download(path);

        if (downloadError) {
          // File might already be migrated or doesn't exist in old bucket
          console.log(`Skipping ${path}: ${downloadError.message}`);
          skippedCount++;
          continue;
        }

        // Check if file already exists in new bucket
        const { data: existingFile } = await supabase.storage
          .from("project-photos")
          .download(path);

        if (existingFile) {
          console.log(`File already exists in project-photos: ${path}`);
          skippedCount++;
          continue;
        }

        // Upload to new bucket
        const { error: uploadError } = await supabase.storage
          .from("project-photos")
          .upload(path, oldFile, {
            contentType: oldFile.type || "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        console.log(`Migrated: ${path}`);
        migratedCount++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error migrating ${path}:`, err);
        errors.push(`${path}: ${errorMessage}`);
        errorCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Migration complete`,
        stats: {
          total: photos?.length || 0,
          migrated: migratedCount,
          skipped: skippedCount,
          errors: errorCount,
        },
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
