import { useRef, useEffect, useCallback } from 'react';
import { X, CalendarPlus, Clock } from 'lucide-react';
import { Button } from '../ui/Button';
import { ATIVIDADE_OPTIONS } from '../../pages/calendario/constants';
import { useUsersWithMembers } from '../../hooks/useApi';

interface NovoEventoForm {
  atividade: string;
  responsavel: string;
  descricao: string;
  data: string;
  hora: string;
}

interface NovoEventoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: NovoEventoForm) => void;
  form: NovoEventoForm;
  setForm: (form: NovoEventoForm) => void;
  regionalId?: string;
  regionalLabel?: string;
}

export default function NovoEventoModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  regionalId,
  regionalLabel
}: NovoEventoModalProps) {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Fetch regional users
  const { data: usersWithMembers = [] } = useUsersWithMembers();

  // Helper function to convert dd/mm/yyyy to yyyy-mm-dd for input[type="date"]
  const formatDateForInput = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return dateStr;
  };

  // Memoized handlers to prevent re-renders
  const handleAtividadeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('handleAtividadeChange called:', e.target.value);
    setForm({ ...form, atividade: e.target.value });
  }, [form]);

  const handleResponsavelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('handleResponsavelChange called:', e.target.value);
    setForm({ ...form, responsavel: e.target.value });
  }, [form]);

  const handleDescricaoChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('handleDescricaoChange called:', e.target.value);
    setForm({ ...form, descricao: e.target.value });
  }, [form]);

  const handleDataChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleDataChange called:', e.target.value);
    // Converter de yyyy-mm-dd para dd/mm/yyyy para exibição
    const value = e.target.value;
    if (value) {
      const [year, month, day] = value.split('-');
      const formattedDate = `${day}/${month}/${year}`;
      setForm({ ...form, data: formattedDate });
    } else {
      setForm({ ...form, data: value });
    }
  }, [form]);

  const handleHoraChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleHoraChange called:', e.target.value);
    // Garantir formato HH:mm (sem segundos)
    let value = e.target.value;
    if (value && value.length > 5) {
      value = value.substring(0, 5); // Cortar para HH:mm
    }
    setForm({ ...form, hora: value });
  }, [form]);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      setTimeout(() => firstFieldRef.current?.focus(), 100);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.atividade || !form.data) return;
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Novo Evento">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-gray-200" ref={containerRef} tabIndex={-1}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CalendarPlus className="w-6 h-6 text-indigo-500" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 leading-tight">Novo Evento</h3>
              {regionalLabel && (
                <p className="text-sm text-gray-500">Regional: {regionalLabel}</p>
              )}
            </div>
          </div>
          <button 
            aria-label="Fechar modal" 
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors" 
            onClick={onClose}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Atividade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Atividade *
            </label>
            <select
              ref={firstFieldRef}
              value={form.atividade}
              onChange={handleAtividadeChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
              required
            >
              <option value="">Selecione uma atividade</option>
              {ATIVIDADE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Responsável
            </label>
            <select
              value={form.responsavel}
              onChange={handleResponsavelChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
            >
              <option value="">Selecione um responsável</option>
              {usersWithMembers.map((user: any) => (
                <option key={user.id} value={user.nome || user.email}>
                  {user.nome || user.email}
                </option>
              ))}
            </select>
          </div>

          {/* Data e Hora lado a lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Data *
              </label>
              <input
                type="date"
                value={formatDateForInput(form.data)}
                onChange={handleDataChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Hora
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={form.hora}
                  onChange={handleHoraChange}
                  step="60"
                  className="w-full pl-10 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={form.descricao}
              onChange={handleDescricaoChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
              rows={4}
              placeholder="Descrição detalhada do evento"
            />
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose} 
              className="px-6 rounded-xl shadow-sm"
            >
              Cancelar
            </Button>
            <Button 
              type="submit"
              className="px-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-sm"
              disabled={!form.atividade || !form.data}
            >
              Criar Evento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}