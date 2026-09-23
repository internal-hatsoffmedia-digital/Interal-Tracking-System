import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateTeamMemberPayload {
  full_name: string;
  email: string;
  password: string;
  role: string;
  job_title?: string;
  team_id?: string;
  is_active?: boolean;
}

const ALLOWED_ROLES = [
  "admin",
  "director",
  "associate_lead",
  "project_coordinator",
  "team_lead",
  "employee",
];

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing server configuration (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).");
    }

    // 1. Verify requester JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // User client to get current authenticated user
    const userClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: requester }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !requester) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token or expired session." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Admin client with Service Role Key for elevated operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 2. Check requester's role in public.profiles
    const { data: requesterProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, is_active")
      .eq("id", requester.id)
      .maybeSingle();

    if (profileError || !requesterProfile || !requesterProfile.is_active || requesterProfile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Forbidden: Administrator privileges required." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Parse and validate body
    const body: CreateTeamMemberPayload = await req.json();
    const { full_name, email, password, role, job_title, team_id, is_active = true } = body;

    if (!full_name || !full_name.trim()) {
      return new Response(
        JSON.stringify({ error: "Full name is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!password || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!role || !ALLOWED_ROLES.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${ALLOWED_ROLES.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Create user in Supabase Auth via admin API
    const { data: createdAuthData, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
      },
    });

    if (createAuthError) {
      return new Response(
        JSON.stringify({ error: createAuthError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdUserId = createdAuthData.user.id;

    // 5. Existing DB trigger (on_auth_user_created) creates profiles & employees automatically.
    // Wait briefly or update profile & employee rows directly to ensure role & details are set.
    const cleanTeamId = team_id && team_id.trim() ? team_id.trim() : null;
    const cleanJobTitle = job_title && job_title.trim() ? job_title.trim() : null;

    // Update profile role, team_id, is_active
    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: full_name.trim(),
        role,
        team_id: cleanTeamId,
        job_title: cleanJobTitle,
        is_active,
      })
      .eq("id", createdUserId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
    }

    // Update employee job_title, team_id, is_active
    const { error: employeeUpdateError } = await supabaseAdmin
      .from("employees")
      .update({
        full_name: full_name.trim(),
        job_title: cleanJobTitle,
        team_id: cleanTeamId,
        is_active,
      })
      .eq("profile_id", createdUserId);

    if (employeeUpdateError) {
      console.error("Employee update error:", employeeUpdateError);
    }

    // 6. Return success response
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: createdUserId,
          email: createdAuthData.user.email,
          full_name: full_name.trim(),
          role,
          job_title: cleanJobTitle,
          team_id: cleanTeamId,
          is_active,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
