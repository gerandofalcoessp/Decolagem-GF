import React from 'react';
import { Calendar as CalendarIcon, Edit, Trash2, Users, MapPin, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';
import type { Atividade } from '@/types';

interface EventsPanelProps {
  events: Atividade[];
  onEdit: (evt: Atividade) => void;
  onDelete: (id: string) => void;
  REGIONAL_LABELS: Record<string, string>;
  REGIONAL_COLOR_CLASSES: Record<string, string>;
}

export default function EventsPanel({ events, onEdit, onDelete, REGIONAL_LABELS, REGIONAL_COLOR_CLASSES }: EventsPanelProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-white to-gray-50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xl font-bold text-gray-900">Eventos do Mês</div>
          <div className="text-sm text-gray-600">{events.length} eventos encontrados</div>
        </div>
        <CalendarIcon className="w-6 h-6 text-blue-500" aria-hidden="true" />
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {events.map((evt) => {
          const di = new Date(evt.data_inicio);
          const df = evt.data_fim ? new Date(evt.data_fim) : null;
          const regionalColor = REGIONAL_COLOR_CLASSES[evt.regional as string] || 'bg-gray-400';
          return (
            <div key={evt.id} className="border-2 border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-md transition-all duration-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 mb-1">{evt.titulo}</div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <div className={`w-3 h-3 rounded-full ${regionalColor}`}></div>
                    <span className="font-medium">{REGIONAL_LABELS[evt.regional as string]}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    aria-label={`Editar evento ${evt.titulo}`}
                    onClick={() => onEdit(evt)} 
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Edit className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button 
                    aria-label={`Excluir evento ${evt.titulo}`}
                    onClick={() => onDelete(evt.id)} 
                    className="p-2 rounded-lg border border-gray-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" aria-hidden="true" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>{format(di, 'dd/MM/yyyy')}</span>
                  {df && <span className="mx-2">até {format(df, 'dd/MM/yyyy')}</span>}
                </div>
                {evt.local && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span>{evt.local}</span>
                  </div>
                )}
                {evt.participantes_confirmados > 0 && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" aria-hidden="true" />
                    <span>{evt.participantes_confirmados} participantes</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-center py-8">
            <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
            <div className="text-gray-500">Nenhum evento encontrado para este mês</div>
            <div className="text-sm text-gray-400 mt-1">Ajuste os filtros ou crie um novo evento</div>
          </div>
        )}
      </div>
    </Card>
  );
}