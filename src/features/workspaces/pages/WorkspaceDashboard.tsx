import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { workspaceService } from '@/features/workspaces/workspaceService';
import { authService } from '@/features/auth/authService';
import { TeamsSettings } from '../components/TeamsSettings';
import { ResourceTypesSettings } from '../components/ResourceTypesSettings';
import { PeopleSettings } from '../components/PeopleSettings';
import { CalendarSettings } from '../components/CalendarSettings';
import { PeriodsSettings } from '@/features/planning/components/PeriodsSettings';
import { Settings, LogOut, Download } from 'lucide-react';
import { seedDatabase } from '@/firebase/seed';

type Tab = 'periods' | 'teams' | 'roles' | 'people' | 'calendar';

export function WorkspaceDashboard() {
  const { user } = useAuth();
  const { workspace, loading, refreshWorkspace } = useWorkspace();
  const [newWsName, setNewWsName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('periods');

  if (loading) return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newWsName.trim()) return;
    setIsCreating(true);
    try {
      await workspaceService.createWorkspace(user.uid, newWsName.trim());
      await refreshWorkspace();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSeed = async () => {
    if (!user) return;
    setIsSeeding(true);
    try {
      await seedDatabase(user.uid);
      await refreshWorkspace();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSeeding(false);
    }
  };

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Создать Workspace</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" required value={newWsName} onChange={(e) => setNewWsName(e.target.value)} placeholder="Название Workspace" className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none" />
            <button type="submit" disabled={isCreating || isSeeding} className="w-full bg-blue-600 text-white rounded-md py-2 hover:bg-blue-700">Создать</button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">Или загрузить тестовые данные</p>
            <button onClick={handleSeed} disabled={isCreating || isSeeding} className="w-full bg-gray-100 text-gray-700 rounded-md py-2 hover:bg-gray-200 flex items-center justify-center gap-2 font-medium">
              <Download className="w-4 h-4" /> 
              {isSeeding ? 'Загрузка...' : 'Заполнить демо-данными MARS'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-1.5 rounded-md"><Settings className="w-5 h-5" /></div>
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{workspace.name}</h1>
          </div>
          <button onClick={() => authService.logout()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors">
            <LogOut className="w-4 h-4" /> Выйти
          </button>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex gap-8 items-start">
        <div className="w-64 shrink-0 space-y-1 sticky top-8">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">Планирование</h2>
          <button onClick={() => setActiveTab('periods')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'periods' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}>Кварталы (Periods)</button>
          
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-3 px-3">Организация</h2>
          <button onClick={() => setActiveTab('teams')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'teams' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Команды</button>
          <button onClick={() => setActiveTab('roles')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Компетенции (Роли)</button>
          <button onClick={() => setActiveTab('people')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'people' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>Сотрудники (People)</button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'calendar' ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-100'}`}>Календарь и Отпуска</button>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'periods' && <PeriodsSettings workspaceId={workspace.id!} />}
          {activeTab === 'teams' && <TeamsSettings workspaceId={workspace.id!} />}
          {activeTab === 'roles' && <ResourceTypesSettings workspaceId={workspace.id!} />}
          {activeTab === 'people' && <PeopleSettings workspaceId={workspace.id!} />}
          {activeTab === 'calendar' && <CalendarSettings workspaceId={workspace.id!} />}
        </div>
      </main>
    </div>
  );
}
