import React from 'react';

interface Props {
  year: string;
  setYear: (year: string) => void;
  className?: string;
}

export default function YearInput({ year, setYear, className }: Props) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
      <input
        type="number"
        value={year}
        onChange={(e) => setYear(e.target.value)}
        placeholder="2025"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-colors"
      />
    </div>
  );
}