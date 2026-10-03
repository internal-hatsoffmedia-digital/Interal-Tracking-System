import { createContext, useContext } from 'react';
import { WorkspaceProfile } from './access';
export const WorkspaceContext = createContext<WorkspaceProfile | null>(null);
export const useWorkspaceProfile = () => useContext(WorkspaceContext);
