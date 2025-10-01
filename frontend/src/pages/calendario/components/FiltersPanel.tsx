import React from 'react';
import { Card } from '@/components/ui/Card';

interface FiltersPanelProps {
  selectedRegional: string;
  selectedDepartamento: string;
  onChangeRegional: (value: string) => void;
  onChangeDepartamento: (value: string) => void;
  eventsOfMonthCount: number;
  filteredEventsCount: number;
  REGIONAL_LABELS: Record<string, string>;
  DEPARTAMENTO_LABELS: Record<string, string>;
}

export default function FiltersPanel({
  selectedRegional,
  selectedDepartamento,
  onChangeRegional,
  onChangeDepartamento,
  eventsOfMonthCount,
  filteredEventsCount,
  REGIONAL_LABELS,
  DEPARTAMENTO_LABELS,
}: FiltersPanelProps) {
  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Regional</label>
          <select
            aria-label="Selecionar regional"
            value={selectedRegional}
            onChange={(e) => onChangeRegional(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
          >
            {Object.entries(REGIONAL_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Departamento</label>
          <select
            aria-label="Selecionar departamento"
            value={selectedDepartamento}
            onChange={(e) => onChangeDepartamento(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2 bg-white"
          >
            {Object.entries(DEPARTAMENTO_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            <div className="font-medium">Eventos filtrados: {eventsOfMonthCount}</div>
            <div>Total de eventos: {filteredEventsCount}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}