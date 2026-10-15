import { useState } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useWorkspace } from '@/features/workspaces/WorkspaceContext';
import { authService } from '@/features/auth/authService';
import { TeamsSettings } from '@/features/teams/components/TeamsSettings';

export function WorkspaceDashboard() {
  const { user } = useAuth();
  const { workspace, loading } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'overview' | 'teams'>('overview');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 animate-pulse">Загрузка данных...</div>;
  }

  if (!workspace || !workspace.id || !user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Воркспейс не найден.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <h1 className="text-xl font-bold text-gray-900">{workspace.name}</h1>
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Обзор
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'teams' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Команды и Роли
              </button>
            </nav>
          </div>
          <button 
            onClick={() => authService.logout()}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Выйти
          </button>
        </div>
      </header>
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {activeTab === 'overview' ? (
          <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Настройки организации</h2>
            <p className="text-gray-500 text-sm">
              Добро пожаловать в Quarter Planner! Перейдите во вкладку «Команды и Роли», чтобы создать команды и настроить права доступа.
            </p>
          </div>
        ) : (
          <TeamsSettings workspaceId={workspace.id} currentUserId={user.uid} />
        )}
      </main>
    </div>
  );
}
