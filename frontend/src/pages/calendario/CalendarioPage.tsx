import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  X,
  Filter,
  Users,
  MapPin,
  Clock
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Atividade, TipoAtividade } from '@/types';
import FiltersPanel from './components/FiltersPanel';
import EventsPanel from './components/EventsPanel';
import EventModal from './components/EventModal';
import { REGIONAL_LABELS, DEPARTAMENTO_LABELS, ATIVIDADE_OPTIONS, TYPE_COLOR_CLASSES, REGIONAL_COLOR_CLASSES } from './constants';
import CalendarHeader from './components/CalendarHeader';
import MonthGrid from './components/MonthGrid';



export default function CalendarioPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [events, setEvents] = useState<Atividade[]>([]);
  const [customTypes, setCustomTypes] = useState<{ value: TipoAtividade; label: string }[]>([]);
  
  // Filtros
  const [selectedRegional, setSelectedRegional] = useState<string>('todas');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  // Dados de exemplo para demonstração
  useEffect(() => {
    if (import.meta.env.MODE === 'test' && events.length === 0) {
      const year = 2025;
      const month = 8; // setembro (0-based)
      const mockEvents: Atividade[] = [
        // Nacional
        {
          id: 'evt-nacional-1',
          titulo: 'Reunião Estratégica Nacional',
          descricao: 'Planejamento trimestral',
          tipo: 'encontros',
          data_inicio: new Date(year, month, 5, 14, 0).toISOString(),
          data_fim: new Date(year, month, 5, 17, 0).toISOString(),
          local: 'Sede Nacional',
          regional: 'nacional' as any,
          programa: 'decolagem',
          participantes_confirmados: 25,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // Comercial
        {
          id: 'evt-comercial-1',
          titulo: 'Treinamento Vendas',
          descricao: 'Capacitação equipe comercial',
          tipo: 'formacao_ligas',
          data_inicio: new Date(year, month, 8, 9, 0).toISOString(),
          data_fim: new Date(year, month, 8, 12, 0).toISOString(),
          local: 'Escritório Comercial',
          regional: 'comercial' as any,
          programa: 'decolagem',
          participantes_confirmados: 15,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // Centro-Oeste
        {
          id: 'evt-co-1',
          titulo: 'Imersão Maras Centro-Oeste',
          descricao: 'Programa intensivo de formação',
          tipo: 'imersao',
          data_inicio: new Date(year, month, 12, 8, 0).toISOString(),
          data_fim: new Date(year, month, 14, 18, 0).toISOString(),
          local: 'Campo Grande - MS',
          regional: 'centro_oeste' as any,
          programa: 'decolagem',
          participantes_confirmados: 30,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // Nordeste
        {
          id: 'evt-ne1-1',
          titulo: 'Processo Seletivo Nordeste 1',
          descricao: 'Seleção novos participantes',
          tipo: 'seletivas',
          data_inicio: new Date(year, month, 18, 14, 0).toISOString(),
          data_fim: new Date(year, month, 18, 17, 0).toISOString(),
          local: 'Recife - PE',
          regional: 'nordeste_1' as any,
          programa: 'decolagem',
          participantes_confirmados: 50,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // São Paulo
        {
          id: 'evt-sp-1',
          titulo: 'Encontro Regional SP',
          descricao: 'Alinhamento mensal',
          tipo: 'encontros',
          data_inicio: new Date(year, month, 22, 19, 0).toISOString(),
          data_fim: new Date(year, month, 22, 21, 0).toISOString(),
          local: 'São Paulo - SP',
          regional: 'sp' as any,
          programa: 'decolagem',
          participantes_confirmados: 40,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        // Sul
        {
          id: 'evt-sul-1',
          titulo: 'Visita ONGs Parceiras',
          descricao: 'Acompanhamento projetos',
          tipo: 'outros',
          data_inicio: new Date(year, month, 25, 10, 0).toISOString(),
          data_fim: new Date(year, month, 25, 16, 0).toISOString(),
          local: 'Porto Alegre - RS',
          regional: 'sul' as any,
          programa: 'decolagem',
          participantes_confirmados: 12,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      setEvents(mockEvents);
      setCurrentMonth(new Date(year, month, 1));
    }
  }, [events.length]);

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
  const [form, setForm] = useState({
    atividade: '' as TipoAtividade | '',
    atividadeLabel: '',
    atividadeCustomLabel: '',
    responsavel: '',
    descricao: '',
    dataAtividade: '',
    regional: 'nacional' as string,
    local: '',
    estados: [] as string[],
    programa: '' as any,
    instituicaoId: '' as string,
    evidencias: [] as any[],
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
      programa: '' as any,
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
      regional: evt.regional as string,
      local: evt.local ?? '',
      estados: [],
      programa: evt.programa ?? 'decolagem',
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
          <h1 className="text-3xl font-bold text-gray-900">Calendário Global</h1>
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
            onSelectDate={(d) => setSelectedDate(d)}
          />
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