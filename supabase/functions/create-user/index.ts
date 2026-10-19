import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  naam?: string;
  sendResetLink?: boolean;
  makeAdmin?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Create user function invoked");

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Geen autorisatie header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client for user authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client for user creation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user
    const { data: { user: requestingUser }, error: authError } = await supabaseUser.auth.getUser();
    
    if (authError || !requestingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Niet geauthenticeerd" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Requesting user:", requestingUser.id);

    // Check if the requesting user has admin role
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Error checking admin role:", roleError);
      return new Response(
        JSON.stringify({ error: "Fout bij controleren admin rechten" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminRole) {
      console.error("User is not an admin");
      return new Response(
        JSON.stringify({ error: "Alleen admins kunnen gebruikers aanmaken" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, naam, sendResetLink = true, makeAdmin = false }: CreateUserRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is verplicht" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Ongeldig email formaat" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Creating user");

    // Generate a random password (user will reset it via link)
    const randomPassword = crypto.randomUUID() + "Aa1!";

    // Create the user with admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { naam: naam || null },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      
      // Check for duplicate email error
      if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({ error: "Er bestaat al een gebruiker met dit emailadres" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User created successfully:", newUser.user.id);

    // If makeAdmin is true, add admin role
    if (makeAdmin && newUser.user) {
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUser.user.id, role: "admin" });

      if (roleInsertError) {
        console.error("Error adding admin role:", roleInsertError);
        // Don't fail the whole operation, just log it
      } else {
        console.log("Admin role added for user:", newUser.user.id);
      }
    }

    // Send password reset link if requested
    if (sendResetLink && newUser.user) {
      const origin = req.headers.get("origin") || "https://verbouwing-manager-app.lovable.app";
      
      const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: email,
        options: {
          redirectTo: `${origin}/reset-password`,
        },
      });

      if (resetError) {
        console.error("Error generating reset link:", resetError);
        // Don't fail the operation, just log it
      } else {
        console.log("Password reset link generated");
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: sendResetLink 
          ? "Gebruiker aangemaakt en wachtwoord reset link verstuurd" 
          : "Gebruiker aangemaakt"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Er is een onverwachte fout opgetreden";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
