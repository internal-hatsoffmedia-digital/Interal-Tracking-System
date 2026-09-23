import { supabase } from "../../lib/supabase";
import type { UserRole } from "../../types/auth";
import type {
  CreateTeamMemberInput,
  TeamMember,
  UpdateTeamMemberInput,
} from "../../types/teamMember";

/* =========================================================
   GET ALL TEAM MEMBERS
========================================================= */

export async function getTeamMembers(): Promise<TeamMember[]> {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role,
      team_id,
      job_title,
      is_active,
      created_at,
      employees (
        employee_code,
        job_title,
        is_active
      ),
      teams (
        id,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (profileError) {
    throw profileError;
  }

  return (profileData ?? []).map((p: any) => {
    const emp = Array.isArray(p.employees) ? p.employees[0] : p.employees;
    const team = Array.isArray(p.teams) ? p.teams[0] : p.teams;

    const codeSuffix = p.id ? p.id.replace(/-/g, "").substring(0, 6).toUpperCase() : "000000";

    return {
      id: p.id,
      full_name: p.full_name || "Unnamed User",
      email: p.email || "",
      employee_code: emp?.employee_code || `EMP-${codeSuffix}`,
      role: (p.role as UserRole) || "employee",
      job_title: p.job_title || emp?.job_title || null,
      team_id: p.team_id || null,
      team_name: team?.name || null,
      is_active: p.is_active ?? true,
      created_at: p.created_at || new Date().toISOString(),
    };
  });
}

/* =========================================================
   CREATE TEAM MEMBER (SUPABASE AUTH & DATABASE PROVISIONING)
========================================================= */

export async function createTeamMember(
  input: CreateTeamMemberInput,
): Promise<TeamMember> {
  const { data, error } = await supabase.functions.invoke("create-team-member", {
    body: {
      full_name: input.full_name.trim(),
      email: input.email.trim(),
      password: input.password,
      role: input.role,
      job_title: input.job_title?.trim() || undefined,
      team_id: input.team_id || undefined,
      is_active: input.is_active ?? true,
    },
  });

  if (error) {
    console.error("Edge function invoke error:", error);
    throw new Error(error.message || "Failed to create team member via server function.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  // Refetch created member details
  const members = await getTeamMembers();
  const createdMember = members.find((m) => m.id === data?.user?.id);
  if (createdMember) {
    return createdMember;
  }

  return {
    id: data.user.id,
    full_name: input.full_name,
    email: input.email,
    employee_code: "EMP-PENDING",
    role: input.role,
    job_title: input.job_title || null,
    team_id: input.team_id || null,
    team_name: null,
    is_active: input.is_active ?? true,
    created_at: new Date().toISOString(),
  };
}

/* =========================================================
   UPDATE TEAM MEMBER
========================================================= */

export async function updateTeamMember(
  id: string,
  input: UpdateTeamMemberInput,
): Promise<void> {
  const cleanTeamId = input.team_id && input.team_id.trim() ? input.team_id : null;
  const cleanJobTitle = input.job_title && input.job_title.trim() ? input.job_title.trim() : null;

  // 1. Update profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      role: input.role,
      team_id: cleanTeamId,
      job_title: cleanJobTitle,
      ...(input.is_active !== undefined && { is_active: input.is_active }),
    })
    .eq("id", id);

  if (profileError) {
    throw profileError;
  }

  // 2. Update employees table
  const { error: employeeError } = await supabase
    .from("employees")
    .update({
      full_name: input.full_name.trim(),
      team_id: cleanTeamId,
      job_title: cleanJobTitle,
      ...(input.is_active !== undefined && { is_active: input.is_active }),
    })
    .eq("profile_id", id);

  if (employeeError) {
    console.warn("Employee update warning:", employeeError);
  }
}

/* =========================================================
   TOGGLE TEAM MEMBER STATUS (ACTIVATE / DEACTIVATE)
========================================================= */

export async function toggleTeamMemberStatus(
  id: string,
  currentStatus: boolean,
): Promise<void> {
  const newStatus = !currentStatus;

  // Try using Edge Function manage-team-member first
  try {
    const { data, error } = await supabase.functions.invoke("manage-team-member", {
      body: {
        action: "toggle_status",
        target_user_id: id,
        is_active: newStatus,
      },
    });

    if (!error && !data?.error) {
      return;
    }
  } catch (err) {
    console.warn("Edge function toggle status fallback to DB direct update:", err);
  }

  // Direct DB update fallback
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({ is_active: newStatus })
    .eq("id", id);

  if (profileErr) throw profileErr;

  await supabase
    .from("employees")
    .update({ is_active: newStatus })
    .eq("profile_id", id);
}

/* =========================================================
   DELETE TEAM MEMBER (PERMANENT DELETE)
========================================================= */

export async function deleteTeamMember(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("manage-team-member", {
    body: {
      action: "delete",
      target_user_id: id,
    },
  });

  if (error) {
    throw new Error(error.message || "Failed to delete team member.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }
}
