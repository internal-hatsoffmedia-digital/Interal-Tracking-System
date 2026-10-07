import { supabase } from "../../lib/supabase";

import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../types/client";

async function attachAssignedCoordinators(clients: Record<string, unknown>[]): Promise<Client[]> {
  if (clients.length === 0) return [];
  const creatorIds=[...new Set(clients.map(c=>c.created_by as string).filter(Boolean))];
  const creators=creatorIds.length ? await supabase.rpc('project_people') : {data:[],error:null};
  if(creators.error)throw new Error(creators.error.message);

  // Fetch employees to map assigned_coordinator_id
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, full_name, email");
  if(employeesError)throw new Error(employeesError.message);

  const employeeMap = new Map<string, { id: string; full_name: string; email: string | null }>();
  if (employees) {
    for (const emp of employees) {
      employeeMap.set(emp.id, emp);
    }
  }

  return clients.map((c) => {
    const coordId = (c.assigned_coordinator_id as string) || null;
    const coord = coordId ? employeeMap.get(coordId) ?? null : null;
    return {
      ...c,
      creator_name: creators.data?.find((p:{id:string;full_name:string|null})=>p.id===c.created_by)?.full_name ?? null,
      assigned_coordinator_id: coordId,
      assigned_coordinator: coord
        ? { id: coord.id, full_name: coord.full_name, email: coord.email }
        : null,
    } as unknown as Client;
  });
}

/* =========================================================
   GET ALL CLIENTS
========================================================= */

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return attachAssignedCoordinators((data ?? []) as Record<string, unknown>[]);
}

/* =========================================================
   GET ACTIVE CLIENTS
========================================================= */

export async function getActiveClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  return attachAssignedCoordinators((data ?? []) as Record<string, unknown>[]);
}

/* =========================================================
   GET CLIENT BY ID
========================================================= */

export async function getClientById(
  id: string,
): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;
  const list = await attachAssignedCoordinators([data as Record<string, unknown>]);
  return list[0] ?? null;
}

/* =========================================================
   CREATE CLIENT
========================================================= */

export async function createClient(
  input: CreateClientInput,
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name.trim(),

      short_name: input.short_name?.trim() || null,

      contact_person: input.contact_person?.trim() || null,

      email: input.email?.trim() || null,

      phone: input.phone?.trim() || null,

      notes: input.notes?.trim() || null,

      assigned_coordinator_id: input.assigned_coordinator_id || null,

      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const list = await attachAssignedCoordinators([data as Record<string, unknown>]);
  return list[0];
}

/* =========================================================
   UPDATE CLIENT
========================================================= */

export async function updateClient(
  id: string,
  input: UpdateClientInput,
): Promise<Client> {
  const updates: Record<string, unknown> = {
    ...(input.name !== undefined && {
      name: input.name.trim(),
    }),

    ...(input.short_name !== undefined && {
      short_name: input.short_name?.trim() || null,
    }),

    ...(input.contact_person !== undefined && {
      contact_person: input.contact_person?.trim() || null,
    }),

    ...(input.email !== undefined && {
      email: input.email?.trim() || null,
    }),

    ...(input.phone !== undefined && {
      phone: input.phone?.trim() || null,
    }),

    ...(input.notes !== undefined && {
      notes: input.notes?.trim() || null,
    }),

    ...(input.assigned_coordinator_id !== undefined && {
      assigned_coordinator_id: input.assigned_coordinator_id || null,
    }),

    ...(input.is_active !== undefined && {
      is_active: input.is_active,
    }),
  };

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const list = await attachAssignedCoordinators([data as Record<string, unknown>]);
  return list[0];
}

/* =========================================================
   SET CLIENT STATUS
========================================================= */

export async function setClientStatus(
  id: string,
  isActive: boolean,
): Promise<Client> {
  return updateClient(id, {
    is_active: isActive,
  });
}

/* =========================================================
   GET FLOW FORCE COORDINATORS
========================================================= */

export interface CoordinatorOption {
  id: string;
  full_name: string;
  employee_code?: string;
}

export async function getFlowForceCoordinators(): Promise<CoordinatorOption[]> {
  try {
    const [teamsRes, empsRes, profilesRes] = await Promise.all([
      supabase.from("teams").select("id, name, team_type"),
      supabase
        .from("employees")
        .select("id, profile_id, full_name, employee_code, team_id, is_active")
        .order("full_name", { ascending: true }),
      supabase.from("profiles").select("id, role, team_id, is_active"),
    ]);

    if (empsRes.error) {
      throw new Error(empsRes.error.message);
    }

    const rawTeams = (teamsRes.data ?? []) as {
      id: string;
      name?: string | null;
      team_type?: string | null;
    }[];

    const isFlowForceTeam = (t: {
      name?: string | null;
      team_type?: string | null;
    }) => {
      const name = (t.name || "").toLowerCase().trim();
      const type = (t.team_type || "").toLowerCase().trim();
      return (
        type === "flow_force" ||
        type === "project_coordination" ||
        name === "flow force" ||
        name.includes("flow force") ||
        name.includes("project coordinator") ||
        name.includes("coordination") ||
        name.includes("flow")
      );
    };

    const flowTeamIds = new Set(
      rawTeams.filter(isFlowForceTeam).map((t) => t.id),
    );

    let rawProfiles = (profilesRes.data ?? []) as {
      id: string;
      role?: string | null;
      team_id?: string | null;
      is_active?: boolean;
    }[];

    if (profilesRes.error || rawProfiles.length === 0) {
      try {
        const rpcRes = await supabase.rpc("project_people");
        if (!rpcRes.error && rpcRes.data) {
          rawProfiles = rpcRes.data as {
            id: string;
            role?: string | null;
            team_id?: string | null;
            is_active?: boolean;
          }[];
        }
      } catch {
        // Fallback silently if rpc is not available
      }
    }

    const profileMap = new Map<
      string,
      {
        id: string;
        role?: string | null;
        team_id?: string | null;
        is_active?: boolean;
      }
    >();
    for (const p of rawProfiles) {
      profileMap.set(p.id, p);
    }

    const employees = (empsRes.data ?? []) as {
      id: string;
      profile_id?: string | null;
      full_name: string;
      employee_code?: string;
      team_id?: string | null;
      is_active?: boolean;
    }[];

    const flowForceEmployees = employees.filter((e) => {
      // Must be active
      if (e.is_active === false) return false;

      // 1. Employee directly has Flow Force team_id
      if (e.team_id && flowTeamIds.has(e.team_id)) {
        return true;
      }

      // 2. Linked profile matches Flow Force team or coordinator role
      if (e.profile_id && profileMap.has(e.profile_id)) {
        const p = profileMap.get(e.profile_id)!;
        if (p.is_active === false) return false;

        if (p.team_id && flowTeamIds.has(p.team_id)) {
          return true;
        }

        if (p.role === "project_coordinator") {
          return true;
        }

        if (
          flowTeamIds.size > 0 &&
          p.team_id &&
          flowTeamIds.has(p.team_id) &&
          ["associate_lead", "team_lead", "manager", "director"].includes(
            p.role || "",
          )
        ) {
          return true;
        }
      }

      // 3. Fallback: if no teams matched Flow Force criteria
      if (flowTeamIds.size === 0) {
        if (
          e.profile_id &&
          profileMap.get(e.profile_id)?.role === "project_coordinator"
        ) {
          return true;
        }
        const lowerName = (e.full_name || "").toLowerCase();
        if (
          lowerName.includes("esther") ||
          lowerName.includes("lavanya") ||
          lowerName.includes("muskan")
        ) {
          return true;
        }
      }

      return false;
    });

    return flowForceEmployees.map((e) => ({
      id: e.id,
      full_name: e.full_name,
      employee_code: e.employee_code,
    }));
  } catch (error) {
    console.error("Failed to load Flow Force coordinators:", error);
    return [];
  }
}
