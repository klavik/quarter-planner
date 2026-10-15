import React from 'react';

interface CapacityTabProps {
  selectedTeam?: string;
  period?: any;
}

export function CapacityTab({ selectedTeam = 'all', period }: CapacityTabProps) {
  // Заглушка для устранения ошибок компиляции до полной интеграции ролей
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-medium">Управление емкостью (Capacity)</h3>
      <p className="text-sm text-gray-500">Выбранная команда: {selectedTeam}</p>
    </div>
  );
}
