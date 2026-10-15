import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { workspaceService } from './workspaceService';
import { Workspace } from '@/domain/schemas';

interface WorkspaceContextType {
  workspace: Workspace | null;
  loading: boolean;
  refreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({ 
  workspace: null, 
  loading: true, 
  refreshWorkspace: async () => {} 
});

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  const loadWorkspace = async () => {
    if (!user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ws = await workspaceService.getUserWorkspace(user.uid);
      setWorkspace(ws);
    } catch (error) {
      console.error("Failed to load workspace:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, [user]);

  return (
    <WorkspaceContext.Provider value={{ workspace, loading, refreshWorkspace: loadWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
};
