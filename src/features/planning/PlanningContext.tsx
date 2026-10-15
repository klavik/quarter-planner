import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { taskService } from './taskService';
import { initiativeService } from './initiativeService';
import { teamService } from '@/features/workspaces/teamService';
import { peopleService, PersonWithAllocations } from '@/features/workspaces/peopleService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Task, Initiative, Team, PlanningPeriod } from '@/domain/schemas';

interface ResourceType {
  id: string;
  name: string;
}

interface PlanningContextType {
  workspaceId: string;
  period: PlanningPeriod;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  initiatives: Initiative[];
  setInitiatives: React.Dispatch<React.SetStateAction<Initiative[]>>;
  teams: Team[];
  people: PersonWithAllocations[];
  resourceTypes: ResourceType[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const PlanningContext = createContext<PlanningContextType | undefined>(undefined);

export function PlanningProvider({ 
  workspaceId, 
  period, 
  children 
}: { 
  workspaceId: string; 
  period: PlanningPeriod; 
  children: ReactNode;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [people, setPeople] = useState<PersonWithAllocations[]>([]);
  const [resourceTypes, setResourceTypes] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, iData, tmData, pData, rtSnap] = await Promise.all([
        taskService.getTasks(workspaceId, period.id!),
        initiativeService.getInitiatives(workspaceId, period.id!),
        teamService.getTeams(workspaceId),
        peopleService.getPeople(workspaceId),
        getDocs(collection(db, `workspaces/${workspaceId}/resourceTypes`))
      ]);
      setTasks(tData);
      setInitiatives(iData);
      setTeams(tmData);
      setPeople(pData);
      setResourceTypes(rtSnap.docs.map(d => ({ id: d.id, ...d.data() } as ResourceType)));
    } catch (error) {
      console.error("Ошибка при загрузке данных дашборда:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId && period?.id) {
      fetchData();
    }
  }, [workspaceId, period?.id]);

  return (
    <PlanningContext.Provider value={{
      workspaceId,
      period,
      tasks, setTasks,
      initiatives, setInitiatives,
      teams,
      people,
      resourceTypes,
      loading,
      refreshData: fetchData
    }}>
      {children}
    </PlanningContext.Provider>
  );
}

export function usePlanningContext() {
  const context = useContext(PlanningContext);
  if (context === undefined) {
    throw new Error('usePlanningContext должен использоваться внутри PlanningProvider');
  }
  return context;
}
