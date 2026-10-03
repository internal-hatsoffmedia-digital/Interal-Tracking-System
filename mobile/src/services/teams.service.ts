import { supabase } from './supabase';
import type { Team, CreateTeamInput, UpdateTeamInput } from '../types';

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Unable to load teams: ${error.message}`);
  return (data ?? []) as Team[];
}

export async function createTeam(input: CreateTeamInput): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: input.name,
      team_type: input.team_type,
      description: input.description || null,
      team_lead_id: input.team_lead_id || null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create team: ${error.message}`);
  return data as Team;
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Unable to update team: ${error.message}`);
  return data as Team;
}
