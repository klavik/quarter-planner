import { useState, useEffect } from 'react';
import { calendarService, Absence } from '../calendarService';
import { peopleService, PersonWithAllocations } from '../peopleService';
import { CalendarDays, Plus, Trash2, Globe, User } from 'lucide-react';

export function CalendarSettings({ workspaceId }: { workspaceId: string }) {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [people, setPeople] = useState<PersonWithAllocations[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [personId, setPersonId] = useState<string>('GLOBAL');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    Promise.all([
      calendarService.getAbsences(workspaceId),
      peopleService.getPeople(workspaceId)
    ]).then(([aData, pData]) => {
      setAbsences(aData.sort((a, b) => b.dateStart.localeCompare(a.dateStart)));
      setPeople(pData);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dateStart || !dateEnd) return;
    
    if (dateStart > dateEnd) {
      alert("Дата начала не может быть позже даты окончания");
      return;
    }

    const newAbsence: Omit<Absence, 'id'> = {
      title: title.trim(),
      personId: personId === 'GLOBAL' ? null : personId,
      dateStart,
      dateEnd
    };

    const id = await calendarService.addAbsence(workspaceId, newAbsence);
    setAbsences([...absences, { id, ...newAbsence }].sort((a, b) => b.dateStart.localeCompare(a.dateStart)));
    
    setTitle('');
    setDateStart('');
    setDateEnd('');
  };

  const handleDelete = async (id: string) => {
    await calendarService.deleteAbsence(workspaceId, id);
    setAbsences(absences.filter(a => a.id !== id));
  };

  const getPersonName = (id: string | null) => {
    if (!id) return 'Все (Глобальный праздник)';
    return people.find(p => p.id === id)?.name || 'Неизвестный сотрудник';
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('ru-RU');

  if (loading) return <div className="animate-pulse text-gray-500">Загрузка календаря...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-orange-500" />
          Календарь (Праздники и Отпуска)
        </h3>
      </div>
      
      <form onSubmit={handleAdd} className="bg-orange-50 p-4 rounded-md border border-orange-100 space-y-4">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3">
            <label className="block text-xs font-medium text-orange-800 mb-1">Событие / Причина</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Новый Год" className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-orange-800 mb-1">Кого касается?</label>
            <select value={personId} onChange={e => setPersonId(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm bg-white">
              <option value="GLOBAL">🌍 Все (Глобальный праздник)</option>
              <optgroup label="Отпуск сотрудника">
                {people.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </optgroup>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-orange-800 mb-1">С даты</label>
            <input type="date" required value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-orange-800 mb-1">По дату</label>
            <input type="date" required value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-2 flex items-end">
            <button type="submit" className="w-full bg-orange-600 text-white px-2 py-1.5 rounded text-sm font-medium hover:bg-orange-700 flex justify-center items-center gap-1">
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
        </div>
      </form>

      <ul className="divide-y divide-gray-200 border rounded-md bg-white">
        {absences.length === 0 ? (
          <li className="px-4 py-6 text-center text-gray-500 text-sm">В календаре пока нет событий</li>
        ) : (
          absences.map(absence => (
            <li key={absence.id} className="px-4 py-3 flex justify-between items-center hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {absence.personId ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600" title="Личный отпуск">
                      <User className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600" title="Глобальный праздник">
                      <Globe className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{absence.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    <span className={!absence.personId ? 'font-semibold text-orange-700' : ''}>
                      {getPersonName(absence.personId)}
                    </span>
                    <span className="mx-2">•</span>
                    {formatDate(absence.dateStart)} — {formatDate(absence.dateEnd)}
                  </div>
                </div>
              </div>
              <button onClick={() => absence.id && handleDelete(absence.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
