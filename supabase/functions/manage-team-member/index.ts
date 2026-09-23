import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageTeamMemberPayload {
  action: "delete" | "toggle_status";
  target_user_id: string;
  is_active?: boolean;
}

serve(async (req: Request) => {
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const userClient = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceRoleKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: requester }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !requester) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token or session." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

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

    const body: ManageTeamMemberPayload = await req.json();
    const { action, target_user_id, is_active } = body;

    if (!target_user_id) {
      return new Response(
        JSON.stringify({ error: "Target user ID is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (target_user_id === requester.id) {
      return new Response(
        JSON.stringify({ error: "You cannot modify or delete your own admin account through this action." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      // Delete Auth user cleanly (triggers cascaded cleanup in profiles and employees if FK configured, or manually cleanup)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(target_user_id);
      if (deleteAuthError) {
        return new Response(
          JSON.stringify({ error: deleteAuthError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Cleanup profiles and employees rows if remaining
      await supabaseAdmin.from("employees").delete().eq("profile_id", target_user_id);
      await supabaseAdmin.from("profiles").delete().eq("id", target_user_id);

      return new Response(
        JSON.stringify({ success: true, message: "User deleted successfully." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "toggle_status") {
      const newStatus = is_active ?? false;

      // Update ban status in auth.users if deactivating
      if (!newStatus) {
        await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          ban_duration: "876000h", // ban for 100 years
        });
      } else {
        await supabaseAdmin.auth.admin.updateUserById(target_user_id, {
          ban_duration: "none", // remove ban
        });
      }

      // Update profiles and employees
      await supabaseAdmin.from("profiles").update({ is_active: newStatus }).eq("id", target_user_id);
      await supabaseAdmin.from("employees").update({ is_active: newStatus }).eq("profile_id", target_user_id);

      return new Response(
        JSON.stringify({ success: true, is_active: newStatus }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid action." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "An unexpected server error occurred.";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
