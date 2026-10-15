import { useState, useEffect } from 'react';
import { peopleService, PersonWithAllocations, Allocation } from '../peopleService';
import { teamService } from '../teamService';
import { Team, ResourceType } from '@/domain/schemas';
import { UserCircle, Plus, Trash2, ChevronDown, ChevronRight, Share2, CalendarClock } from 'lucide-react';

export function PeopleSettings({ workspaceId }: { workspaceId: string }) {
  const [people, setPeople] = useState<PersonWithAllocations[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [roles, setRoles] = useState<ResourceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});

  // Form states
  const [newName, setNewName] = useState('');
  const [newRoleId, setNewRoleId] = useState('');
  const [newTeamId, setNewTeamId] = useState('');
  
  // Share modal states
  const [sharingPersonId, setSharingPersonId] = useState<string | null>(null);
  const [shareToTeamId, setShareToTeamId] = useState('');
  const [sharePercentage, setSharePercentage] = useState(50);
  const [shareDateStart, setShareDateStart] = useState('');
  const [shareDateEnd, setShareDateEnd] = useState('');

  useEffect(() => {
    Promise.all([
      peopleService.getPeople(workspaceId),
      teamService.getTeams(workspaceId),
      teamService.getResourceTypes(workspaceId)
    ]).then(([pData, tData, rData]) => {
      setPeople(pData);
      setTeams(tData);
      setRoles(rData);
      if (tData.length > 0) {
        setNewTeamId(tData[0].id!);
        setExpandedTeams({ [tData[0].id!]: true });
      }
      if (rData.length > 0) setNewRoleId(rData[0].id!);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  const toggleTeam = (teamId: string) => setExpandedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newTeamId || !newRoleId) return;
    
    const newPerson: Omit<PersonWithAllocations, 'id'> = {
      name: newName.trim(),
      baseCapacityPerWeek: 5,
      homeTeamId: newTeamId,
      primaryResourceTypeId: newRoleId,
      allocations: [{ teamId: newTeamId, percentage: 100 }]
    };

    const id = await peopleService.addPerson(workspaceId, newPerson);
    setPeople([...people, { id, ...newPerson }]);
    setNewName('');
  };

  const handleDeletePerson = async (id: string) => {
    await peopleService.deletePerson(workspaceId, id);
    setPeople(people.filter(p => p.id !== id));
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingPersonId || !shareToTeamId) return;

    const person = people.find(p => p.id === sharingPersonId);
    if (!person) return;

    const newAllocation: Allocation = { 
      teamId: shareToTeamId, 
      percentage: sharePercentage 
    };
    if (shareDateStart) newAllocation.dateStart = shareDateStart;
    if (shareDateEnd) newAllocation.dateEnd = shareDateEnd;

    // Filter out old allocation for this team (if editing) and append new
    const updatedAllocations = [...person.allocations.filter(a => a.teamId !== shareToTeamId), newAllocation];
    
    await peopleService.addPerson(workspaceId, { ...person, allocations: updatedAllocations });
    setPeople(people.map(p => p.id === sharingPersonId ? { ...p, allocations: updatedAllocations } : p));
    
    // Reset modal
    setSharingPersonId(null);
    setShareToTeamId('');
    setSharePercentage(50);
    setShareDateStart('');
    setShareDateEnd('');
  };

  const getRoleName = (id?: string) => roles.find(r => r.id === id)?.name || 'Не задана';
  const getTeamName = (id: string) => teams.find(t => t.id === id)?.name || 'Unknown';

  const formatDates = (start?: string, end?: string) => {
    if (!start && !end) return '';
    return `(${start ? new Date(start).toLocaleDateString('ru') : '...'} - ${end ? new Date(end).toLocaleDateString('ru') : '...'})`;
  };

  if (loading) return <div className="animate-pulse text-gray-500">Загрузка структуры...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-green-500" />
          Сотрудники
        </h3>
      </div>
      
      <form onSubmit={handleAddPerson} className="bg-gray-50 p-4 rounded-md border border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Нанять нового сотрудника</h4>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Имя</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Иван Иванов" className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Компетенция</label>
            <select value={newRoleId} onChange={e => setNewRoleId(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm bg-white">
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Домашняя команда</label>
            <select value={newTeamId} onChange={e => setNewTeamId(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm bg-white">
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button type="submit" disabled={!newName.trim() || roles.length === 0 || teams.length === 0} className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            Добавить
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {teams.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">Сначала создайте команды на вкладке "Команды"</p>
        ) : (
          teams.map(team => {
            const teamPeople = people.filter(p => p.homeTeamId === team.id);
            const isExpanded = expandedTeams[team.id!];

            return (
              <div key={team.id} className="border rounded-md overflow-hidden bg-white">
                <button onClick={() => toggleTeam(team.id!)} className="w-full flex items-center justify-between bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                    <span className="font-medium text-gray-900">{team.name}</span>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full ml-2">{teamPeople.length} чел.</span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="divide-y divide-gray-100">
                    {teamPeople.length === 0 ? (
                      <div className="px-4 py-4 text-sm text-gray-500 text-center">В этой команде пока нет сотрудников</div>
                    ) : (
                      teamPeople.map(person => (
                        <div key={person.id} className="px-4 py-3 flex justify-between items-start hover:bg-gray-50 group">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{person.name}</span>
                              <span className="text-xs text-blue-700 bg-blue-50 px-1.5 rounded border border-blue-100">
                                {getRoleName(person.primaryResourceTypeId)}
                              </span>
                            </div>
                            
                            {person.allocations.length > 1 && (
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {person.allocations.map((alloc, i) => (
                                  <div key={i} className={`flex items-center text-[11px] px-1.5 py-0.5 rounded ${alloc.teamId === team.id ? 'text-gray-600 bg-gray-100' : 'text-purple-700 bg-purple-50 border border-purple-100'}`}>
                                    <span className="font-medium mr-1">
                                      {alloc.teamId === team.id ? 'Домашняя: ' : `${getTeamName(alloc.teamId)}: `} {alloc.percentage}%
                                    </span>
                                    {(alloc.dateStart || alloc.dateEnd) && (
                                      <span className="flex items-center gap-1 text-purple-600 ml-1 opacity-80" title="Временная аллокация">
                                        <CalendarClock className="w-3 h-3" />
                                        {formatDates(alloc.dateStart, alloc.dateEnd)}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setSharingPersonId(person.id!)} className="text-gray-400 hover:text-blue-600 p-1 title-tooltip" title="Выделить ресурс">
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => person.id && handleDeletePerson(person.id)} className="text-gray-400 hover:text-red-600 p-1" title="Уволить">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {sharingPersonId && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h4 className="font-medium text-lg mb-1">Шеринг ресурса</h4>
            <p className="text-xs text-gray-500 mb-4">Выделите % времени сотрудника в другую команду. Укажите даты для временного шеринга.</p>
            
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Команда-получатель</label>
                <select value={shareToTeamId} onChange={e => setShareToTeamId(e.target.value)} className="w-full rounded border px-2 py-2 text-sm bg-white focus:ring-blue-500 focus:border-blue-500">
                  <option value="" disabled>Выберите команду...</option>
                  {teams.filter(t => t.id !== people.find(p=>p.id===sharingPersonId)?.homeTeamId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Процент времени (%)</label>
                <input type="number" min="1" max="100" value={sharePercentage} onChange={e => setSharePercentage(Number(e.target.value))} className="w-full rounded border px-2 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">С даты (необяз.)</label>
                  <input type="date" value={shareDateStart} onChange={e => setShareDateStart(e.target.value)} className="w-full rounded border px-2 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">По дату (необяз.)</label>
                  <input type="date" value={shareDateEnd} onChange={e => setShareDateEnd(e.target.value)} className="w-full rounded border px-2 py-2 text-sm focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setSharingPersonId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md">Отмена</button>
                <button type="submit" disabled={!shareToTeamId} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">Выделить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
