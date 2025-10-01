import { format, isSameMonth } from 'date-fns';
import type { Atividade } from '@/types';
import { REGIONAL_LABELS, REGIONAL_COLOR_CLASSES, TYPE_COLOR_CLASSES } from '../constants';

interface MonthGridProps {
  days: (Date | null)[];
  currentMonth: Date;
  eventsByDay: Record<string, Atividade[]>;
  onSelectDate: (d: Date) => void;
  // Permite configurar a cor dos indicadores por 'regional' (padrão) ou por 'type' (tipo de atividade)
  dotColorBy?: 'regional' | 'type';
}

export default function MonthGrid({ days, currentMonth, eventsByDay, onSelectDate, dotColorBy = 'regional' }: MonthGridProps) {
  return (
    <>
      <div className="grid grid-cols-7 text-sm font-semibold text-gray-600 mb-3">
        {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map((d) => (
          <div key={d} className="text-center py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, idx) => {
          const dayKey = d ? format(d, 'yyyy-MM-dd') : '';
          const dayEvents = d ? (eventsByDay[dayKey] ?? []) : [];
          return (
            <button
              key={idx}
              onClick={() => d && onSelectDate(d)}
              className={`aspect-square rounded-xl text-sm flex flex-col items-start justify-start p-2 border-2 transition-all duration-200 ${
                !d ? 'border-transparent' : 'border-gray-100 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:border-blue-200 hover:shadow-md hover:scale-105'
              } ${d && !isSameMonth(d, currentMonth) ? 'text-gray-300' : 'text-gray-900'}`}
              aria-label={d ? `Dia ${format(d, 'd')}, ${dayEvents.length} eventos` : 'Dia vazio'}
              title={d && dayEvents.length ? `${dayEvents.length} evento(s)` : undefined}
            >
              {d ? (
                <>
                  <span className="text-sm font-semibold mb-1">{format(d, 'd')}</span>
                  <div className="flex flex-wrap gap-1 w-full">
                    {dayEvents.slice(0, 3).map((evt) => {
                      const regionalColor = REGIONAL_COLOR_CLASSES[evt.regional as string] || 'bg-gray-400';
                      const typeColor = TYPE_COLOR_CLASSES[evt.tipo] || 'bg-gray-400';
                      const dotColor = dotColorBy === 'type' ? typeColor : regionalColor;
                      return (
                        <div
                          key={evt.id}
                          className={`w-2 h-2 rounded-full ${dotColor}`}
                          title={`${evt.titulo} - ${REGIONAL_LABELS[evt.regional as string]}`}
                        />
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-500 font-medium">+{dayEvents.length - 3}</span>
                    )}
                  </div>
                </>
              ) : ''}
            </button>
          );
        })}
      </div>
    </>
  );
}