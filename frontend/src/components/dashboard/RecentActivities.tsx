import { Calendar as CalendarIcon, MapPin, Clock, Users } from 'lucide-react';
import { useMemo } from 'react';
import { format, parseISO, isAfter, compareAsc } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Atividade } from '../../types';
import { REGIONAL_LABELS, REGIONAL_COLOR_CLASSES, TYPE_COLOR_CLASSES, ATIVIDADE_OPTIONS, PROGRAMA_LABELS } from '../../pages/calendario/constants';
import { useCalendarEvents } from '../../hooks/useApi';

interface RecentActivitiesProps {
  isLoading?: boolean;
}

function getTipoLabel(tipo: Atividade['tipo']) {
  const opt = ATIVIDADE_OPTIONS.find(o => o.value === tipo);
  return opt?.label ?? tipo;
}

export default function RecentActivities({ isLoading = false }: RecentActivitiesProps) {
  const { data: activities } = useCalendarEvents();

  const upcomingEvents = useMemo(() => {
    if (!activities || !Array.isArray(activities)) return [];
    
    const now = new Date();
    return (activities as Atividade[])
      .filter((e: Atividade) => {
        const di = parseISO(e.data_inicio);
        return isAfter(di, now);
      })
      .sort((a: Atividade, b: Atividade) => compareAsc(parseISO(a.data_inicio), parseISO(b.data_inicio)))
      .slice(0, 5);
  }, [activities]);

  const eventsByRegional = useMemo(() => {
    const map: Record<string, Atividade[]> = {};
    for (const e of upcomingEvents) {
      const key = e.regional ?? 'nacional';
      if (!map[key]) map[key] = [];
      map[key].push(e);
    }
    return map;
  }, [upcomingEvents]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-56" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
        </div>
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos Agendados</h3>
        <a href="/calendario" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Ver calendário</a>
      </div>

      {/* Conteúdo por Regional (áreas) */}
      <div className="space-y-6">
        {Object.entries(eventsByRegional).map(([regional, list]) => (
          <div key={regional} className="rounded-lg border border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <span className={`inline-block h-2 w-2 rounded-full ${REGIONAL_COLOR_CLASSES[regional] ?? 'bg-gray-400'}`} />
                <span className="text-sm font-semibold text-gray-900">{REGIONAL_LABELS[regional] ?? regional}</span>
                <span className="text-xs text-gray-500">({list.length})</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-1" /> Próximos compromissos
              </div>
            </div>

            <ul className="divide-y">
              {list.map((evt) => {
                const di = parseISO(evt.data_inicio);
                const tipoClass = TYPE_COLOR_CLASSES[evt.tipo] ?? 'bg-gray-400';
                const programaLabel = evt.programa ? PROGRAMA_LABELS[evt.programa] : undefined;
                return (
                  <li key={evt.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 inline-block h-2.5 w-2.5 rounded ${tipoClass}`} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">{evt.titulo}</p>
                          <span className="text-xs text-gray-500 ml-2">{format(di, 'dd/MM (EEE), HH:mm', { locale: ptBR })}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                          {programaLabel && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{programaLabel}</span>
                          )}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{getTipoLabel(evt.tipo)}</span>
                          {evt.responsavel?.nome && (
                            <span className="inline-flex items-center">
                              <Users className="w-3.5 h-3.5 mr-1 text-gray-500" />
                              {evt.responsavel.nome}
                            </span>
                          )}
                          {evt.local && (
                            <span className="inline-flex items-center">
                              <MapPin className="w-3.5 h-3.5 mr-1 text-gray-500" />
                              {evt.local}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              {list.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-gray-600">Nenhum compromisso futuro nesta área</li>
              )}
            </ul>
          </div>
        ))}

        {/* Estado vazio geral */}
        {Object.keys(eventsByRegional).length === 0 && (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Nenhum evento futuro encontrado.</p>
            <p className="text-gray-500 text-sm mt-1">Acesse o calendário para agendar novos compromissos.</p>
            <a href="/calendario" className="mt-3 inline-flex items-center px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm hover:bg-primary-700 transition-colors">
              <CalendarIcon className="w-4 h-4 mr-2" /> Ir para Calendário
            </a>
          </div>
        )}
      </div>
    </div>
  );
}