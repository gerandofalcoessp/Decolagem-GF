import React from 'react';

interface MonthOption {
  value: string;
  label: string;
}

interface Props {
  selectedMonths: string[];
  setSelectedMonths: (months: string[]) => void;
  mesesDisponiveis: MonthOption[];
  className?: string;
}

export default function MonthSelector({ selectedMonths, setSelectedMonths, mesesDisponiveis, className }: Props) {
  const handleToggle = (value: string, checked: boolean) => {
    if (value === 'todo-ano') {
      if (checked) {
        setSelectedMonths(['todo-ano']);
      } else {
        setSelectedMonths([]);
      }
    } else {
      if (checked) {
        const novosMeses = selectedMonths.filter(m => m !== 'todo-ano');
        setSelectedMonths([...novosMeses, value]);
      } else {
        setSelectedMonths(selectedMonths.filter(m => m !== value));
      }
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
        <div className="space-y-1">
          {mesesDisponiveis.map(mes => (
            <label key={mes.value} className="flex items-center cursor-pointer hover:bg-white rounded px-1 py-0.5 transition-colors">
              <input
                type="checkbox"
                checked={mes.value === 'todo-ano' ? selectedMonths.includes('todo-ano') : selectedMonths.includes(mes.value)}
                onChange={(e) => handleToggle(mes.value, e.target.checked)}
                className="mr-2 text-pink-500 focus:ring-pink-500 rounded"
              />
              <span className="text-sm">{mes.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}