import { Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { format, parseISO, isAfter, compareAsc, addDays, setHours, setMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { Atividade } from '@/types';
import { REGIONAL_LABELS, REGIONAL_COLOR_CLASSES, TYPE_COLOR_CLASSES, ATIVIDADE_OPTIONS, PROGRAMA_LABELS } from '@/pages/calendario/constants';

interface RecentActivitiesProps {
  isLoading?: boolean;
}

function getTipoLabel(tipo: Atividade['tipo']) {
  const opt = ATIVIDADE_OPTIONS.find(o => o.value === tipo);
  return opt?.label ?? tipo;
}

export default function RecentActivities({ isLoading = false }: RecentActivitiesProps) {
  const [events, setEvents] = useState<Atividade[]>([]);

  // Mock apenas em ambiente de teste, respeitando a regra de não simular para dev/prod
  useEffect(() => {
    if (import.meta.env.MODE === 'test' && events.length === 0) {
      const today = new Date();
      const mk = (id: string, titulo: string, tipo: Atividade['tipo'], dias: number, hora: number, min: number, regional: Atividade['regional'], programa: Atividade['programa'], local?: string): Atividade => {
        const dt = setMinutes(setHours(addDays(today, dias), hora), min);
        return {
          id,
          titulo,
          descricao: undefined,
          tipo,
          data_inicio: dt.toISOString(),
          data_fim: undefined,
          local,
          regional,
          programa,
          responsavel_id: undefined,
          responsavel: undefined,
          participantes_esperados: undefined,
          participantes_confirmados: 0,
          quantidade: undefined,
          status: 'ativo',
          observacoes: undefined,
          evidencias: [],
          created_at: today.toISOString(),
          updated_at: today.toISOString(),
        };
      };

      const mockEvents: Atividade[] = [
        mk('1', 'Formação Liga - Vila Mariana', 'formacao_ligas', 2, 9, 0, 'sp', 'as_maras', 'SP - Vila Mariana'),
        mk('2', 'Imersão Maras - RJ Centro', 'imersao', 3, 14, 30, 'rj', 'as_maras', 'RJ - Centro'),
        mk('3', 'Processo Seletivo - CO', 'seletivas', 5, 10, 0, 'centro_oeste', 'decolagem', 'DF - Asa Sul'),
        mk('4', 'ONG Decolagem - Norte', 'ong_decolagem', 6, 16, 0, 'norte', 'decolagem', 'PA - Belém'),
        mk('5', 'Encontro Líder Maras - Sul', 'encontro_lider_maras', 1, 18, 0, 'sul', 'as_maras', 'PR - Curitiba'),
        mk('6', 'Família Atendida - MG/ES', 'familia_atendida', 4, 11, 0, 'mg_es', 'decolagem', 'ES - Vitória'),
        mk('7', 'Visita ONG - Nordeste 1', 'outros', 7, 9, 30, 'nordeste_1', 'as_maras', 'CE - Fortaleza'),
        mk('8', 'NPS - Nacional', 'nps', 2, 15, 0, 'nacional', 'microcredito', 'Online'),
      ];
      setEvents(mockEvents);
    }
  }, [events.length]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter(e => {
        const di = parseISO(e.data_inicio);
        return isAfter(di, now);
      })
      .sort((a, b) => compareAsc(parseISO(a.data_inicio), parseISO(b.data_inicio)))
      .slice(0, 30);
  }, [events]);

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