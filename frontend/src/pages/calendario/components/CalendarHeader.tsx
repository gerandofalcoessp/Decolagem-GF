import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export default function CalendarHeader({ currentMonth, onPrevMonth, onNextMonth }: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <button
        onClick={onPrevMonth}
        aria-label="Mês anterior"
        className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <div className="text-xl font-bold text-gray-900 bg-gradient-to-r from-pink-500 to-pink-600 bg-clip-text text-transparent">
        {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
      </div>
      <button
        onClick={onNextMonth}
        aria-label="Próximo mês"
        className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}