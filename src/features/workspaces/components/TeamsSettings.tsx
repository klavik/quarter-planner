import { useState, useEffect } from 'react';
import { teamService } from '../teamService';
import { Team } from '@/domain/schemas';
import { Users, Plus, Trash2 } from 'lucide-react';

export function TeamsSettings({ workspaceId }: { workspaceId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamService.getTeams(workspaceId).then(setTeams).finally(() => setLoading(false));
  }, [workspaceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const id = await teamService.addTeam(workspaceId, { name: newTeamName.trim() });
    setTeams([...teams, { id, name: newTeamName.trim() }]);
    setNewTeamName('');
  };

  const handleDelete = async (id: string) => {
    await teamService.deleteTeam(workspaceId, id);
    setTeams(teams.filter(t => t.id !== id));
  };

  if (loading) return <div className="animate-pulse text-gray-500">Загрузка команд...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-500" />
          Команды (Teams)
        </h3>
      </div>
      
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          placeholder="Название новой команды"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button type="submit" disabled={!newTeamName.trim()} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>

      <ul className="divide-y divide-gray-200 border rounded-md">
        {teams.length === 0 ? (
          <li className="px-4 py-6 text-center text-gray-500 text-sm">Команды еще не созданы</li>
        ) : (
          teams.map(team => (
            <li key={team.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
              <span className="font-medium text-gray-900">{team.name}</span>
              <button onClick={() => team.id && handleDelete(team.id)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
