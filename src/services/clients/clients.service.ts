import { supabase } from "../../lib/supabase";

import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../types/client";

async function attachAssignedCoordinators(clients: Record<string, unknown>[]): Promise<Client[]> {
  if (clients.length === 0) return [];

  // Fetch employees to map assigned_coordinator_id
  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, email");

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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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