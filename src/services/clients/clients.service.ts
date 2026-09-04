import { supabase } from "../../lib/supabase";

import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
} from "../../types/client";


/* =========================================================
   GET ALL CLIENTS
========================================================= */

export async function getClients(): Promise<Client[]> {
  const {
    data,
    error,
  } = await supabase
    .from("clients")
    .select("*")
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Client[];
}


/* =========================================================
   GET ACTIVE CLIENTS
========================================================= */

export async function getActiveClients(): Promise<Client[]> {
  const {
    data,
    error,
  } = await supabase
    .from("clients")
    .select("*")
    .eq("is_active", true)
    .order("name", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as Client[];
}


/* =========================================================
   GET CLIENT BY ID
========================================================= */

export async function getClientById(
  id: string,
): Promise<Client | null> {
  const {
    data,
    error,
  } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Client | null;
}


/* =========================================================
   CREATE CLIENT
========================================================= */

export async function createClient(
  input: CreateClientInput,
): Promise<Client> {
  const {
    data,
    error,
  } = await supabase
    .from("clients")
    .insert({
      name: input.name.trim(),

      short_name:
        input.short_name?.trim() ||
        null,

      contact_person:
        input.contact_person?.trim() ||
        null,

      email:
        input.email?.trim() ||
        null,

      phone:
        input.phone?.trim() ||
        null,

      notes:
        input.notes?.trim() ||
        null,

      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Client;
}


/* =========================================================
   UPDATE CLIENT
========================================================= */

export async function updateClient(
  id: string,
  input: UpdateClientInput,
): Promise<Client> {
  const updates = {
    ...(input.name !== undefined && {
      name: input.name.trim(),
    }),

    ...(input.short_name !== undefined && {
      short_name:
        input.short_name?.trim() ||
        null,
    }),

    ...(input.contact_person !== undefined && {
      contact_person:
        input.contact_person?.trim() ||
        null,
    }),

    ...(input.email !== undefined && {
      email:
        input.email?.trim() ||
        null,
    }),

    ...(input.phone !== undefined && {
      phone:
        input.phone?.trim() ||
        null,
    }),

    ...(input.notes !== undefined && {
      notes:
        input.notes?.trim() ||
        null,
    }),

    ...(input.is_active !== undefined && {
      is_active: input.is_active,
    }),
  };


  const {
    data,
    error,
  } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Client;
}


/* =========================================================
   SET CLIENT STATUS
========================================================= */

export async function setClientStatus(
  id: string,
  isActive: boolean,
): Promise<Client> {
  return updateClient(
    id,
    {
      is_active: isActive,
    },
  );
}