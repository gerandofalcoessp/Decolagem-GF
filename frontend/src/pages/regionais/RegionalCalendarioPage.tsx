import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus,
  Calendar as CalendarIcon,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Atividade, Regional, Status, TipoAtividade } from '@/types';
import NovoEventoModal from '@/components/modals/NovoEventoModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useCalendarEvents } from '@/hooks/useApi';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';

import CalendarHeader from '@/pages/calendario/components/CalendarHeader';
import MonthGrid from '@/pages/calendario/components/MonthGrid';
import { REGIONAL_LABELS } from '@/pages/calendario/constants';

export default function RegionalCalendarioPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const { user } = useAuthStore();
  
  // Usar a regional do usuário logado em vez do parâmetro da URL
  const regionalParam = params.get('regional') as Regional | null;
  const userRegional = user?.regional;
  
  // Mapear a regional do usuário para o formato correto
  const getRegionalKey = (regional: string | undefined): Regional => {
    if (!regional) return 'nacional';
    
    // Normalizar o nome da regional
    const normalizedRegional = regional.toLowerCase().trim();
    
    // Mapeamento de regionais
    const regionalMapping: Record<string, Regional> = {
      'norte': 'norte',
      'r. norte': 'norte',
      'regional norte': 'norte',
      'nordeste': 'nordeste_1',
      'nordeste 1': 'nordeste_1',
      'r. nordeste 1': 'nordeste_1',
      'nordeste 2': 'nordeste_2',
      'r. nordeste 2': 'nordeste_2',
      'centro-oeste': 'centro_oeste',
      'centro oeste': 'centro_oeste',
      'r. centro-oeste': 'centro_oeste',
      'mg/es': 'mg_es',
      'mg es': 'mg_es',
      'r. mg/es': 'mg_es',
      'minas gerais': 'mg_es',
      'espírito santo': 'mg_es',
      'rio de janeiro': 'rj',
      'r. rio de janeiro': 'rj',
      'rj': 'rj',
      'são paulo': 'sp',
      'r. são paulo': 'sp',
      'sp': 'sp',
      'sul': 'sul',
      'r. sul': 'sul',
      'nacional': 'nacional',
      'comercial': 'comercial'
    };
    
    return regionalMapping[normalizedRegional] || 'nacional';
  };
  
  const regionalId: Regional = userRegional ? getRegionalKey(userRegional) : (regionalParam ?? 'nacional');
  
  // Debug logs para verificar os valores
  console.log('🔍 DEBUG RegionalCalendarioPage:');
  console.log('- userRegional:', userRegional);
  console.log('- regionalParam:', regionalParam);
  console.log('- regionalId:', regionalId);
  console.log('- REGIONAL_LABELS[regionalId]:', REGIONAL_LABELS[regionalId]);
  
  // Corrigir a lógica do regionalLabel - priorizar o nome da regional do usuário
  let regionalLabel: string;
  
  if (userRegional && userRegional !== 'nacional') {
    // Se o usuário tem uma regional específica, usar o nome dela
    regionalLabel = REGIONAL_LABELS[regionalId] || userRegional;
  } else {
    // Caso contrário, usar o mapeamento padrão
    regionalLabel = REGIONAL_LABELS[regionalId] || 'Nacional';
  }
  
  console.log('- regionalLabel final:', regionalLabel);

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showNovoEventoModal, setShowNovoEventoModal] = useState(false);
  const [events, setEvents] = useState<Atividade[]>([]);
  const [editingEvent, setEditingEvent] = useState<Atividade | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const { addNotification } = useNotificationStore();

  // Estado para o modal Novo Evento simplificado
  const [novoEventoForm, setNovoEventoForm] = useState({
    atividade: '',
    responsavel: '',
    descricao: '',
    data: '',
    hora: ''
  });

  // Hook para gerenciar eventos de calendário
  const { data: calendarData, loading, error, refetch, createEvent, updateEvent } = useCalendarEvents();

  // Carregar eventos do backend
  useEffect(() => {
    if (calendarData) {
      setEvents(calendarData);
    }
  }, [calendarData]);

  const resetForm = () => {
    setNovoEventoForm({
      atividade: '',
      responsavel: '',
      descricao: '',
      data: '',
      hora: ''
    });
    setEditingEvent(null);
  };

  const openEditModal = (event: Atividade) => {
    const eventDate = new Date(event.data_inicio);
    const formattedDate = format(eventDate, 'yyyy-MM-dd');
    const formattedTime = format(eventDate, 'HH:mm');
    
    setEditingEvent(event);
    setNovoEventoForm({
      atividade: event.titulo || '',
      responsavel: event.responsavel?.id || '',
      descricao: event.descricao || '',
      data: formattedDate,
      hora: formattedTime
    });
    setShowNovoEventoModal(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setShowConfirmModal(true);
  };

  const confirmDeleteEvent = () => {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
      setEventToDelete(null);
      addNotification({
        type: 'success',
        title: 'Evento excluído',
        message: 'Evento excluído com sucesso!'
      });
    }
  };

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const list = eachDayOfInterval({ start, end });
    const firstWeekday = getDay(start); // 0(dom) - 6(sab)
    const leading = Array(firstWeekday).fill(null);
    return [...leading, ...list];
  }, [currentMonth]);

  const eventsOfMonth = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return events
      .filter((e) => {
        const d = new Date(e.data_inicio);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .sort((a, b) => +new Date(a.data_inicio) - +new Date(b.data_inicio));
  }, [events, currentMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, Atividade[]> = {};
    for (const e of eventsOfMonth) {
      const key = format(new Date(e.data_inicio), 'yyyy-MM-dd');
      (map[key] ||= []).push(e);
    }
    return map;
  }, [eventsOfMonth]);

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/regionais')} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            aria-label="Voltar para regionais"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendário - {regionalLabel}</h1>
            <p className="text-gray-600">Gerencie atividades e eventos da regional</p>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setShowNovoEventoModal(true)} aria-label="Criar novo evento">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário */}
        <Card className="p-6">
          <CalendarHeader
            currentMonth={currentMonth}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />

          <MonthGrid
            days={days}
            currentMonth={currentMonth}
            eventsByDay={eventsByDay}
            onSelectDate={(d) => d && console.log('Date selected:', d)}
            dotColorBy="type"
          />
        </Card>

        {/* Eventos do mês */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-gray-900">Eventos do Mês ({eventsOfMonth.length})</div>
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            {eventsOfMonth.map((evt) => {
              const di = new Date(evt.data_inicio);
              const df = evt.data_fim ? new Date(evt.data_fim) : null;
              
              return (
                <div key={evt.id} className="group relative bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                  {/* Header do Evento */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                        {evt.titulo}
                      </h3>
                      {evt.regional && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                          <span className="text-sm font-medium text-indigo-600">
                            {REGIONAL_LABELS[evt.regional as Regional] || evt.regional}
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
                    {(((evt.participantes_esperados ?? 0) > 0) || ((evt.participantes_confirmados ?? 0) > 0)) && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 rounded bg-cyan-100 flex items-center justify-center">
                          <div className="w-2 h-2 rounded bg-cyan-500"></div>
                        </div>
                        <span className="font-medium">Participantes:</span>
                        <div className="flex gap-2">
                          {(evt.participantes_confirmados ?? 0) > 0 && (
                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-medium">
                              {evt.participantes_confirmados} confirmados
                            </span>
                          )}
                          {(evt.participantes_esperados ?? 0) > 0 && (
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

                  {/* Botões de Ação */}
                  <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(evt)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir
                    </Button>
                  </div>

                  {/* Hover Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                </div>
              );
            })}
            {eventsOfMonth.length === 0 && (
              <div className="text-sm text-gray-600">Nenhum evento encontrado para este mês.</div>
            )}
          </div>
        </Card>
      </div>

      {/* Modal Novo Evento Simplificado */}
      <NovoEventoModal
        isOpen={showNovoEventoModal}
        onClose={() => {
          setShowNovoEventoModal(false);
          resetForm();
        }}
        form={novoEventoForm}
        setForm={setNovoEventoForm}
        regionalId={regionalId}
        regionalLabel={regionalLabel}
        editingEvent={editingEvent}
        onSubmit={async (data) => {
          try {
            console.log('📝 Dados do formulário recebidos:', data);
            
            // Função para converter data do formato dd/mm/yyyy para yyyy-mm-dd
            const convertDateFormat = (dateStr: string): string => {
              if (dateStr.includes('/')) {
                const [day, month, year] = dateStr.split('/');
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              return dateStr;
            };

            const formattedDate = convertDateFormat(data.data);
            const startDateTime = data.hora ? `${formattedDate}T${data.hora}:00` : `${formattedDate}T00:00:00`;
            const endDateTime = data.hora ? `${formattedDate}T${data.hora}:00` : `${formattedDate}T23:59:59`;

            // Mapear dados do formulário para a estrutura da tabela calendar_events
            const eventData = {
              titulo: data.atividade,
              descricao: data.descricao,
              data_inicio: startDateTime,
              data_fim: endDateTime,
              regional: regionalId,
              responsavel_id: data.responsavel // Assumindo que responsavel é um ID
            };

            console.log('📤 Enviando dados para API:', eventData);
            
            if (editingEvent) {
              // Atualizar evento via API
              console.log('🔄 Atualizando evento:', editingEvent.id);
              const eventoAtualizado = await updateEvent(editingEvent.id, eventData);
              
              console.log('✅ Evento atualizado na API:', eventoAtualizado);
              
              // Atualizar lista local de eventos
              await refetch();
              
              addNotification({
                type: 'success',
                title: 'Evento atualizado',
                message: 'Evento atualizado com sucesso!'
              });
            } else {
              // Criar evento via API
              const novoEvento = await createEvent(eventData);
              
              console.log('✅ Evento criado na API:', novoEvento);
              
              // Atualizar lista local de eventos
              await refetch();
              
              addNotification({
                type: 'success',
                title: 'Evento criado',
                message: 'Evento criado com sucesso!'
              });
            }
            
            setShowNovoEventoModal(false);
            resetForm();
          } catch (error) {
            console.error('❌ Erro ao processar evento:', error);
            addNotification({
              type: 'error',
              title: editingEvent ? 'Erro ao atualizar evento' : 'Erro ao criar evento',
              message: error instanceof Error ? error.message : 'Erro desconhecido'
            });
          }
        }}
      />

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setEventToDelete(null);
        }}
        onConfirm={confirmDeleteEvent}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}