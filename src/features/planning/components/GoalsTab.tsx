import { useState, useRef } from 'react';
import { PlanningPeriod, Initiative } from '@/domain/schemas';
import { Plus, Target, Trash2, Edit2, AlertCircle, FileText, CheckCircle2, LayoutDashboard } from 'lucide-react';
import { usePlanningContext } from '../PlanningContext';

interface Goal {
  id: string;
  title: string;
  description?: string;
  initiativeIds: string[];
}

export function GoalsTab(_props?: { workspaceId?: string; period?: PlanningPeriod }) {
  const { period, initiatives } = usePlanningContext();

  // Локальный стейт для целей квартала (можно хранить в localStorage или расширить сервис при необходимости)
  const [goals, setGoals] = useState<Goal[]>([
    { id: 'goal-1', title: 'Успешный запуск ключевых продуктов квартала', description: 'Выкатка основных фичей вовремя', initiativeIds: [] }
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setFormSubmitted(true);
      titleInputRef.current?.focus();
      return;
    }

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      initiativeIds: []
    };

    setGoals(prev => [...prev, newGoal]);
    setNewTitle('');
    setNewDesc('');
    setFormSubmitted(false);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal || !editingGoal.title.trim()) return;

    setGoals(prev => prev.map(g => (g.id === editingGoal.id ? editingGoal : g)));
    setEditingGoal(null);
  };

  const handleDelete = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (editingGoal?.id === id) setEditingGoal(null);
  };

  const toggleInitiativeLink = (goalId: string, initId: string) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const exists = g.initiativeIds.includes(initId);
      const updatedIds = exists ? g.initiativeIds.filter(id => id !== initId) : [...g.initiativeIds, initId];
      return { ...g, initiativeIds: updatedIds };
    }));
  };

  const isTitleMissing = formSubmitted && !newTitle.trim();

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Верхняя форма создания цели */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <LayoutDashboard className="w-4 h-4 text-indigo-600" /> Добавить стратегическую цель квартала
        </h3>
        <form onSubmit={handleCreate} noValidate className="flex items-start gap-3 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            {isTitleMissing && (
              <span className="text-[11px] text-red-600 font-medium flex items-center gap-1 mb-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Обязательное поле
              </span>
            )}
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Название цели (например, Рост конверсии на 15%) *"
              className={`w-full rounded border px-3 py-1.5 text-xs transition-all focus:outline-none ${
                isTitleMissing
                  ? 'border-red-500 bg-red-50 text-red-900 placeholder-red-400 ring-2 ring-red-200'
                  : 'border-gray-300 focus:border-indigo-500'
              }`}
            />
          </div>

          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Описание / Метрики успеха (необязательно)"
              className="w-full rounded border border-gray-300 px-3 py-1.5 text-xs focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="bg-indigo-600 text-white rounded px-4 py-1.5 text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Добавить цель
          </button>
        </form>
      </div>

      {/* Список целей и привязка инициатив */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
        {goals.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-lg border border-gray-200">
            В этом периоде пока нет целей. Добавьте первую цель выше.
          </div>
        ) : (
          goals.map(goal => {
            const linkedInits = initiatives.filter(i => goal.initiativeIds.includes(i.id!));

            return (
              <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Target className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-gray-900">{goal.title}</h4>
                      {goal.description && <p className="text-xs text-gray-500 mt-1">{goal.description}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingGoal(goal)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(goal.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Блок привязанных инициатив */}
                <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                  <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    Связанные инициативы ({linkedInits.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {initiatives.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Сначала создайте инициативы во вкладке «Инициативы».</span>
                    ) : (
                      initiatives.map(init => {
                        const isLinked = goal.initiativeIds.includes(init.id!);
                        return (
                          <button
                            key={init.id}
                            type="button"
                            onClick={() => toggleInitiativeLink(goal.id, init.id!)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors flex items-center gap-1.5 ${
                              isLinked
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <CheckCircle2 className={`w-3.5 h-3.5 ${isLinked ? 'text-white' : 'text-gray-400'}`} />
                            {init.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно редактирования цели */}
      {editingGoal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[480px]">
            <div className="flex items-center gap-2 mb-4 text-gray-900 border-b pb-3">
              <LayoutDashboard className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base truncate">Редактирование цели</h3>
            </div>
            <form onSubmit={handleUpdate} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-gray-400" /> Название цели <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingGoal.title}
                  onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className={`w-full rounded border px-3 py-2 text-sm focus:outline-none ${
                    !editingGoal.title.trim()
                      ? 'border-red-500 bg-red-50 ring-2 ring-red-200'
                      : 'border-gray-300 focus:border-indigo-500'
                  }`}
                />
                {!editingGoal.title.trim() && (
                  <span className="text-[11px] text-red-600 mt-1 block font-medium">Обязательное поле</span>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Описание</label>
                <textarea
                  rows={3}
                  value={editingGoal.description || ''}
                  onChange={e => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={!editingGoal.title.trim()}
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
