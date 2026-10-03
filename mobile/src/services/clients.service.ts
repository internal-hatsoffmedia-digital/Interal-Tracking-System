import { supabase } from './supabase';
import type { Client, CreateClientInput, UpdateClientInput } from '../types';

export async function getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Unable to load clients: ${error.message}`);
  return (data ?? []) as Client[];
}

export async function createClient(input: CreateClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
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
    .select('*')
    .single();

  if (error) throw new Error(`Unable to create client: ${error.message}`);
  return data as Client;
}

export async function updateClient(id: string, input: UpdateClientInput): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Unable to update client: ${error.message}`);
  return data as Client;
}
