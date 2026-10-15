import { useState, useEffect } from 'react';
import { teamService } from '../teamService';
import { ResourceType } from '@/domain/schemas';
import { Briefcase, Plus, Trash2 } from 'lucide-react';

export function ResourceTypesSettings({ workspaceId }: { workspaceId: string }) {
  const [types, setTypes] = useState<ResourceType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    teamService.getResourceTypes(workspaceId).then(setTypes).finally(() => setLoading(false));
  }, [workspaceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const id = await teamService.addResourceType(workspaceId, newTypeName.trim());
    setTypes([...types, { id, name: newTypeName.trim() }]);
    setNewTypeName('');
  };

  const handleDelete = async (id: string) => {
    await teamService.deleteResourceType(workspaceId, id);
    setTypes(types.filter(t => t.id !== id));
  };

  if (loading) return <div className="animate-pulse text-gray-500">Загрузка ролей...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-500" />
          Роли компетенций (Resource Types)
        </h3>
      </div>
      
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          placeholder="Например: Backend, QA, Design"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
        <button type="submit" disabled={!newTypeName.trim()} className="bg-purple-50 text-purple-600 px-4 py-2 rounded-md hover:bg-purple-100 disabled:opacity-50 text-sm font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </form>

      <ul className="divide-y divide-gray-200 border rounded-md">
        {types.length === 0 ? (
          <li className="px-4 py-6 text-center text-gray-500 text-sm">Роли еще не добавлены</li>
        ) : (
          types.map(type => (
            <li key={type.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
              <span className="font-medium text-gray-900">{type.name}</span>
              <button onClick={() => type.id && handleDelete(type.id)} className="text-red-500 hover:text-red-700 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
