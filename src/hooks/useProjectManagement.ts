import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useProjectManagement() {
  const { profile } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      void supabase.rpc('workspace_access_context').then(({ data, error }) => {
        if (active) setAllowed(!error && data?.can_manage_projects === true);
      });
    };
    load();
    window.addEventListener('focus', load);
    const timer = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [profile?.id, profile?.role, profile?.team_id]);

  const isDirectorOrAdmin = profile?.role === 'admin' || profile?.role === 'director';
  const isProjectCoordinator = profile?.role === 'project_coordinator';
  const isFlowForceCoordinatorLead = profile?.role === 'associate_lead' && allowed;

  return isDirectorOrAdmin || isProjectCoordinator || isFlowForceCoordinatorLead;
}
