import { useState, useEffect, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay } from 'date-fns';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Atividade, TipoAtividade, EventForm } from '../../types';
import FiltersPanel from './components/FiltersPanel';
import EventsPanel from './components/EventsPanel';
import EventModal from './components/EventModal';
import { REGIONAL_LABELS, DEPARTAMENTO_LABELS, ATIVIDADE_OPTIONS, REGIONAL_COLOR_CLASSES } from './constants';
import CalendarHeader from './components/CalendarHeader';
import MonthGrid from './components/MonthGrid';
import { useCalendarEvents } from '../../hooks/useApi';



export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [events, setEvents] = useState<Atividade[]>([]);
  const [customTypes, setCustomTypes] = useState<{ value: TipoAtividade; label: string }[]>([]);
  
  // Filtros
  const [selectedRegional, setSelectedRegional] = useState<string>('todas');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  // Carregar eventos de calendário do backend (modo global)
  const { data: calendarData, loading, error } = useCalendarEvents(true);

  useEffect(() => {
    if (calendarData) {
      setEvents(calendarData);
    }
  }, [calendarData]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const list = eachDayOfInterval({ start, end });
    const firstWeekday = getDay(start); // 0(dom) - 6(sab)
    const leading = Array(firstWeekday).fill(null);
    return [...leading, ...list];
  }, [currentMonth]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const regionalMatch = selectedRegional === 'todas' || e.regional === selectedRegional;
      const departamentoMatch = selectedDepartamento === 'todos' || 
        (selectedDepartamento === 'regionais' && !['nacional', 'comercial'].includes(e.regional as string)) ||
        (selectedDepartamento === 'comercial' && e.regional === 'comercial') ||
        (selectedDepartamento === 'nacional' && e.regional === 'nacional');
      
      return regionalMatch && departamentoMatch;
    });
  }, [events, selectedRegional, selectedDepartamento]);

  const eventsOfMonth = useMemo(() => {
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();
    return filteredEvents
      .filter((e) => {
        const d = new Date(e.data_inicio);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .sort((a, b) => +new Date(a.data_inicio) - +new Date(b.data_inicio));
  }, [filteredEvents, currentMonth]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, Atividade[]> = {};
    for (const e of eventsOfMonth) {
      const key = format(new Date(e.data_inicio), 'yyyy-MM-dd');
      (map[key] ||= []).push(e);
    }
    return map;
  }, [eventsOfMonth]);

  // Form state para modal
  const [form, setForm] = useState<EventForm>({
    atividade: '',
    atividadeLabel: '',
    atividadeCustomLabel: '',
    responsavel: '',
    descricao: '',
    dataAtividade: '',
    regional: 'nacional',
    local: '',
    estados: [],
    programa: '',
    instituicaoId: '',
    evidencias: [],
    quantidade: undefined,
  });

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ 
      atividade: '', 
      atividadeLabel: '', 
      atividadeCustomLabel: '', 
      responsavel: '', 
      descricao: '', 
      dataAtividade: '', 
      regional: 'nacional',
      local: '',
      estados: [],
      programa: '',
      instituicaoId: '',
      evidencias: [],
      quantidade: undefined,
    });
    setShowModal(true);
  };

  const openEditModal = (evt: Atividade) => {
    setEditingId(evt.id);
    const di = new Date(evt.data_inicio);
    const matched = [...ATIVIDADE_OPTIONS, ...customTypes].find(o => o.label === evt.titulo);
    setForm({
      atividade: matched?.value ?? evt.tipo,
      atividadeLabel: evt.titulo,
      atividadeCustomLabel: '',
      responsavel: evt.responsavel?.nome ?? '',
      descricao: evt.descricao ?? '',
      dataAtividade: format(di, 'yyyy-MM-dd'),
      regional: evt.regional ?? 'nacional',
      local: evt.local ?? '',
      estados: [],
      programa: evt.programa ?? '',
      instituicaoId: '',
      evidencias: evt.evidencias || [],
      quantidade: evt.quantidade,
    });
    setShowModal(true);
  };

  const submitForm = () => {
    if (!form.atividade || !form.dataAtividade || !form.regional) return;
    const startIso = new Date(`${form.dataAtividade}T00:00:00`).toISOString();
    const selectedLabel = form.atividadeLabel || ATIVIDADE_OPTIONS.find(o => o.value === form.atividade)?.label || 'Novo Evento';
    const title = selectedLabel === 'OUTRA' && form.atividadeCustomLabel.trim() ? form.atividadeCustomLabel.trim() : selectedLabel;
  
    if (editingId) {
      setEvents((prev) => prev.map((e) => e.id === editingId ? { 
        ...e, 
        titulo: title, 
        tipo: form.atividade as TipoAtividade, 
        descricao: form.descricao, 
        data_inicio: startIso, 
        data_fim: undefined,
        regional: form.regional as any,
        local: form.local,
        programa: form.programa || undefined,
        evidencias: form.evidencias,
        quantidade: form.quantidade,
        updated_at: new Date().toISOString() 
      } : e));
    } else {
      const novo: Atividade = {
        id: `evt-${Date.now()}`,
        titulo: title,
        descricao: form.descricao,
        tipo: form.atividade as TipoAtividade,
        data_inicio: startIso,
        data_fim: undefined,
        local: form.local || undefined,
        regional: form.regional as any,
        programa: (form.programa as any) || 'decolagem',
        participantes_confirmados: 0,
        status: 'ativo',
        evidencias: form.evidencias,
        quantidade: form.quantidade,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, novo]);
    }
    setShowModal(false);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Calendário Global</h1>
          <p className="text-gray-600">Visualize e gerencie eventos de todas as regionais, comercial e nacional</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filtros</span>
          </Button>
          <Button onClick={openCreateModal} className="bg-pink-500 hover:bg-pink-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <FiltersPanel
          selectedRegional={selectedRegional}
          selectedDepartamento={selectedDepartamento}
          onChangeRegional={(value) => setSelectedRegional(value)}
          onChangeDepartamento={(value) => setSelectedDepartamento(value)}
          eventsOfMonthCount={eventsOfMonth.length}
          filteredEventsCount={filteredEvents.length}
          REGIONAL_LABELS={REGIONAL_LABELS}
          DEPARTAMENTO_LABELS={DEPARTAMENTO_LABELS}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendário */}
        <Card className="xl:col-span-2 p-6 bg-gradient-to-br from-white to-gray-50">
          <CalendarHeader
            currentMonth={currentMonth}
            onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
            onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
          <MonthGrid
            days={days}
            currentMonth={currentMonth}
            eventsByDay={eventsByDay}
            onSelectDate={() => {}} // Função vazia por enquanto
            dotColorBy="regional"
          />
          
          {/* Legenda de Cores por Regional */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Legenda por Regional</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(REGIONAL_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${REGIONAL_COLOR_CLASSES[key as keyof typeof REGIONAL_COLOR_CLASSES] || 'bg-gray-400'}`}></div>
                  <span className="text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Eventos do mês */}
        <EventsPanel
          events={eventsOfMonth}
          onEdit={openEditModal}
          onDelete={deleteEvent}
          REGIONAL_LABELS={REGIONAL_LABELS}
          REGIONAL_COLOR_CLASSES={REGIONAL_COLOR_CLASSES}
        />
      </div>

      {/* Modal Novo Evento */}
      {showModal && (
        <EventModal
          isOpen={showModal}
          editingId={editingId}
          form={form}
          setForm={setForm}
          customTypes={customTypes}
          setCustomTypes={setCustomTypes}
          REGIONAL_LABELS={REGIONAL_LABELS}
          ATIVIDADE_OPTIONS={ATIVIDADE_OPTIONS}
          onClose={() => setShowModal(false)}
          onSubmit={submitForm}
        />
      )}
    </div>
  );
}