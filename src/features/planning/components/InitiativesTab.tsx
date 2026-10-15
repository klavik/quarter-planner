import { useState, useRef } from 'react';
import { initiativeService } from '../initiativeService';
import { Initiative, PlanningPeriod } from '@/domain/schemas';
import { Plus, Target, Trash2, Edit2, AlertCircle, FileText, CheckCircle2, Clock } from 'lucide-react';
import { usePlanningContext } from '../PlanningContext';

export function InitiativesTab(_props?: { workspaceId?: string; period?: PlanningPeriod }) {
  const { workspaceId, period, initiatives, setInitiatives, loading } = usePlanningContext();

  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<Initiative['status']>('planned');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [editingInit, setEditingInit] = useState<Initiative | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !period?.id) {
      setFormSubmitted(true);
      nameInputRef.current?.focus();
      return;
    }

    const payload: Omit<Initiative, 'id'> = {
      name: newName.trim(),
      description: newDesc.trim(),
      status: newStatus,
      createdAt: new Date().toISOString()
    };

    const id = await initiativeService.addInitiative(workspaceId, period.id, payload);
    setInitiatives(prev => [...prev, { id, ...payload }]);
    setNewName('');
    setNewDesc('');
    setNewStatus('planned');
    setFormSubmitted(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInit || !period?.id || !editingInit.name.trim()) return;

    const payload = {
      name: editingInit.name.trim(),
      description: editingInit.description || '',
      status: editingInit.status
    };

    setInitiatives(prev => prev.map(i => (i.id === editingInit.id ? { ...i, ...payload } : i)));
    await initiativeService.updateInitiative(workspaceId, period.id, editingInit.id!, payload);
    setEditingInit(null);
  };

  const handleDelete = async (id: string) => {
    if (!period?.id) return;
    setInitiatives(prev => prev.filter(i => i.id !== id));
    if ((initiativeService as any).deleteInitiative) {
      await (initiativeService as any).deleteInitiative(workspaceId, period.id, id);
    }
    if (editingInit?.id === id) setEditingInit(null);
  };

  if (loading) return <div className="animate-pulse text-gray-500 p-6">Загрузка инициатив...</div>;

  const isNameMissing = formSubmitted && !newName.trim();

  const getStatusBadge = (status: Initiative['status']) => {
    switch (status) {
      case 'approved':
        return <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Утверждено</span>;
      case 'approved_no_resources':
        return <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Без ресурсов</span>;
      case 'rejected':
        return <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[11px] font-medium">Отклонено</span>;
      default:
        return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">В планах</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Форма создания инициативы с валидацией */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">Создать новую инициативу</h3>
        <form onSubmit={handleCreate} noValidate className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            {isNameMissing && (
              <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mb-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Обязательное поле
              </span>
            )}
            <input
              ref={nameInputRef}
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Название инициативы *"
              className={`w-full rounded border px-3 py-1.5 text-xs transition-all focus:outline-none ${
                isNameMissing
                  ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 ring-2 ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
          </div>

          <div className="w-44">
            <select
              value={newStatus}
              onChange={e => setNewStatus(e.target.value as Initiative['status'])}
              className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs bg-white text-gray-800"
            >
              <option value="planned">В планах</option>
              <option value="approved">Утверждено</option>
              <option value="approved_no_resources">Без ресурсов</option>
              <option value="rejected">Отклонено</option>
            </select>
          </div>

          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Описание (необязательно)"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-xs focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 text-white rounded px-4 py-1.5 text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </form>
      </div>

      {/* Список инициатив */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50/50">
        {initiatives.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
            В этом периоде пока нет инициатив. Добавьте первую инициативу выше.
          </div>
        ) : (
          initiatives.map(init => (
            <div
              key={init.id}
              className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between gap-4 shadow-sm hover:border-indigo-300 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <Target className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-bold text-sm text-gray-900 truncate">{init.name}</span>
                    {getStatusBadge(init.status)}
                  </div>
                  {init.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{init.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingInit(init)}
                  className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(init.id!)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно редактирования инициативы */}
      {editingInit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px]">
            <div className="flex items-center gap-2 mb-4 text-gray-900 border-b pb-3">
              <Target className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base truncate">Редактирование инициативы</h3>
            </div>
            <form onSubmit={handleUpdate} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Название инициативы <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingInit.name}
                  onChange={e => setEditingInit({ ...editingInit, name: e.target.value })}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${
                    !editingInit.name.trim()
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                />
                {!editingInit.name.trim() && (
                  <span className="text-[11px] text-red-600 mt-1 block font-medium">Обязательное поле</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Статус</label>
                <select
                  value={editingInit.status}
                  onChange={e => setEditingInit({ ...editingInit, status: e.target.value as Initiative['status'] })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="planned">В планах</option>
                  <option value="approved">Утверждено</option>
                  <option value="approved_no_resources">Без ресурсов</option>
                  <option value="rejected">Отклонено</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Описание</label>
                <textarea
                  rows={3}
                  value={editingInit.description || ''}
                  onChange={e => setEditingInit({ ...editingInit, description: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingInit(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!editingInit.name.trim()}
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
