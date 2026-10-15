import { useState, useMemo, useRef } from 'react';
import { taskService } from '../taskService';
import { Task, TaskStatus, PlanningPeriod } from '@/domain/schemas';
import { Plus, Filter, FileText, Users2, ListTodo, Target, AlertCircle, CalendarDays, Trash2 } from 'lucide-react';
import { usePlanningContext } from '../PlanningContext';

export function TasksTab(_props?: { workspaceId?: string; period?: PlanningPeriod }) {
  const { workspaceId, period, tasks, setTasks, initiatives, teams, resourceTypes, loading } = usePlanningContext();

  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [selectedInitFilter, setSelectedInitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unplanned' | 'planned'>('all');

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskInitId, setNewTaskInitId] = useState('');
  const [newTaskTeamId, setNewTaskTeamId] = useState('');
  const [topFormSubmitted, setTopFormSubmitted] = useState(false);

  const topTitleRef = useRef<HTMLInputElement>(null);
  const topInitRef = useRef<HTMLSelectElement>(null);
  const topTeamRef = useRef<HTMLSelectElement>(null);

  const [inlineInitId, setInlineInitId] = useState<string | null>(null);
  const [inlineTitle, setInlineTitle] = useState('');
  const [inlineTeamId, setInlineTeamId] = useState('');
  const [inlineSubmitted, setInlineSubmitted] = useState(false);

  const inlineTitleRef = useRef<HTMLInputElement>(null);
  const inlineTeamRef = useRef<HTMLSelectElement>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleTopQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !newTaskInitId || !newTaskTeamId) {
      setTopFormSubmitted(true);
      if (!newTaskTitle.trim()) topTitleRef.current?.focus();
      else if (!newTaskInitId) topInitRef.current?.focus();
      else if (!newTaskTeamId) topTeamRef.current?.focus();
      return;
    }
    if (!period?.id) return;

    const newTask: Omit<Task, 'id'> = {
      title: newTaskTitle.trim(),
      initiativeId: newTaskInitId,
      teamId: newTaskTeamId,
      status: 'planned',
      estimates: {},
      createdAt: new Date().toISOString()
    };

    const id = await taskService.addTask(workspaceId, period.id, newTask);
    setTasks(prev => [...prev, { id, ...newTask }]);
    setNewTaskTitle('');
    setTopFormSubmitted(false);
  };

  const openInlineAdd = (initId: string) => {
    setInlineInitId(initId);
    setInlineTitle('');
    setInlineTeamId(selectedTeamFilter !== 'all' ? selectedTeamFilter : '');
    setInlineSubmitted(false);
    setTimeout(() => inlineTitleRef.current?.focus(), 50);
  };

  const handleInlineAdd = async (e: React.FormEvent, initId: string) => {
    e.preventDefault();
    if (!inlineTitle.trim() || !inlineTeamId) {
      setInlineSubmitted(true);
      if (!inlineTitle.trim()) inlineTitleRef.current?.focus();
      else if (!inlineTeamId) inlineTeamRef.current?.focus();
      return;
    }
    if (!period?.id) return;

    const newTask: Omit<Task, 'id'> = {
      title: inlineTitle.trim(),
      initiativeId: initId,
      teamId: inlineTeamId,
      status: 'planned',
      estimates: {},
      createdAt: new Date().toISOString()
    };

    const id = await taskService.addTask(workspaceId, period.id, newTask);
    setTasks(prev => [...prev, { id, ...newTask }]);
    setInlineTitle('');
    setInlineSubmitted(false);
    setInlineInitId(null);
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
      status: editingTask.status,
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

  const handleDeleteTask = async (taskId: string) => {
    if (!period?.id) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if ((taskService as any).deleteTask) {
      await (taskService as any).deleteTask(workspaceId, period.id, taskId);
    }
    if (editingTask?.id === taskId) setEditingTask(null);
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    if (!period?.id) return;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) return { ...t, status: newStatus };
      return t;
    }));
    await taskService.updateTaskStatus(workspaceId, period.id, taskId, newStatus);
  };

  const filteredInitiatives = useMemo(() => {
    const list = selectedInitFilter === 'all'
      ? initiatives
      : initiatives.filter(i => i.id === selectedInitFilter);

    return list.map(init => {
      const initTasks = tasks.filter(t => {
        if (t.initiativeId !== init.id) return false;
        if (selectedTeamFilter !== 'all' && t.teamId !== selectedTeamFilter) return false;
        if (statusFilter === 'unplanned' && Boolean(t.dateStart && t.dateEnd)) return false;
        if (statusFilter === 'planned' && (!t.dateStart || !t.dateEnd)) return false;
        return true;
      });
      return { ...init, tasks: initTasks };
    });
  }, [initiatives, tasks, selectedInitFilter, selectedTeamFilter, statusFilter]);

  if (loading) return <div className="animate-pulse text-gray-500 p-6">Загрузка бэклога задач...</div>;

  const shouldHighlightTop = topFormSubmitted || newTaskTitle.trim().length > 0;
  const isTopTitleMissing = topFormSubmitted && !newTaskTitle.trim();
  const isTopInitMissing = shouldHighlightTop && !newTaskInitId;
  const isTopTeamMissing = shouldHighlightTop && !newTaskTeamId;

  const shouldHighlightInline = inlineSubmitted || inlineTitle.trim().length > 0;
  const isInlineTitleMissing = inlineSubmitted && !inlineTitle.trim();
  const isInlineTeamMissing = shouldHighlightInline && !inlineTeamId;

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-indigo-500" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Инициатива:</span>
            <select
              value={selectedInitFilter}
              onChange={e => setSelectedInitFilter(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-xs bg-gray-50 font-medium text-gray-800"
            >
              <option value="all">Все инициативы ({initiatives.length})</option>
              {initiatives.map(i => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Команда:</span>
            <select
              value={selectedTeamFilter}
              onChange={e => setSelectedTeamFilter(e.target.value)}
              className="rounded border border-gray-300 px-2 py-1 text-xs bg-gray-50 font-medium text-gray-800"
            >
              <option value="all">Все команды</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Даты:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="rounded border border-gray-300 px-2 py-1 text-xs bg-gray-50 font-medium text-gray-800"
            >
              <option value="all">Все задачи ({tasks.length})</option>
              <option value="unplanned">Не на таймлайне ({tasks.filter(t => !t.dateStart || !t.dateEnd).length})</option>
              <option value="planned">На таймлайне ({tasks.filter(t => Boolean(t.dateStart && t.dateEnd)).length})</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleTopQuickAdd} noValidate className="flex items-center gap-2 flex-wrap">
          {(isTopTitleMissing || (topFormSubmitted && (isTopInitMissing || isTopTeamMissing))) && (
            <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Заполните обязательные поля:
            </span>
          )}
          <input
            ref={topTitleRef}
            type="text"
            value={newTaskTitle}
            onChange={e => setNewTaskTitle(e.target.value)}
            placeholder="Новая задача в бэклог *"
            className={`rounded border px-2.5 py-1 text-xs w-48 transition-all focus:outline-none ${
              isTopTitleMissing
                ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 ring-2 ring-red-200'
                : 'border-gray-300 focus:border-indigo-500'
            }`}
          />
          <select
            ref={topInitRef}
            value={newTaskInitId}
            onChange={e => setNewTaskInitId(e.target.value)}
            className={`rounded border px-2 py-1 text-xs w-44 transition-all focus:outline-none ${
              isTopInitMissing
                ? 'border-red-500 bg-red-50 text-red-700 font-medium ring-2 ring-red-200'
                : !newTaskInitId
                ? 'border-gray-300 bg-white text-gray-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="" disabled>Выберите инициативу *</option>
            {initiatives.map(i => (
              <option key={i.id} value={i.id} className="text-gray-900">{i.name}</option>
            ))}
          </select>
          <select
            ref={topTeamRef}
            value={newTaskTeamId}
            onChange={e => setNewTaskTeamId(e.target.value)}
            className={`rounded border px-2 py-1 text-xs w-36 transition-all focus:outline-none ${
              isTopTeamMissing
                ? 'border-red-500 bg-red-50 text-red-700 font-medium ring-2 ring-red-200'
                : !newTaskTeamId
                ? 'border-gray-300 bg-white text-gray-500'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="" disabled>Выберите команду *</option>
            {teams.map(t => (
              <option key={t.id} value={t.id} className="text-gray-900">{t.name}</option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white rounded px-3 py-1 text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> В бэклог
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {filteredInitiatives.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
            В этом периоде пока нет инициатив. Создайте инициативу во вкладке «Инициативы».
          </div>
        ) : (
          filteredInitiatives.map(init => (
            <div key={init.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-indigo-50/70 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-sm text-indigo-950 truncate">{init.name}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0">
                    Задач: {init.tasks.length}
                  </span>
                </div>
                {inlineInitId !== init.id && (
                  <button
                    type="button"
                    onClick={() => openInlineAdd(init.id!)}
                    className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-medium flex items-center gap-1 transition-colors shrink-0 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Задача в эту инициативу
                  </button>
                )}
              </div>

              {inlineInitId === init.id && (
                <form
                  onSubmit={e => handleInlineAdd(e, init.id!)}
                  noValidate
                  className="bg-indigo-50/30 border-b border-indigo-100 px-4 py-2.5 flex items-center gap-2 flex-wrap"
                >
                  {(isInlineTitleMissing || (inlineSubmitted && isInlineTeamMissing)) && (
                    <span className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Заполните подсвеченные поля:
                    </span>
                  )}
                  <input
                    ref={inlineTitleRef}
                    type="text"
                    value={inlineTitle}
                    onChange={e => setInlineTitle(e.target.value)}
                    placeholder="Название задачи для этой инициативы *"
                    className={`rounded border px-2.5 py-1 text-xs flex-1 min-w-[220px] focus:outline-none ${
                      isInlineTitleMissing
                        ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 ring-2 ring-red-200'
                        : 'border-gray-300 bg-white focus:border-indigo-500'
                    }`}
                  />
                  <select
                    ref={inlineTeamRef}
                    value={inlineTeamId}
                    onChange={e => setInlineTeamId(e.target.value)}
                    className={`rounded border px-2 py-1 text-xs w-44 focus:outline-none ${
                      isInlineTeamMissing
                        ? 'border-red-500 bg-red-50 text-red-700 font-medium ring-2 ring-red-200'
                        : !inlineTeamId
                        ? 'border-gray-300 bg-white text-gray-500'
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  >
                    <option value="" disabled>Выберите команду *</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id} className="text-gray-900">{t.name}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700"
                  >
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={() => setInlineInitId(null)}
                    className="px-2.5 py-1 text-gray-500 hover:bg-gray-200 rounded text-xs"
                  >
                    Отмена
                  </button>
                </form>
              )}

              {init.tasks.length === 0 ? (
                inlineInitId !== init.id && (
                  <div className="px-4 py-3.5 text-xs text-gray-400 italic">
                    В этой инициативе пока нет задач.
                  </div>
                )
              ) : (
                <div className="divide-y divide-gray-100">
                  {init.tasks.map(task => {
                    const team = teams.find(t => t.id === task.teamId);
                    const totalEffort = Object.values(task.estimates || {}).reduce((acc, v) => acc + (Number(v) || 0), 0);
                    const isScheduled = Boolean(task.dateStart && task.dateEnd);

                    return (
                      <div
                        key={task.id}
                        onClick={() => setEditingTask(task)}
                        className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <ListTodo className="w-4 h-4 text-gray-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-gray-900 truncate">{task.title}</div>
                            {task.description && (
                              <div className="text-[11px] text-gray-500 truncate">{task.description}</div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${team ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-600'}`}>
                            👥 {team?.name || 'Команда не выбрана'}
                          </span>

                          {totalEffort > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[11px] font-bold">
                              Σ {totalEffort} дн.
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[11px]">
                              Без оценки
                            </span>
                          )}

                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${isScheduled ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {isScheduled ? `${task.dateStart} → ${task.dateEnd}` : 'В бэклоге'}
                          </span>

                          <select
                            value={task.status}
                            onChange={e => handleStatusChange(task.id!, e.target.value as TaskStatus)}
                            className="border border-gray-200 rounded px-2 py-1 text-[11px] font-medium bg-white text-gray-700"
                          >
                            <option value="planned">План</option>
                            <option value="in_progress">В работе</option>
                            <option value="completed">Выполнена</option>
                            <option value="cancelled">Отменена</option>
                            <option value="failed">Не выполнена</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {editingTask && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 text-gray-900 border-b pb-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base truncate">Редактирование задачи</h3>
              </div>
              {editingTask.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteTask(editingTask.id!)}
                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                  title="Удалить задачу"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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
                <textarea
                  rows={3}
                  value={editingTask.description || ''}
                  onChange={e => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Дата начала (необязательно)</label>
                  <input
                    type="date"
                    value={editingTask.dateStart || ''}
                    onChange={e => setEditingTask({ ...editingTask, dateStart: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Дата окончания (необязательно)</label>
                  <input
                    type="date"
                    value={editingTask.dateEnd || ''}
                    onChange={e => setEditingTask({ ...editingTask, dateEnd: e.target.value })}
                    className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t">
                <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Users2 className="w-3.5 h-3.5 text-indigo-500" /> Оценка трудозатрат по ролям (в днях)
                </label>
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border">
                  {resourceTypes.map(rt => {
                    const currentVal = editingTask.estimates?.[rt.id] || 0;
                    return (
                      <div key={rt.id} className="flex items-center justify-between text-xs gap-2 border-b pb-2 last:border-0 last:pb-0">
                        <span className="font-medium text-gray-700 truncate">{rt.name}</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={currentVal}
                          onChange={e =>
                            setEditingTask({
                              ...editingTask,
                              estimates: { ...(editingTask.estimates || {}), [rt.id]: parseFloat(e.target.value) || 0 }
                            })
                          }
                          className="w-20 rounded border px-2 py-1 text-right text-xs bg-white"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Отмена
                </button>
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
