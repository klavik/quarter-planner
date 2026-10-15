import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { ArrowLeft, LayoutDashboard, Target, ListTodo, Map, Users } from 'lucide-react';
import { PlanningProvider } from '../PlanningContext';
import { InitiativesTab } from '../components/InitiativesTab';
import { TasksTab } from '../components/TasksTab';
import { TimelineTab } from '../components/TimelineTab';
import { CapacityTab } from '../components/CapacityTab';
import { GoalsTab } from '../components/GoalsTab';
import { PlanningPeriod } from '@/domain/schemas';

const TABS = [
  { id: 'initiatives', label: 'Инициативы', icon: Target },
  { id: 'backlog', label: 'Бэклог задач', icon: ListTodo },
  { id: 'timeline', label: 'Roadmap (Timeline)', icon: Map },
  { id: 'capacity', label: 'Баланс ресурсов (Capacity)', icon: Users },
  { id: 'goals', label: 'Цели', icon: LayoutDashboard }
] as const;

export function PeriodBoard() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Железобетонное получение ID из параметров роутера или напрямую из URL
  const workspaceId = params.workspaceId || params.wsId || location.pathname.match(/workspace\/([^\/]+)/)?.[1] || window.location.hash.match(/workspace\/([^\/]+)/)?.[1];
  const periodId = params.periodId || params.id || location.pathname.match(/period\/([^\/]+)/)?.[1] || window.location.hash.match(/period\/([^\/]+)/)?.[1];

  const [period, setPeriod] = useState<PlanningPeriod | null>(null);
  const [loadingPeriod, setLoadingPeriod] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof TABS[number]['id']>('timeline');

  useEffect(() => {
    if (!workspaceId || !periodId) {
      setLoadingPeriod(false);
      return;
    }

    const fetchPeriod = async () => {
      try {
        // Проверяем классические пути хранения периодов в Firebase
        let snap = await getDoc(doc(db, `workspaces/${workspaceId}/periods/${periodId}`));
        if (!snap.exists()) {
          snap = await getDoc(doc(db, `workspaces/${workspaceId}/planningPeriods/${periodId}`));
        }
        if (!snap.exists()) {
          snap = await getDoc(doc(db, `planningPeriods/${periodId}`));
        }

        if (snap.exists()) {
          setPeriod({ id: snap.id, ...snap.data() } as PlanningPeriod);
        } else {
          console.error("Документ периода не найден в БД");
        }
      } catch (e) {
        console.error("Ошибка загрузки периода:", e);
      } finally {
        setLoadingPeriod(false);
      }
    };

    fetchPeriod();
  }, [workspaceId, periodId]);

  if (loadingPeriod) {
    return <div className="flex h-screen items-center justify-center text-gray-500 font-medium animate-pulse">Загрузка структуры плана...</div>;
  }

  if (!period || !workspaceId) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-gray-50 gap-4">
        <div className="text-red-500 font-medium">План не найден или неверная ссылка</div>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700">
          Вернуться назад
        </button>
      </div>
    );
  }

  return (
    <PlanningProvider workspaceId={workspaceId} period={period}>
      <div className="flex flex-col h-screen bg-white">
        
        <div className="border-b border-gray-200">
          <div className="px-6 py-4 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{period.name}</h1>
              <span className="text-sm text-gray-500">{period.dateStart} — {period.dateEnd}</span>
            </div>
          </div>

          <div className="px-6 flex gap-6">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden bg-gray-50/50">
          {activeTab === 'initiatives' && <InitiativesTab workspaceId={workspaceId} period={period} />}
          {activeTab === 'backlog' && <TasksTab workspaceId={workspaceId} period={period} />}
          {activeTab === 'timeline' && <TimelineTab />}
          {activeTab === 'capacity' && <CapacityTab />}
          {activeTab === 'goals' && <GoalsTab workspaceId={workspaceId} period={period} />}
        </div>
      </div>
    </PlanningProvider>
  );
}

export default PeriodBoard;