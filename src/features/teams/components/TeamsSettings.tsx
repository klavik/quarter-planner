import { useState, useEffect } from 'react';
import { teamService, Team, WorkspaceMember, UserRole } from '../teamService';

interface TeamsSettingsProps {
  workspaceId: string;
  currentUserId: string;
}

export function TeamsSettings({ workspaceId, currentUserId }: TeamsSettingsProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Record<string, WorkspaceMember>>({});

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedTeams = await teamService.getTeams(workspaceId);
      setTeams(fetchedTeams);
      
      const currentMember = await teamService.getMember(workspaceId, currentUserId);
      if (currentMember) {
        setMembers(prev => ({ ...prev, [currentUserId]: currentMember }));
      }
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      await teamService.createTeam(workspaceId, newTeamName.trim());
      setNewTeamName('');
      await loadData();
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      alert('Не удалось создать команду (возможно, недостаточно прав).');
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole, teamId?: string) => {
    try {
      await teamService.setMemberRole(workspaceId, userId, role, teamId);
      await loadData();
      alert('Роль успешно обновлена!');
    } catch (error) {
      console.error('Ошибка обновления роли:', error);
      alert('Не удалось обновить роль.');
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-500">Загрузка команд и ролей...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Управление командами</h3>
        
        <form onSubmit={handleCreateTeam} className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Название новой команды (например, Frontend)"
            value={newTeamName}
            onChange={e => setNewTeamName(e.target.value)}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Создать команду
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {teams.length === 0 ? (
            <p className="text-sm text-gray-500 col-span-full">Команды еще не созданы.</p>
          ) : (
            teams.map(team => (
              <div key={team.id} className="border rounded-md p-4 bg-gray-50">
                <h4 className="font-medium text-gray-900">{team.name}</h4>
                <p className="text-xs text-gray-500 mt-1">ID: {team.id}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Ваши данные и роль в воркспейсе</h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>User ID:</strong> {currentUserId}</p>
          <p><strong>Текущая роль:</strong> <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">{members[currentUserId]?.role || 'Не назначена'}</span></p>
          <p><strong>Привязанная команда:</strong> {members[currentUserId]?.teamId || 'Нет (или полный доступ для Топ-менеджера)'}</p>
        </div>

        <div className="mt-4 pt-4 border-t flex gap-3">
          <button
            onClick={() => handleUpdateRole(currentUserId, 'top_manager')}
            className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-purple-700"
          >
            Стать Топ-менеджером (Admin)
          </button>
          <button
            onClick={() => {
              const teamId = teams[0]?.id;
              if (!teamId) {
                alert('Сначала создайте хотя бы одну команду!');
                return;
              }
              handleUpdateRole(currentUserId, 'team_lead', teamId);
            }}
            className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-green-700"
          >
            Стать Тимлидом первой команды
          </button>
        </div>
      </div>
    </div>
  );
}
