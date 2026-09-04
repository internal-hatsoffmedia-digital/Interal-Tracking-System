import { supabase } from "../../lib/supabase";
import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "../../types/team";

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Team[];
}

export async function getActiveTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Team[];
}

export async function createTeam(
  input: CreateTeamInput,
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .insert({
      name: input.name.trim(),
      team_type: input.team_type,
      description: input.description?.trim() || null,
      team_lead_id: input.team_lead_id || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Team;
}

export async function updateTeam(
  id: string,
  input: UpdateTeamInput,
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .update(input)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Team;
}

export async function setTeamStatus(
  id: string,
  isActive: boolean,
): Promise<Team> {
  return updateTeam(id, {
    is_active: isActive,
  });
}