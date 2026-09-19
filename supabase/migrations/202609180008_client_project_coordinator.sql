-- Add assigned_coordinator_id column to public.clients
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS assigned_coordinator_id uuid REFERENCES public.employees(id);

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_clients_assigned_coordinator_id ON public.clients(assigned_coordinator_id);
