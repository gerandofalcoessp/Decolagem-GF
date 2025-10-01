import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, getDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Atividade, TipoAtividade, Regional } from '@/types';
import GestaoAtividadesModal from './components/GestaoAtividadesModal';

import CalendarHeader from '@/pages/calendario/components/CalendarHeader';
import MonthGrid from '@/pages/calendario/components/MonthGrid';
import EventModal from '@/pages/calendario/components/EventModal';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS } from '@/pages/calendario/constants';
import { toIso } from '@/utils/date';
import { useConflictWarning } from '@/hooks/useConflictWarning';
export default function RegionalCalendarioPage() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const regionalParam = params.get('regional') as Regional | null
  const regionalId: Regional = regionalParam ?? 'nacional'
  const regionalLabel = REGIONAL_LABELS[regionalId] ?? 'Nacional';

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [events, setEvents] = useState<Atividade[]>([]);
  const [customTypes, setCustomTypes] = useState<{ value: TipoAtividade; label: string }[]>([]);
  const [showGestao, setShowGestao] = useState(false);

  // Dados de exemplo apenas em ambiente de desenvolvimento
  useEffect(() => {
    if (import.meta.env.MODE === 'test' && events.length === 0) {
      const year = 2025;
      const month = 8; // setembro (0-based)
      setEvents([
        {
          id: 'evt-1',
          titulo: 'Encontro Online',
          descricao: 'Reunião de alinhamento',
          tipo: 'encontros',
          data_inicio: new Date(year, month, 4, 19, 0).toISOString(),
          data_fim: new Date(year, month, 4, 21, 0).toISOString(),
          local: 'Online',
          regional: regionalId,
          programa: 'decolagem',
          participantes_confirmados: 0,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'evt-2',
          titulo: 'Encontro Presencial',
          descricao: 'Oficina com consultores',
          tipo: 'encontros',
          data_inicio: new Date(year, month, 27, 9, 0).toISOString(),
          data_fim: new Date(year, month, 27, 12, 0).toISOString(),
          local: 'Sede Regional',
          regional: regionalId,
          programa: 'decolagem',
          participantes_confirmados: 0,
          status: 'ativo',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
      setCurrentMonth(new Date(year, month, 1));
    }
  }, [events.length, regionalId]);

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
        return d.getMonth() === month && d.getFullYear() === year && e.regional === regionalId
      })
      .sort((a, b) => +new Date(a.data_inicio) - +new Date(b.data_inicio));
  }, [events, currentMonth, regionalId]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, Atividade[]> = {};
    for (const e of eventsOfMonth) {
      const key = format(new Date(e.data_inicio), 'yyyy-MM-dd');
      (map[key] ||= []).push(e);
    }
    return map;
  }, [eventsOfMonth]);

  // Aviso de conflito foi movido logo após a definição do estado 'form' para evitar referência antes da inicialização.

  // Form state para modal
  const [form, setForm] = useState({
    atividade: '' as TipoAtividade | '',
    atividadeLabel: '',
    atividadeCustomLabel: '',
    responsavel: '',
    descricao: '',
    dataAtividade: '',
    regional: regionalId,
    local: '',
    estados: [] as string[],
    programa: '' as any,
    instituicaoId: '' as string,
    evidencias: [] as any[],
    quantidade: undefined as number | undefined,
  });

  // Aviso de conflito calculado com base no formulário atual
  const conflictWarning = useConflictWarning(
    { dataInicio: form.dataAtividade, horaInicio: '', dataFim: '', horaFim: '' },
    eventsOfMonth,
    editingId
  )

  const openCreateModal = () => {
    setEditingId(null);
    setForm({ atividade: '', atividadeLabel: '', atividadeCustomLabel: '', responsavel: '', descricao: '', dataAtividade: '', regional: regionalId, local: '', estados: [], programa: '' as any, instituicaoId: '', evidencias: [], quantidade: undefined });
    setShowModal(true);
  };

  // Abre o modal automaticamente quando query param open=new estiver presente
  useEffect(() => {
    const open = new URLSearchParams(location.search).get('open');
    if (open === 'new') {
      openCreateModal();
    }
  }, [location.search]);

  // Abre a gestão automaticamente quando query param view=gestao estiver presente
  useEffect(() => {
    const viewParam = new URLSearchParams(location.search).get('view');
    if (viewParam === 'gestao') {
      setShowGestao(true);
    }
  }, [location.search]);

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
      regional: evt.regional ?? regionalId,
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
    if (!form.atividade || !form.dataAtividade) return;
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
        local: form.local || e.local,
        programa: (form.programa as any) || e.programa,
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
        regional: regionalId,
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
          <h1 className="text-2xl font-bold text-gray-900">Calendário - {regionalLabel}</h1>
          <p className="text-gray-600">Gerencie atividades e eventos da regional</p>
        </div>
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
            onSelectDate={(d) => d && setSelectedDate(d)}
            dotColorBy="type"
          />

          <div className="mt-6 flex gap-3">
            <Button className="bg-gray-900 hover:bg-black text-white" onClick={openCreateModal} aria-label="Criar novo evento">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              Novo Evento
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setShowGestao(true)} aria-label="Abrir gestão de atividades">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Todas as Atividades
            </Button>
          </div>
        </Card>

        {/* Eventos do mês */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-gray-900">Eventos do Mês ({eventsOfMonth.length})</div>
            <CalendarIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-3">
            {eventsOfMonth.map((evt) => {
              const di = new Date(evt.data_inicio);
              const df = evt.data_fim ? new Date(evt.data_fim) : null;
              return (
                <div key={evt.id} className="border rounded-lg p-4 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{evt.titulo}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                        {format(di, 'dd/MM/yyyy')}
                      </span>
                      {df && (
                        <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                          {format(df, 'dd/MM/yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => openEditModal(evt)} className="p-2 rounded-md border hover:bg-gray-50" aria-label="Editar evento"><Edit className="w-4 h-4" aria-hidden="true" /></button>
                    <button onClick={() => deleteEvent(evt.id)} className="p-2 rounded-md border hover:bg-gray-50" aria-label="Excluir evento"><Trash2 className="w-4 h-4" aria-hidden="true" /></button>
                  </div>
                </div>
              );
            })}
            {eventsOfMonth.length === 0 && (
              <div className="text-sm text-gray-600">Nenhum evento encontrado para este mês.</div>
            )}
          </div>
        </Card>
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
          showRegionalField={false}
          conflictWarning={conflictWarning?.hasConflict ? conflictWarning : undefined}
        />
      )}
      {showGestao && (
        <GestaoAtividadesModal
          isOpen={showGestao}
          onClose={() => setShowGestao(false)}
          events={events.filter((e) => e.regional === regionalId)}
          onEdit={openEditModal}
          onDelete={deleteEvent}
          regionalLabel={regionalLabel}
        />
      )}
    </div>
  );
}