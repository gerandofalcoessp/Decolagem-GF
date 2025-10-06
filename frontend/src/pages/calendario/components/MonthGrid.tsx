import { format, isSameMonth } from 'date-fns';
import { useState } from 'react';
import type { Atividade } from '../../../types';
import { REGIONAL_LABELS, REGIONAL_COLOR_CLASSES, TYPE_COLOR_CLASSES } from '../constants';

interface MonthGridProps {
  days: (Date | null)[];
  currentMonth: Date;
  eventsByDay: Record<string, Atividade[]>;
  onSelectDate: (d: Date) => void;
  // Permite configurar a cor dos indicadores por 'regional' (padrão) ou por 'type' (tipo de atividade)
  dotColorBy?: 'regional' | 'type';
}

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  events: Atividade[];
  date: string;
}

export default function MonthGrid({ days, currentMonth, eventsByDay, onSelectDate, dotColorBy = 'regional' }: MonthGridProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    show: false,
    x: 0,
    y: 0,
    events: [],
    date: ''
  });

  const handleMouseEnter = (event: React.MouseEvent, date: Date, dayEvents: Atividade[]) => {
    if (dayEvents.length > 0) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltip({
        show: true,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        events: dayEvents,
        date: format(date, 'dd/MM/yyyy')
      });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, show: false }));
  };

  return (
    <>
      <div className="grid grid-cols-7 text-sm font-semibold text-gray-600 mb-3">
        {['DOM','SEG','TER','QUA','QUI','SEX','SÁB'].map((d) => (
          <div key={d} className="text-center py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 relative">
        {days.map((d, idx) => {
          const dayKey = d ? format(d, 'yyyy-MM-dd') : '';
          const dayEvents = d ? (eventsByDay[dayKey] ?? []) : [];
          return (
            <button
              key={idx}
              onClick={() => d && onSelectDate(d)}
              onMouseEnter={(e) => d && handleMouseEnter(e, d, dayEvents)}
              onMouseLeave={handleMouseLeave}
              className={`aspect-square rounded-xl text-sm flex flex-col items-start justify-start p-2 border-2 transition-all duration-200 ${
                !d ? 'border-transparent' : 'border-gray-100 hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 hover:border-blue-200 hover:shadow-md hover:scale-105'
              } ${d && !isSameMonth(d, currentMonth) ? 'text-gray-300' : 'text-gray-900'}`}
              aria-label={d ? `Dia ${format(d, 'd')}, ${dayEvents.length} eventos` : 'Dia vazio'}
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
        
        {/* Tooltip */}
        {tooltip.show && (
          <div
            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs pointer-events-none"
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="text-sm font-semibold text-gray-900 mb-2">
              {tooltip.date} - {tooltip.events.length} evento(s)
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {tooltip.events.map((evt) => (
                <div key={evt.id} className="flex items-start gap-2">
                  <div 
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      dotColorBy === 'type' 
                        ? TYPE_COLOR_CLASSES[evt.tipo] || 'bg-gray-400'
                        : REGIONAL_COLOR_CLASSES[evt.regional as string] || 'bg-gray-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {evt.titulo}
                    </div>
                    <div className="text-xs text-gray-500">
                      {REGIONAL_LABELS[evt.regional as string] || evt.regional}
                    </div>
                    {evt.horario && (
                      <div className="text-xs text-gray-500">
                        {evt.horario}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}