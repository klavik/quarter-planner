import React from 'react';

export function TimelineTab({ period }: { period?: { dateStart?: string; dateEnd?: string } }) {
  const d: string[] = [];
  if (!period?.dateStart || !period?.dateEnd) return d;
  
  // Базовая заглушка для таймлайна
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">Таймлайн квартала</h3>
      <p className="text-sm text-gray-500">Период: {period.dateStart} — {period.dateEnd}</p>
    </div>
  );
}
