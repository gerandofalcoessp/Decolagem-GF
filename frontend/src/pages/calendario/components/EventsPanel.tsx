import { Calendar as CalendarIcon, Edit, Trash2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { format } from 'date-fns';
import type { Atividade } from '../../../types';

interface EventsPanelProps {
  events: Atividade[];
  onEdit: (evt: Atividade) => void;
  onDelete: (id: string) => void;
  REGIONAL_LABELS: Record<string, string>;
  REGIONAL_COLOR_CLASSES: Record<string, string>;
}

export default function EventsPanel({ events, onEdit, onDelete, REGIONAL_LABELS }: EventsPanelProps) {
  // Função para obter a cor de fundo baseada na regional
  const getRegionalBackgroundColor = (regional: string) => {
    const regionalColors: { [key: string]: string } = {
      'Norte': 'rgba(59, 130, 246, 0.1)', // blue-500 com 10% de opacidade
      'Nordeste': 'rgba(34, 197, 94, 0.1)', // green-500 com 10% de opacidade
      'Centro-Oeste': 'rgba(251, 191, 36, 0.1)', // yellow-500 com 10% de opacidade
      'Sudeste': 'rgba(239, 68, 68, 0.1)', // red-500 com 10% de opacidade
      'Sul': 'rgba(168, 85, 247, 0.1)', // purple-500 com 10% de opacidade
    };
    
    return regionalColors[regional] || 'rgba(156, 163, 175, 0.1)'; // gray-400 como fallback
  };

  // Função para obter a cor do ponto da regional
  const getRegionalColor = (regional: string) => {
    const regionalColors: { [key: string]: string } = {
      'Norte': '#3B82F6', // blue-500
      'Nordeste': '#22C55E', // green-500
      'Centro-Oeste': '#FBB928', // yellow-500
      'Sudeste': '#EF4444', // red-500
      'Sul': '#A855F7', // purple-500
    };
    
    return regionalColors[regional] || '#9CA3AF'; // gray-400 como fallback
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold text-gray-900">Eventos do Mês ({events.length})</div>
        <CalendarIcon className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {events.map((evt) => {
          const di = new Date(evt.data_inicio);
          const df = evt.data_fim ? new Date(evt.data_fim) : null;
          
          return (
            <div 
              key={evt.id} 
              className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200"
              style={{ backgroundColor: getRegionalBackgroundColor(REGIONAL_LABELS[evt.regional as string] || '') }}
            >
              {/* Header do Evento */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                    {evt.titulo}
                  </h3>
                  {evt.regional && (
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: getRegionalColor(REGIONAL_LABELS[evt.regional as string] || '') }}
                      ></div>
                      <span className="text-sm font-medium text-indigo-600">
                        {REGIONAL_LABELS[evt.regional as string]}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informações do Evento */}
              <div className="grid grid-cols-1 gap-3 mb-4">
                {/* Datas */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <CalendarIcon className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">Data:</span>
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                    {format(di, 'dd/MM/yyyy')}
                  </span>
                  {df && df.getTime() !== di.getTime() && (
                    <>
                      <span className="text-gray-400">até</span>
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md font-medium">
                        {format(df, 'dd/MM/yyyy')}
                      </span>
                    </>
                  )}
                </div>

                {/* Responsável */}
                {evt.responsavel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded bg-purple-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-purple-500"></div>
                    </div>
                    <span className="font-medium">Responsável:</span>
                    <span className="capitalize">{evt.responsavel.nome || evt.responsavel.email}</span>
                  </div>
                )}

                {/* Horário */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 rounded bg-orange-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded bg-orange-500"></div>
                  </div>
                  <span className="font-medium">Horário:</span>
                  <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded-md font-medium">
                    {evt.data_inicio.includes('T') ? evt.data_inicio.split('T')[1].substring(0, 5) : format(new Date(evt.data_inicio), 'HH:mm')}
                  </span>
                </div>

                {/* Local */}
                {evt.local && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded bg-green-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-green-500"></div>
                    </div>
                    <span className="font-medium">Local:</span>
                    <span>{evt.local}</span>
                  </div>
                )}

                {/* Programa */}
                {evt.programa && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-blue-500"></div>
                    </div>
                    <span className="font-medium">Programa:</span>
                    <span>{evt.programa}</span>
                  </div>
                )}

                {/* Participantes - só exibir se houver participantes */}
                {((evt.participantes_esperados && evt.participantes_esperados > 0) || (evt.participantes_confirmados && evt.participantes_confirmados > 0)) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 rounded bg-cyan-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded bg-cyan-500"></div>
                    </div>
                    <span className="font-medium">Participantes:</span>
                    <div className="flex gap-2">
                      {evt.participantes_confirmados > 0 && (
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                          {evt.participantes_confirmados} confirmados
                        </span>
                      )}
                      {evt.participantes_esperados > 0 && (
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {evt.participantes_esperados} esperados
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              {evt.descricao && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    <span className="font-medium text-gray-700">Descrição:</span> {evt.descricao}
                  </p>
                </div>
              )}



              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div className="text-center py-12">
            <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <div className="text-lg font-medium text-gray-500 mb-2">Nenhum evento encontrado</div>
            <div className="text-sm text-gray-400">Ajuste os filtros ou crie um novo evento para começar</div>
          </div>
        )}
      </div>
    </Card>
  );
}