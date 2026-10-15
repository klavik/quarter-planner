import { useState, useMemo, useRef } from 'react';
import { taskService } from '../taskService';
import { Task, TaskStatus } from '@/domain/schemas';
import { Plus, CalendarDays, Filter, FileText, Users2, GripVertical, ChevronDown, ListTodo, Target, AlertCircle } from 'lucide-react';
import { usePlanningContext } from '../PlanningContext';

interface Interval {
  id: string;
  label: string;
  monthName: string;
  dateStart: string;
  dateEnd: string;
}

export function TimelineTab() {
  const { workspaceId, period, tasks, setTasks, initiatives, teams, resourceTypes, loading } = usePlanningContext();

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [showBacklog, setShowBacklog] = useState(false);
  const [isOverBacklog, setIsOverBacklog] = useState(false);
  const [hoveredIntervalId, setHoveredIntervalId] = useState<string | null>(null);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTeamId, setNewTaskTeamId] = useState('');
  const [newTaskInitId, setNewTaskInitId] = useState('');
  const [quickAddSubmitted, setQuickAddSubmitted] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const initSelectRef = useRef<HTMLSelectElement>(null);
  const teamSelectRef = useRef<HTMLSelectElement>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [tooltip, setTooltip] = useState<{ task: Task; x: number; y: number } | null>(null);

  const [resizing, setResizing] = useState<{ taskId: string; edge: 'start' | 'end' } | null>(null);
  const [movingTask, setMovingTask] = useState<{ taskId: string; startX: number; initialStart: string; initialEnd: string } | null>(null);
  const isTaskDraggingRef = useRef(false);

  const [draggingSegment, setDraggingSegment] = useState<{ taskId: string; roleId: string; startX: number; initialOffset: number; taskDurationDays: number; barWidthPx: number; val: number } | null>(null);
  const isSegmentDraggingRef = useRef(false);

  const [segmentEditor, setSegmentEditor] = useState<{ taskId: string; roleId: string; x: number; y: number; val: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const backlogPanelRef = useRef<HTMLDivElement>(null);
  const backlogBtnRef = useRef<HTMLButtonElement>(null);
  const [draggedRole, setDraggedRole] = useState<{ taskId: string; roleId: string } | null>(null);

  const unplannedTasks = useMemo(() => tasks.filter(t => !t.dateStart || !t.dateEnd), [tasks]);

  const unplanTask = async (taskId: string) => {
    if (!period?.id) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) return { ...t, dateStart: '', dateEnd: '' };
      return t;
    }));
    await taskService.updateTask(workspaceId, period.id, taskId, { dateStart: '', dateEnd: '' });
  };

  const isCursorOverBacklog = (clientX: number, clientY: number) => {
    if (backlogPanelRef.current) {
      const r = backlogPanelRef.current.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return true;
    }
    if (backlogBtnRef.current) {
      const r = backlogBtnRef.current.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return true;
    }
    return false;
  };

  const days = useMemo(() => {
    const d = [];
    if (!period?.dateStart || !period?.dateEnd) return d;
    const curr = new Date(period.dateStart + 'T00:00:00');
    const end = new Date(period.dateEnd + 'T00:00:00');
    while (curr <= end) {
      d.push({ dateStr: curr.toISOString().split('T')[0], dateObj: new Date(curr) });
      curr.setDate(curr.getDate() + 1);
    }
    return d;
  }, [period?.dateStart, period?.dateEnd]);

  const intervals = useMemo<Interval[]>(() => {
    const result: Interval[] = [];
    if (!period?.dateStart || !period?.dateEnd) return result;
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
          dateEnd: h1End > end ? period.dateEnd : h1End.toISOString().split('T')[0]
        });
      }
      if (h2End >= start && h2Start <= end) {
        result.push({
          id: `interval-${idCounter++}`, label: '2-я пол.', monthName: capitalizedMonth,
          dateStart: h2Start < start ? period.dateStart : h2Start.toISOString().split('T')[0],
          dateEnd: h2End > end ? period.dateEnd : h2End.toISOString().split('T')[0]
        });
      }
      curr.setMonth(curr.getMonth() + 1);
    }
    return result;
  }, [period?.dateStart, period?.dateEnd]);

  const getIntervalAtClientX = (clientX: number): Interval | null => {
    if (!gridRef.current || days.length === 0 || intervals.length === 0) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(0.999, (clientX - rect.left) / rect.width));
    const dayIdx = Math.floor(pct * days.length);
    const dateStr = days[dayIdx]?.dateStr;
    return intervals.find(inv => dateStr >= inv.dateStart && dateStr <= inv.dateEnd) || intervals[0];
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskInitId || !newTaskTeamId) {
      setQuickAddSubmitted(true);
      if (!newTaskTitle.trim()) titleInputRef.current?.focus();
      else if (!newTaskInitId) initSelectRef.current?.focus();
      else if (!newTaskTeamId) teamSelectRef.current?.focus();
      return;
    }
    if (!period?.id) return;
    const newTask: Omit<Task, 'id'> = {
      title: newTaskTitle.trim(), initiativeId: newTaskInitId, teamId: newTaskTeamId,
      status: 'planned', estimates: {},
      dateStart: intervals[0]?.dateStart, dateEnd: intervals[0]?.dateEnd,
      createdAt: new Date().toISOString()
    };
    const id = await taskService.addTask(workspaceId, period.id, newTask);
    setTasks(prev => [...prev, { id, ...newTask }]);
    setNewTaskTitle('');
    setQuickAddSubmitted(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (resizing && gridRef.current) {
      const rect = gridRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const dayIndex = Math.floor(percentage * days.length);
      const clampedIndex = Math.max(0, Math.min(days.length - 1, dayIndex));
      const newDate = days[clampedIndex].dateStr;

      setTasks(prev => prev.map(t => {
        if (t.id === resizing.taskId) {
          let start = t.dateStart || newDate;
          let end = t.dateEnd || newDate;
          if (resizing.edge === 'start') {
            start = newDate;
            if (start > end) end = start;
          } else {
            end = newDate;
            if (end < start) start = end;
          }
          return { ...t, dateStart: start, dateEnd: end };
        }
        return t;
      }));
      return;
    }

    if (movingTask && gridRef.current) {
      const deltaX = e.clientX - movingTask.startX;
      if (Math.abs(deltaX) > 3) isTaskDraggingRef.current = true;

      if (isTaskDraggingRef.current) {
        const overBacklog = isCursorOverBacklog(e.clientX, e.clientY);
        setIsOverBacklog(overBacklog);

        if (!overBacklog) {
          const rect = gridRef.current.getBoundingClientRect();
          const daysPerPixel = days.length / rect.width;
          const deltaDays = Math.round(deltaX * daysPerPixel);
          const startIdx = Math.max(0, days.findIndex(d => d.dateStr === movingTask.initialStart));
          const endIdx = Math.max(0, days.findIndex(d => d.dateStr === movingTask.initialEnd));
          const duration = endIdx - startIdx;

          let newStartIdx = startIdx + deltaDays;
          if (newStartIdx < 0) newStartIdx = 0;
          if (newStartIdx + duration >= days.length) newStartIdx = days.length - 1 - duration;

          const newStartStr = days[newStartIdx]?.dateStr;
          const newEndStr = days[newStartIdx + duration]?.dateStr;

          if (newStartStr && newEndStr) {
            setTasks(prev => prev.map(t => {
              if (t.id === movingTask.taskId) return { ...t, dateStart: newStartStr, dateEnd: newEndStr };
              return t;
            }));
          }
        }
      }
      return;
    }

    if (draggingSegment) {
      const deltaX = e.clientX - draggingSegment.startX;
      if (Math.abs(deltaX) > 3) isSegmentDraggingRef.current = true;

      if (isSegmentDraggingRef.current) {
        const daysPerPixel = draggingSegment.taskDurationDays / draggingSegment.barWidthPx;
        const deltaDays = Math.round(deltaX * daysPerPixel);
        const newOffset = Math.max(0, Math.min(draggingSegment.taskDurationDays - 1, draggingSegment.initialOffset + deltaDays));

        setTasks(prev => prev.map(t => {
          if (t.id === draggingSegment.taskId) {
            const currentOffsets = (t as any).resourceOffsets || {};
            return { ...t, resourceOffsets: { ...currentOffsets, [draggingSegment.roleId]: newOffset } };
          }
          return t;
        }));
      }
    }
  };

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!period?.id) return;

    if (resizing) {
      const task = tasks.find(t => t.id === resizing.taskId);
      setResizing(null);
      if (task) await taskService.updateTask(workspaceId, period.id, task.id!, { dateStart: task.dateStart, dateEnd: task.dateEnd });
      return;
    }

    if (movingTask) {
      const task = tasks.find(t => t.id === movingTask.taskId);
      const droppedInBacklog = isTaskDraggingRef.current && isCursorOverBacklog(e.clientX, e.clientY);
      setMovingTask(null);
      setIsOverBacklog(false);

      if (droppedInBacklog && task?.id) {
        await unplanTask(task.id);
      } else if (isTaskDraggingRef.current && task) {
        await taskService.updateTask(workspaceId, period.id, task.id!, { dateStart: task.dateStart, dateEnd: task.dateEnd });
      } else if (!isTaskDraggingRef.current && task) {
        setEditingTask(task);
      }
      return;
    }

    if (draggingSegment) {
      if (!isSegmentDraggingRef.current && e.type === 'mouseup') {
        setTooltip(null);
        setSegmentEditor({ taskId: draggingSegment.taskId, roleId: draggingSegment.roleId, x: e.clientX, y: e.clientY + 15, val: draggingSegment.val });
        setDraggingSegment(null);
        return;
      }
      const task = tasks.find(t => t.id === draggingSegment.taskId);
      setDraggingSegment(null);
      if (task) await taskService.updateTask(workspaceId, period.id, task.id!, { resourceOffsets: (task as any).resourceOffsets } as any);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!period?.id) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) return { ...t, status: newStatus };
      return t;
    }));
    await taskService.updateTaskStatus(workspaceId, period.id, taskId, newStatus);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !period?.id) return;
    if (!editingTask.title.trim() || !editingTask.initiativeId || !editingTask.teamId) return;

    const payload = {
      title: editingTask.title.trim(),
      description: editingTask.description || '',
      initiativeId: editingTask.initiativeId,
      teamId: editingTask.teamId,
      dateStart: editingTask.dateStart || '',
      dateEnd: editingTask.dateEnd || '',
      estimates: editingTask.estimates || {},
      resourceOffsets: (editingTask as any).resourceOffsets || {}
    };
    setTasks(prev => prev.map(t => {
      if (t.id === editingTask.id) return { ...t, ...payload };
      return t;
    }));
    await taskService.updateTask(workspaceId, period.id, editingTask.id!, payload);
    setEditingTask(null);
  };

  const handleSegmentDrop = async (task: Task, targetRoleId: string) => {
    if (!draggedRole || draggedRole.taskId !== task.id || !period?.id) return;
    const sourceRoleId = draggedRole.roleId;
    if (sourceRoleId === targetRoleId) return;

    const estimatesEntries = Object.entries(task.estimates || {}).filter(([_, val]) => Number(val) > 0);
    const currentIds = estimatesEntries.map(([id]) => id);
    const existingOrder = (task as any).roleOrder || currentIds;
    const fullOrder = [...new Set([...existingOrder, ...currentIds])];
    const fromIdx = fullOrder.indexOf(sourceRoleId);
    const toIdx = fullOrder.indexOf(targetRoleId);

    if (fromIdx !== -1 && toIdx !== -1) {
      const newOrder = [...fullOrder];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      const updatedTask = { ...task, roleOrder: newOrder };
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) return updatedTask;
        return t;
      }));
      await taskService.updateTask(workspaceId, period.id, task.id!, { roleOrder: newOrder } as any);
    }
    setDraggedRole(null);
  };

  const getBarStyle = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return null;
    const startIndex = days.findIndex(d => d.dateStr === startStr);
    const endIndex = days.findIndex(d => d.dateStr === endStr);
    if (startIndex === -1 || endIndex === -1 || days.length === 0) return null;
    const leftPct = (startIndex / days.length) * 100;
    const widthPct = ((endIndex - startIndex + 1) / days.length) * 100;
    return { left: `${leftPct}%`, width: `${Math.max(1, widthPct)}%` };
  };

  const getTaskColor = (status: TaskStatus) => {
    switch (status) {
      case 'planned': return 'bg-[#ffffcc] border-[#e6e6b8] text-gray-900';
      case 'in_progress': return 'bg-[#cce0ff] border-[#99c2ff] text-gray-900';
      case 'completed': return 'bg-[#c1f0c1] border-[#99cc99] text-gray-900';
      case 'cancelled': return 'bg-[#ffd9b3] border-[#e6b380] text-gray-900';
      case 'failed': return 'bg-[#ff6666] border-[#cc0000] text-white';
      default: return 'bg-gray-200 border-gray-300 text-gray-900';
    }
  };

  const teamLanes = useMemo(() => {
    const activeTeams = selectedTeamFilter === 'all' ? teams : teams.filter(t => t.id === selectedTeamFilter);
    return activeTeams.map(team => {
      const plannedTeamTasks = tasks.filter(t => t.teamId === team.id && Boolean(t.dateStart && t.dateEnd));
      const teamInitiativeIds = Array.from(new Set(plannedTeamTasks.map(t => t.initiativeId)));
      const teamInitiatives = initiatives.filter(i => teamInitiativeIds.includes(i.id!));
      return {
        ...team,
        initiatives: teamInitiatives.map(init => ({
          ...init,
          tasks: plannedTeamTasks.filter(t => t.initiativeId === init.id)
        }))
      };
    }).filter(lane => lane.initiatives?.length > 0);
  }, [teams, initiatives, tasks, selectedTeamFilter]);

  if (loading) return <div className="animate-pulse text-gray-500 p-6">Загрузка Roadmap...</div>;

  const approvedInits = (initiatives || []).filter(i => i.status === 'approved' || i.status === 'approved_no_resources');
  const monthsMap = intervals.reduce((acc, inv) => {
    if (!acc[inv.monthName]) acc[inv.monthName] = [];
    acc[inv.monthName].push(inv);
    return acc;
  }, {} as Record<string, Interval[]>);

  let overlayCursor = 'cursor-default';
  if (resizing) overlayCursor = 'cursor-col-resize';
  else if (movingTask) overlayCursor = 'cursor-grabbing';
  else if (draggingSegment) overlayCursor = 'cursor-ew-resize';

  const shouldHighlightQuickAdd = quickAddSubmitted || newTaskTitle.trim().length > 0;
  const isTitleMissing = quickAddSubmitted && !newTaskTitle.trim();
  const isInitMissing = shouldHighlightQuickAdd && !newTaskInitId;
  const isTeamMissing = shouldHighlightQuickAdd && !newTaskTeamId;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm relative">
      {(resizing || draggingSegment || movingTask) && (
        <div className={`absolute inset-0 z-[150] ${overlayCursor}`} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
      )}

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-30 shrink-0 gap-4 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Команда:</span>
            <select value={selectedTeamFilter} onChange={e => setSelectedTeamFilter(e.target.value)} className="rounded border px-2 py-1 text-xs bg-gray-50 focus:bg-white font-medium text-gray-800">
              <option value="all">Все команды</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <div className="h-6 w-px bg-gray-300" />

          <button
            ref={backlogBtnRef}
            onClick={() => setShowBacklog(!showBacklog)}
            onDragOver={e => {
              if (e.dataTransfer.types.includes('application/unplan-task-id')) {
                e.preventDefault();
                setIsOverBacklog(true);
              }
            }}
            onDragLeave={() => setIsOverBacklog(false)}
            onDrop={async e => {
              const id = e.dataTransfer.getData('application/unplan-task-id');
              setIsOverBacklog(false);
              if (id) {
                e.preventDefault();
                await unplanTask(id);
              }
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border flex items-center gap-1.5 transition-all shadow-sm ${
              isOverBacklog ? 'bg-red-50 border-red-400 text-red-700 ring-2 ring-red-300 scale-105' : showBacklog ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            {isOverBacklog ? 'Отпустите для возврата в бэклог' : 'Бэклог'}
            {unplannedTasks.length > 0 && <span className="bg-indigo-600 text-white px-1.5 py-0.5 rounded-full text-[9px] leading-none">{unplannedTasks.length}</span>}
          </button>
        </div>

        <form onSubmit={handleQuickAdd} noValidate className="flex items-center gap-2 flex-wrap">
          {(isTitleMissing || (quickAddSubmitted && (isInitMissing || isTeamMissing))) && (
            <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mr-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Заполните подсвеченные поля:
            </span>
          )}
          <input
            ref={titleInputRef}
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Новая задача *"
            title="Обязательное поле: введите название задачи"
            className={`rounded border px-2 py-1 text-xs w-44 transition-all focus:outline-none ${
              isTitleMissing
                ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 ring-2 ring-red-200'
                : 'border-gray-300 focus:border-indigo-500'
            }`}
          />
          <select
            ref={initSelectRef}
            value={newTaskInitId}
            onChange={e => setNewTaskInitId(e.target.value)}
            title="Обязательное поле: выберите инициативу"
            className={`rounded border px-1.5 py-1 text-xs w-36 transition-all focus:outline-none ${
              isInitMissing
                ? 'border-red-500 bg-red-50 text-red-700 font-medium ring-2 ring-red-200'
                : !newTaskInitId
                ? 'border-gray-300 bg-white text-gray-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="" disabled>Инициатива *</option>
            {approvedInits.map(i => <option key={i.id} value={i.id} className="text-gray-900">{i.name}</option>)}
          </select>
          <select
            ref={teamSelectRef}
            value={newTaskTeamId}
            onChange={e => setNewTaskTeamId(e.target.value)}
            title="Обязательное поле: выберите команду"
            className={`rounded border px-1.5 py-1 text-xs w-32 transition-all focus:outline-none ${
              isTeamMissing
                ? 'border-red-500 bg-red-50 text-red-700 font-medium ring-2 ring-red-200'
                : !newTaskTeamId
                ? 'border-gray-300 bg-white text-gray-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="" disabled>Команда *</option>
            {teams.map(t => <option key={t.id} value={t.id} className="text-gray-900">{t.name}</option>)}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded px-3 py-1 text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Добавить
          </button>
        </form>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-gray-200 bg-gray-50/70 overflow-y-auto shrink-0 z-20">
          <div className="sticky top-0 bg-gray-100 border-b border-gray-200 px-4 py-2 font-bold text-xs text-gray-700 h-14 flex items-center">
            Иерархия (Команды / Инициативы)
          </div>
          {teamLanes.length === 0 ? (
            <div className="p-6 text-xs text-gray-400 text-center">
              Нет запланированных задач на таймлайне. Перетащите задачу из Бэклога на календарь справа.
            </div>
          ) : (
            teamLanes.map(team => (
              <div key={team.id} className="border-b-2 border-gray-300">
                <div className="bg-indigo-900 text-white px-4 font-bold text-xs h-9 flex items-center justify-between">
                  <span className="truncate" title={team.name}>{team.name}</span>
                </div>
                {team.initiatives.map(init => (
                  <div key={init.id} className="border-b border-gray-200">
                    <div className="bg-indigo-50 px-4 font-semibold text-[11px] text-indigo-900 border-b border-indigo-100 h-8 flex items-center justify-between">
                      <span className="truncate" title={init.name}>🎯 {init.name}</span>
                    </div>
                    {init.tasks.map(task => (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={e => { if (task.id) e.dataTransfer.setData('application/unplan-task-id', task.id); }}
                        className="h-[60px] border-b border-gray-100 px-6 flex flex-col justify-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setEditingTask(task)}
                        title="Кликните для редактирования или перетащите вправо в Бэклог"
                      >
                        <div className="text-xs font-medium text-gray-900 truncate">{task.title}</div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div
          className="flex-1 flex flex-col overflow-y-auto relative bg-[#fcfcfc]"
          ref={gridRef}
          onDragOver={e => {
            if (e.dataTransfer.types.includes('application/my-task-id')) {
              e.preventDefault();
              const inv = getIntervalAtClientX(e.clientX);
              setHoveredIntervalId(inv?.id || null);
            }
          }}
          onDragLeave={() => setHoveredIntervalId(null)}
          onDrop={async e => {
            const draggedTaskId = e.dataTransfer.getData('application/my-task-id');
            setHoveredIntervalId(null);
            if (draggedTaskId && period?.id) {
              e.preventDefault();
              const inv = getIntervalAtClientX(e.clientX);
              if (inv) {
                setTasks(prev => prev.map(t => {
                  if (t.id === draggedTaskId) return { ...t, dateStart: inv.dateStart, dateEnd: inv.dateEnd };
                  return t;
                }));
                await taskService.updateTask(workspaceId, period.id, draggedTaskId, { dateStart: inv.dateStart, dateEnd: inv.dateEnd });
              }
            }
          }}
        >
          <div className="sticky top-0 z-10 flex flex-col border-b border-gray-200 bg-white w-full">
            <div className="flex border-b border-gray-200 h-7 w-full">
              {Object.entries(monthsMap).map(([monthName, invs]) => {
                const spanDays = invs.reduce((acc, inv) => {
                  const sIdx = days.findIndex(d => d.dateStr === inv.dateStart);
                  const eIdx = days.findIndex(d => d.dateStr === inv.dateEnd);
                  return acc + (eIdx - sIdx + 1);
                }, 0);
                const widthPct = days.length > 0 ? (spanDays / days.length) * 100 : 0;
                return (
                  <div key={monthName} className="font-bold text-xs text-indigo-700 bg-indigo-50/50 border-r border-gray-200 py-1 px-3 text-center flex items-center justify-center shrink-0" style={{ width: `${widthPct}%` }}>
                    {monthName}
                  </div>
                );
              })}
            </div>
            <div className="flex h-7 w-full">
              {intervals.map(inv => {
                const sIdx = days.findIndex(d => d.dateStr === inv.dateStart);
                const eIdx = days.findIndex(d => d.dateStr === inv.dateEnd);
                const widthPct = days.length > 0 ? ((eIdx - sIdx + 1) / days.length) * 100 : 0;
                return (
                  <div
                    key={inv.id}
                    className={`border-r border-gray-200 py-1 text-center text-[11px] font-medium flex items-center justify-center shrink-0 transition-colors ${
                      hoveredIntervalId === inv.id ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-gray-50 text-gray-600'
                    }`}
                    style={{ width: `${widthPct}%` }}
                  >
                    {inv.label}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex-1 relative select-none w-full min-h-[300px]">
            <div className="absolute inset-0 flex pointer-events-none z-0 w-full h-full">
              {intervals.map(inv => {
                const sIdx = days.findIndex(d => d.dateStr === inv.dateStart);
                const eIdx = days.findIndex(d => d.dateStr === inv.dateEnd);
                const widthPct = days.length > 0 ? ((eIdx - sIdx + 1) / days.length) * 100 : 0;
                return (
                  <div
                    key={inv.id}
                    className={`border-r border-gray-100 h-full shrink-0 transition-colors ${
                      hoveredIntervalId === inv.id ? 'bg-indigo-50/60' : ''
                    }`}
                    style={{ width: `${widthPct}%` }}
                  />
                );
              })}
            </div>

            {teamLanes.map(team => (
              <div key={team.id} className="border-b-2 border-gray-300 w-full relative z-10">
                <div className="bg-indigo-900 border-b border-gray-200 w-full h-9" />
                {team.initiatives.map(init => (
                  <div
                    key={init.id}
                    className="border-b border-gray-200 w-full"
                    onDragOver={e => {
                      if (e.dataTransfer.types.includes('application/my-task-id')) {
                        e.preventDefault();
                      }
                    }}
                    onDrop={async e => {
                      const draggedTaskId = e.dataTransfer.getData('application/my-task-id');
                      setHoveredIntervalId(null);
                      if (draggedTaskId && period?.id) {
                        e.preventDefault();
                        e.stopPropagation();
                        const inv = getIntervalAtClientX(e.clientX);
                        if (inv) {
                          const patch = {
                            dateStart: inv.dateStart,
                            dateEnd: inv.dateEnd,
                            teamId: team.id!,
                            initiativeId: init.id!
                          };
                          setTasks(prev => prev.map(t => (t.id === draggedTaskId ? { ...t, ...patch } : t)));
                          await taskService.updateTask(workspaceId, period.id, draggedTaskId, patch);
                        }
                      }
                    }}
                  >
                    <div className="bg-indigo-50 border-b border-indigo-100 w-full h-8" title="Перетащите сюда задачу, чтобы привязать к этой инициативе и команде" />
                    {init.tasks.map(task => {
                      const barStyle = getBarStyle(task.dateStart, task.dateEnd);
                      const rawEstimates = Object.entries(task.estimates || {}).filter(([_, val]) => Number(val) > 0);
                      const roleOrder = (task as any).roleOrder || rawEstimates.map(([id]) => id);
                      const estimatesEntries = roleOrder.map((id: string) => rawEstimates.find(([rtId]) => rtId === id)).filter(Boolean) as [string, number][];
                      rawEstimates.forEach(([id, val]) => {
                        if (!estimatesEntries.some(([eId]) => eId === id)) estimatesEntries.push([id, val]);
                      });

                      const totalTaskCalendarDays = task.dateStart && task.dateEnd
                        ? Math.max(1, days.findIndex(d => d.dateStr === task.dateEnd) - days.findIndex(d => d.dateStr === task.dateStart) + 1)
                        : 1;
                      const resourceOffsets: Record<string, number> = (task as any).resourceOffsets || {};
                      const totalEffortDays = estimatesEntries.reduce((acc, [_, val]) => acc + Number(val), 0);

                      return (
                        <div key={task.id} className="h-[60px] border-b border-gray-100 relative flex w-full">
                          <div className="absolute inset-0 flex z-0 pointer-events-none w-full">
                            {intervals.map(inv => {
                              const sIdx = days.findIndex(d => d.dateStr === inv.dateStart);
                              const eIdx = days.findIndex(d => d.dateStr === inv.dateEnd);
                              const widthPct = days.length > 0 ? ((eIdx - sIdx + 1) / days.length) * 100 : 0;
                              return (
                                <div
                                  key={inv.id}
                                  className="border-r border-gray-100 h-full pointer-events-auto hover:bg-indigo-50/40 cursor-pointer shrink-0"
                                  style={{ width: `${widthPct}%` }}
                                  onClick={() => {
                                    if (!period?.id) return;
                                    setTasks(prev => prev.map(t => {
                                      if (t.id === task.id) return { ...t, dateStart: inv.dateStart, dateEnd: inv.dateEnd };
                                      return t;
                                    }));
                                    taskService.updateTask(workspaceId, period.id, task.id!, { dateStart: inv.dateStart, dateEnd: inv.dateEnd });
                                  }}
                                  title="Кликните для смены интервала или перетащите сюда задачу из Бэклога"
                                />
                              );
                            })}
                          </div>

                          {barStyle && (
                            <div
                              className={`task-bar absolute top-1 bottom-1 rounded border flex flex-col shadow-sm text-[11px] font-medium ${getTaskColor(task.status)} z-10 hover:shadow-md transition-shadow group overflow-hidden ${movingTask?.taskId === task.id && isOverBacklog ? 'opacity-50 ring-2 ring-red-500' : ''}`}
                              style={barStyle}
                              onMouseMove={e => {
                                if (!segmentEditor && !isSegmentDraggingRef.current && !isTaskDraggingRef.current) {
                                  setTooltip({ task, x: e.clientX + 14, y: e.clientY + 14 });
                                }
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize bg-black/10 hover:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-30 rounded-l"
                                onMouseDown={e => { e.stopPropagation(); setResizing({ taskId: task.id!, edge: 'start' }); }}
                              />

                              <div
                                className="flex items-center justify-between w-full px-2.5 pt-1 z-20 shrink-0 cursor-grab active:cursor-grabbing"
                                onMouseDown={e => {
                                  e.stopPropagation();
                                  if (!task.dateStart || !task.dateEnd) return;
                                  isTaskDraggingRef.current = false;
                                  setMovingTask({ taskId: task.id!, startX: e.clientX, initialStart: task.dateStart, initialEnd: task.dateEnd });
                                }}
                              >
                                <div className="flex items-center gap-1.5 min-w-0 flex-1 pointer-events-none">
                                  <span className="truncate font-bold text-gray-900" title={task.title}>{task.title}</span>
                                  {totalEffortDays > 0 && <span className="text-[9px] text-gray-700 font-bold bg-black/10 px-1 py-0.5 rounded shrink-0">Σ {totalEffortDays}д</span>}
                                </div>

                                <select
                                  value={task.status}
                                  onChange={e => handleStatusChange(task.id!, e.target.value as TaskStatus)}
                                  className="ml-2 bg-white/90 border border-black/10 rounded px-1 py-0.5 text-[9px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                                  onMouseDown={e => e.stopPropagation()}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <option value="planned">План</option>
                                  <option value="in_progress">В работе</option>
                                  <option value="completed">Выполнена</option>
                                  <option value="cancelled">Отменена</option>
                                  <option value="failed">Не выполнена</option>
                                </select>
                              </div>

                              <div className="relative w-full flex-1 mt-0.5 z-10 bg-black/5" onClick={e => e.stopPropagation()}>
                                {estimatesEntries.map(([rtId, val], idx) => {
                                  const rt = resourceTypes.find(r => r.id === rtId);
                                  const shortName = rt ? rt.name.split(' ').map(w => w[0]).join('').toUpperCase() : rtId;
                                  const segmentColors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-sky-600'];
                                  const colorClass = segmentColors[idx % segmentColors.length] + ' text-white';
                                  const offsetDays = Number(resourceOffsets[rtId] || 0);
                                  const durationDays = Number(val);
                                  const leftPct = Math.max(0, Math.min(100, (offsetDays / totalTaskCalendarDays) * 100));
                                  const widthPct = Math.max(0, Math.min(100 - leftPct, (durationDays / totalTaskCalendarDays) * 100));

                                  return (
                                    <div
                                      key={rtId}
                                      onMouseDown={e => {
                                        e.stopPropagation();
                                        isSegmentDraggingRef.current = false;
                                        const barEl = e.currentTarget.closest('.task-bar') as HTMLElement;
                                        setDraggingSegment({ taskId: task.id!, roleId: rtId, startX: e.clientX, initialOffset: offsetDays, taskDurationDays: totalTaskCalendarDays, barWidthPx: barEl ? barEl.offsetWidth : 100, val: durationDays });
                                      }}
                                      onClick={e => {
                                        e.stopPropagation();
                                        if (isSegmentDraggingRef.current) return;
                                        setTooltip(null);
                                        setSegmentEditor({ taskId: task.id!, roleId: rtId, x: e.clientX, y: e.clientY + 15, val: durationDays });
                                      }}
                                      draggable
                                      onDragStart={() => setDraggedRole({ taskId: task.id!, roleId: rtId })}
                                      onDragOver={e => e.preventDefault()}
                                      onDrop={() => handleSegmentDrop(task, rtId)}
                                      className={`absolute top-[3px] bottom-[3px] rounded-sm px-1 text-[9px] font-bold flex items-center justify-center truncate shadow-sm cursor-pointer hover:ring-2 hover:ring-white transition-shadow ${colorClass}`}
                                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '50px' }}
                                    >
                                      <GripVertical className="w-2.5 h-2.5 mr-0.5 opacity-60 shrink-0 pointer-events-none" />
                                      <div className="flex items-center gap-0.5 pointer-events-none truncate">
                                        <span className="truncate">{shortName}: {val}д</span>
                                        <ChevronDown className="w-2.5 h-2.5 opacity-80 shrink-0" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              <div
                                className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize bg-black/10 hover:bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity z-30 rounded-r"
                                onMouseDown={e => { e.stopPropagation(); setResizing({ taskId: task.id!, edge: 'end' }); }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {showBacklog && (
          <div
            ref={backlogPanelRef}
            onDragOver={e => {
              if (e.dataTransfer.types.includes('application/unplan-task-id')) {
                e.preventDefault();
                setIsOverBacklog(true);
              }
            }}
            onDragLeave={() => setIsOverBacklog(false)}
            onDrop={async e => {
              const id = e.dataTransfer.getData('application/unplan-task-id');
              setIsOverBacklog(false);
              if (id) {
                e.preventDefault();
                await unplanTask(id);
              }
            }}
            className={`w-72 border-l flex flex-col shrink-0 z-30 transition-colors shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] ${isOverBacklog ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-inset ring-indigo-400' : 'bg-gray-50 border-gray-200'}`}
          >
            <div className="h-14 px-4 border-b border-gray-200 bg-white font-bold text-xs text-gray-800 flex justify-between items-center shrink-0">
              <span className="flex items-center gap-2"><ListTodo className="w-4 h-4 text-indigo-600" /> Нераспределенные</span>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px]">{unplannedTasks.length}</span>
            </div>

            {isOverBacklog && (
              <div className="mx-3 mt-3 p-2.5 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-700 text-xs font-semibold text-center">
                Отпустите задачу здесь, чтобы вернуть её в бэклог
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {unplannedTasks.length === 0 && !isOverBacklog && (
                <div className="text-xs text-gray-400 text-center mt-6 flex flex-col items-center gap-2">
                  <span>Все задачи на таймлайне! 🎉</span>
                  <span className="text-[11px] text-gray-400">Перетащите сюда задачу с таймлайна, чтобы убрать с неё даты</span>
                </div>
              )}
              {unplannedTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={e => e.dataTransfer.setData('application/my-task-id', task.id!)}
                  onClick={() => setEditingTask(task)}
                  className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-400 hover:shadow-md transition-all group"
                  title="Потяните задачу на таймлайн или кликните для редактирования"
                >
                  <div className="text-xs font-bold text-gray-900 mb-1.5 group-hover:text-indigo-700 transition-colors">{task.title}</div>
                  <div className="text-[10px] text-gray-500 flex flex-col gap-0.5">
                    <span className={`truncate ${!task.initiativeId ? 'text-red-500 font-semibold' : ''}`}>
                      🎯 {initiatives.find(i => i.id === task.initiativeId)?.name || 'Не выбрана инициатива *'}
                    </span>
                    <span className={`truncate ${!task.teamId ? 'text-red-500 font-semibold' : ''}`}>
                      👥 {teams.find(t => t.id === task.teamId)?.name || 'Не выбрана команда *'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {segmentEditor && (
        <>
          <div className="fixed inset-0 z-[290]" onClick={() => setSegmentEditor(null)} />
          <div className="fixed z-[300] bg-white border border-gray-200 rounded-lg shadow-xl p-2 w-36 flex flex-col gap-1" style={{ left: Math.min(segmentEditor.x - 20, window.innerWidth - 150), top: segmentEditor.y }}>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">Объем (дни):</div>
            <select
              autoFocus
              className="text-xs border border-gray-300 rounded p-1.5 w-full font-medium text-gray-800 bg-gray-50 cursor-pointer"
              value={segmentEditor.val}
              onChange={async e => {
                const newVal = parseInt(e.target.value, 10);
                setTasks(prev => prev.map(t => {
                  if (t.id === segmentEditor.taskId) return { ...t, estimates: { ...(t.estimates || {}), [segmentEditor.roleId]: newVal } };
                  return t;
                }));
                const task = tasks.find(t => t.id === segmentEditor.taskId);
                if (task && period?.id) await taskService.updateTask(workspaceId, period.id, task.id!, { estimates: { ...(task.estimates || {}), [segmentEditor.roleId]: newVal } });
                setSegmentEditor(null);
              }}
            >
              {Array.from({ length: 40 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>{d} дн.</option>
              ))}
            </select>
          </div>
        </>
      )}

      {tooltip && (
        <div className="fixed z-[200] pointer-events-none bg-gray-900 text-white px-3 py-2 rounded-lg shadow-2xl text-xs space-y-1.5 min-w-[220px] border border-gray-700" style={{ left: tooltip.x, top: tooltip.y }}>
          <div className="font-semibold text-sm border-b border-gray-700 pb-1 flex items-center justify-between">
            <span className="truncate pr-2">{tooltip.task.title}</span>
            <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 shrink-0">{tooltip.task.status}</span>
          </div>
          <div className="text-gray-300 text-[11px] flex justify-between">
            <span>Календарный срок:</span>
            <span className="font-medium text-white">{tooltip.task.dateStart || '—'} → {tooltip.task.dateEnd || '—'}</span>
          </div>
        </div>
      )}

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 text-gray-900 border-b pb-3">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base truncate">Редактирование задачи</h3>
            </div>
            <form onSubmit={handleSaveModal} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Название задачи <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${
                    !editingTask.title.trim()
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                />
                {!editingTask.title.trim() && (
                  <span className="text-[11px] text-red-600 mt-1 block font-medium">Обязательное поле</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Target className="w-3.5 h-3.5 text-indigo-500" /> Инициатива <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editingTask.initiativeId || ''}
                    onChange={e => setEditingTask({ ...editingTask, initiativeId: e.target.value })}
                    className={`w-full rounded border px-2 py-1.5 text-sm focus:outline-none ${
                      !editingTask.initiativeId
                        ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-500'
                    }`}
                  >
                    <option value="" disabled>Выберите инициативу *</option>
                    {initiatives.map(i => (
                      <option key={i.id} value={i.id} className="text-gray-900">{i.name}</option>
                    ))}
                  </select>
                  {!editingTask.initiativeId && (
                    <span className="text-[11px] text-red-600 mt-1 block font-medium">Обязательное поле</span>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5 text-indigo-500" /> Команда <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editingTask.teamId || ''}
                    onChange={e => setEditingTask({ ...editingTask, teamId: e.target.value })}
                    className={`w-full rounded border px-2 py-1.5 text-sm focus:outline-none ${
                      !editingTask.teamId
                        ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-200'
                        : 'border-gray-300 bg-white text-gray-900 focus:border-indigo-500'
                    }`}
                  >
                    <option value="" disabled>Выберите команду *</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id} className="text-gray-900">{t.name}</option>
                    ))}
                  </select>
                  {!editingTask.teamId && (
                    <span className="text-[11px] text-red-600 mt-1 block font-medium">Обязательное поле</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Описание задачи</label>
                <textarea rows={3} value={editingTask.description || ''} onChange={e => setEditingTask({ ...editingTask, description: e.target.value })} className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Дата начала</label>
                  <input type="date" value={editingTask.dateStart || ''} onChange={e => setEditingTask({ ...editingTask, dateStart: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Дата окончания</label>
                  <input type="date" value={editingTask.dateEnd || ''} onChange={e => setEditingTask({ ...editingTask, dateEnd: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm" />
                </div>
              </div>
              <div className="pt-2 border-t">
                <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><Users2 className="w-3.5 h-3.5 text-indigo-500" /> Трудозатраты и старт по ролям</label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border">
                  {resourceTypes.map(rt => {
                    const currentVal = editingTask.estimates?.[rt.id] || 0;
                    const currentOffset = (editingTask as any).resourceOffsets?.[rt.id] || 0;
                    return (
                      <div key={rt.id} className="flex items-center justify-between text-xs gap-2 border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-medium text-gray-700 w-32 truncate">{rt.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500">Объем:</span>
                          <input type="number" min="0" step="1" value={currentVal} onChange={e => setEditingTask({ ...editingTask, estimates: { ...(editingTask.estimates || {}), [rt.id]: parseFloat(e.target.value) || 0 } })} className="w-16 rounded border px-2 py-1 text-right text-xs bg-white" />
                          <span className="text-[10px] text-gray-500 ml-1">Старт (дн):</span>
                          <input type="number" min="0" step="1" value={currentOffset} onChange={e => setEditingTask({ ...editingTask, resourceOffsets: { ...((editingTask as any).resourceOffsets || {}), [rt.id]: parseFloat(e.target.value) || 0 } } as any)} className="w-16 rounded border px-2 py-1 text-right text-xs bg-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-3 border-t">
                <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Отмена</button>
                <button
                  type="submit"
                  disabled={!editingTask.title.trim() || !editingTask.initiativeId || !editingTask.teamId}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-sm transition-colors"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
