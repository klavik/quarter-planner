import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { planningService } from '../planningService';
import { PlanningPeriod } from '@/domain/schemas';
import { CalendarRange, Plus } from 'lucide-react';

export function PeriodsSettings({ workspaceId }: { workspaceId: string }) {
  const [periods, setPeriods] = useState<PlanningPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [name, setName] = useState('Q4 2026');
  const [dateStart, setDateStart] = useState('2026-10-01');
  const [dateEnd, setDateEnd] = useState('2026-12-31');

  useEffect(() => {
    planningService.getPeriods(workspaceId).then(setPeriods).finally(() => setLoading(false));
  }, [workspaceId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !dateStart || !dateEnd) return;
    
    const newPeriod = { name: name.trim(), dateStart, dateEnd };
    const id = await planningService.createPeriod(workspaceId, newPeriod);
    setPeriods([...periods, { id, ...newPeriod }].sort((a, b) => a.dateStart.localeCompare(b.dateStart)));
  };

  if (loading) return <div className="animate-pulse text-gray-500">Загрузка кварталов...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <CalendarRange className="w-5 h-5 text-indigo-500" /> Кварталы (Planning Periods)
        </h3>
      </div>
      
      <form onSubmit={handleAdd} className="bg-indigo-50 p-4 rounded-md border border-indigo-100 space-y-4">
        <h4 className="text-sm font-medium text-indigo-900">Создать новый квартал</h4>
        <div className="grid grid-cols-10 gap-4">
          <div className="col-span-3">
            <label className="block text-xs font-medium text-indigo-800 mb-1">Название</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-indigo-800 mb-1">Начало</label>
            <input type="date" required value={dateStart} onChange={e => setDateStart(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-3">
            <label className="block text-xs font-medium text-indigo-800 mb-1">Конец</label>
            <input type="date" required value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="w-full rounded border px-2 py-1.5 text-sm" />
          </div>
          <div className="col-span-1 flex items-end">
            <button type="submit" className="w-full bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 flex justify-center">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {periods.length === 0 ? (
          <div className="px-4 py-6 text-center border rounded-md text-gray-500 text-sm bg-white">Нет созданных кварталов</div>
        ) : (
          periods.map(period => (
            <div key={period.id} className="border rounded-md bg-white p-4 flex justify-between items-center shadow-sm hover:border-indigo-300 transition-colors">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{period.name}</h4>
                <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                  <span>{new Date(period.dateStart).toLocaleDateString('ru')} — {new Date(period.dateEnd).toLocaleDateString('ru')}</span>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/workspace/${workspaceId}/period/${period.id}`)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-medium rounded-md border border-indigo-100 hover:bg-indigo-100 transition-all"
              >
                Открыть план
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
