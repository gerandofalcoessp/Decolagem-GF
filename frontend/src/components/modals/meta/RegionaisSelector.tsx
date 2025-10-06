import React from 'react';

interface Props {
  selectedRegionais: string[];
  setSelectedRegionais: (regionais: string[]) => void;
  options: string[];
  className?: string;
}

export default function RegionaisSelector({ selectedRegionais, setSelectedRegionais, options, className }: Props) {
  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRegionais([...options]);
    } else {
      setSelectedRegionais([]);
    }
  };

  const toggleOne = (regional: string, checked: boolean) => {
    if (checked) {
      setSelectedRegionais([...selectedRegionais, regional]);
    } else {
      setSelectedRegionais(selectedRegionais.filter(r => r !== regional));
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Aplicar Meta para Área:</label>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 max-h-32 overflow-y-auto">
        <div className="space-y-1">
          <label className="flex items-center cursor-pointer hover:bg-white rounded px-1 py-0.5 transition-colors">
            <input
              type="checkbox"
              checked={selectedRegionais.length === options.length}
              onChange={(e) => toggleAll(e.target.checked)}
              className="mr-2 text-pink-500 focus:ring-pink-500 rounded"
            />
            <span className="text-sm font-medium">Todas as Áreas</span>
          </label>
          {options.map(regional => (
            <label key={regional} className="flex items-center cursor-pointer hover:bg-white rounded px-1 py-0.5 transition-colors">
              <input
                type="checkbox"
                checked={selectedRegionais.includes(regional)}
                onChange={(e) => toggleOne(regional, e.target.checked)}
                className="mr-2 text-pink-500 focus:ring-pink-500 rounded"
              />
              <span className="text-sm">{regional}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}