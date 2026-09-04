export interface Client {
  id: string;
  name: string;
  short_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface CreateClientInput {
  name: string;
  short_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}
export interface UpdateClientInput {
  name?: string;
  short_name?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
  is_active?: boolean;
}
