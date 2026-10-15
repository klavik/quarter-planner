import { useState, useMemo } from 'react';
import { PlanningPeriod } from '@/domain/schemas';
import { AlertCircle, Users, TrendingUp, CheckCircle2 } from 'lucide-react';
import { usePlanningContext } from '../PlanningContext';

interface Interval {
  id: string;
  label: string;
  monthName: string;
  dateStart: string;
  dateEnd: string;
  workingDays: number;
}

export function CapacityTab({ workspaceId: _w, period: _p }: { workspaceId?: string, period?: PlanningPeriod }) {
  const { period, tasks, teams, people, resourceTypes, loading } = usePlanningContext();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  const intervals = useMemo<Interval[]>(() => {
    const result: Interval[] = [];
    const start = new Date(period.dateStart + 'T00:00:00');
    const end = new Date(period.dateEnd + 'T00:00:00');
    let curr = new Date(start.getFullYear(), start.getMonth(), 1);
    let idCounter = 1;

    while (curr <= end) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const monthName = curr.toLocaleDateString('ru-RU', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      const h1Start = new Date(year, month, 1);
      const h1End = new Date(year, month, 15);
      const h2Start = new Date(year, month, 16);
      const h2End = new Date(year, month + 1, 0);

      if (h1End >= start && h1Start <= end) {
        result.push({
          id: `interval-${idCounter++}`, label: '1-я пол.', monthName: capitalizedMonth,
          dateStart: h1Start < start ? period.dateStart : h1Start.toISOString().split('T')[0],
          dateEnd: h1End > end ? period.dateEnd : h1End.toISOString().split('T')[0],
          workingDays: 10 
        });
      }
      if (h2End >= start && h2Start <= end) {
        result.push({
          id: `interval-${idCounter++}`, label: '2-я пол.', monthName: capitalizedMonth,
          dateStart: h2Start < start ? period.dateStart : h2Start.toISOString().split('T')[0],
          dateEnd: h2End > end ? period.dateEnd : h2End.toISOString().split('T')[0],
          workingDays: 11
        });
      }
      curr.setMonth(curr.getMonth() + 1);
    }
    return result;
  }, [period.dateStart, period.dateEnd]);

  const monthsMap = intervals.reduce((acc, inv) => {
    if (!acc[inv.monthName]) acc[inv.monthName] = [];
    acc[inv.monthName].push(inv);
    return acc;
  }, {} as Record<string, Interval[]>);

  const capacityData = useMemo(() => {
    const data: Record<string, { totalCapacity: number, totalDemand: number, intervals: Record<string, { capacity: number, demand: number }> }> = {};

    resourceTypes.forEach(rt => {
      data[rt.id] = { totalCapacity: 0, totalDemand: 0, intervals: {} };
      
      const peopleWithRole = people.filter(p => 
        (selectedTeam === 'all' || p.teamIds?.includes(selectedTeam)) && 
        p.defaultRoleId === rt.id
      );

      intervals.forEach(inv => {
        const availableDays = peopleWithRole.length * inv.workingDays;
        let plannedDays = 0;

        const activeTasks = tasks.filter(t => {
          if (selectedTeam !== 'all' && t.teamId !== selectedTeam) return false;
          if (!t.dateStart || !t.dateEnd) return false;
          return (t.dateStart <= inv.dateEnd && t.dateEnd >= inv.dateStart);
        });

        activeTasks.forEach(t => {
          const effort = Number(t.estimates?.[rt.id] || 0);
          if (effort > 0) plannedDays += effort; 
        });

        data[rt.id].intervals[inv.id] = { capacity: availableDays, demand: plannedDays };
        data[rt.id].totalCapacity += availableDays;
        data[rt.id].totalDemand += plannedDays;
      });
    });

    return data;
  }, [resourceTypes, people, tasks, intervals, selectedTeam]);

  const getHeatmapColor = (capacity: number, demand: number) => {
    if (capacity === 0 && demand === 0) return 'bg-gray-50 text-gray-400';
    if (capacity === 0 && demand > 0) return 'bg-red-100 text-red-800 font-bold border-red-300';
    
    const ratio = demand / capacity;
    if (ratio === 0) return 'bg-gray-50 text-gray-500';
    if (ratio <= 0.8) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (ratio <= 1.0) return 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
    return 'bg-red-100 text-red-800 font-bold border-red-300';
  };

  if (loading) return <div className="animate-pulse text-gray-500 p-6">Загрузка данных Capacity...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-30 shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Баланс ресурсов (Capacity vs Demand)
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Оценка загрузки ролей в человеко-днях по периодам.</p>
          </div>
          <div className="h-8 w-px bg-gray-200 mx-2" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Фильтр:</span>
            <select 
              value={selectedTeam} 
              onChange={e => setSelectedTeam(e.target.value)} 
              className="rounded-md border-gray-300 px-3 py-1.5 text-sm bg-gray-50 focus:bg-white font-medium text-gray-800 shadow-sm"
            >
              <option value="all">Все команды</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300" /> Ок (до 80%)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" /> Плотная (80-100%)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-100 border border-red-300" /> Перегруз (&gt;100%)</div>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-50/50 p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 w-64 sticky left-0 z-20">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Роль (Специализация)</div>
                </th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-3 w-32 text-center">
                  <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Всего (Квартал)</div>
                </th>
                {Object.entries(monthsMap).map(([monthName, invs]) => (
                  <th key={monthName} colSpan={invs.length} className="border-b border-r border-gray-200 bg-indigo-50/30 p-2 text-center">
                    <div className="text-sm font-bold text-indigo-900">{monthName}</div>
                  </th>
                ))}
              </tr>
              <tr>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-2 sticky left-0 z-20"></th>
                <th className="border-b border-r border-gray-200 bg-gray-50 p-2 text-center">
                  <div className="text-[10px] text-gray-500">Спрос / Емкость</div>
                </th>
                {intervals.map(inv => (
                  <th key={inv.id} className="border-b border-r border-gray-200 bg-gray-50 p-2 text-center min-w-[120px]">
                    <div className="text-xs font-semibold text-gray-700">{inv.label}</div>
                    <div className="text-[10px] text-gray-400 font-normal">{inv.workingDays} раб. дней</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resourceTypes.map(rt => {
                const rowData = capacityData[rt.id];
                return (
                  <tr key={rt.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="border-b border-r border-gray-100 p-3 sticky left-0 bg-white group-hover:bg-gray-50/50 z-10">
                      <div className="font-semibold text-sm text-gray-900">{rt.name}</div>
                    </td>
                    <td className="border-b border-r border-gray-100 p-2 text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <div className="text-sm font-bold text-gray-900">{rowData.totalDemand} <span className="text-xs text-gray-400 font-normal">/ {rowData.totalCapacity}</span></div>
                        {rowData.totalDemand > rowData.totalCapacity ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded"><AlertCircle className="w-3 h-3" /> Перегруз</span>
                        ) : rowData.totalCapacity > 0 ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded"><CheckCircle2 className="w-3 h-3" /> В норме</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">Нет ресурса</span>
                        )}
                      </div>
                    </td>
                    {intervals.map(inv => {
                      const cell = rowData.intervals[inv.id];
                      const colorClass = getHeatmapColor(cell.capacity, cell.demand);
                      return (
                        <td key={inv.id} className="border-b border-r border-gray-100 p-2">
                          <div className={`flex flex-col items-center justify-center p-2 rounded-lg border ${colorClass} transition-all`}>
                            <div className="text-sm">{cell.demand > 0 ? cell.demand : '-'} <span className="opacity-50 text-xs ml-1">/ {cell.capacity}</span></div>
                            {cell.demand > cell.capacity && cell.capacity > 0 && (
                              <div className="text-[9px] mt-0.5 flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +{cell.demand - cell.capacity} дн.</div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
