import { useRef, useEffect } from 'react';
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
  editingEvent?: any; // Evento sendo editado
}

export default function NovoEventoModal({
  isOpen,
  onClose,
  onSubmit,
  form,
  setForm,
  regionalId,
  regionalLabel,
  editingEvent
}: NovoEventoModalProps) {
  // Refs for uncontrolled inputs
  const atividadeRef = useRef<HTMLSelectElement>(null);
  const responsavelRef = useRef<HTMLSelectElement>(null);
  const descricaoRef = useRef<HTMLTextAreaElement>(null);
  const dataRef = useRef<HTMLInputElement>(null);
  const horaRef = useRef<HTMLInputElement>(null);
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

  // Update refs when form changes (from parent)
  useEffect(() => {
    if (isOpen) {
      if (atividadeRef.current) atividadeRef.current.value = form.atividade;
      if (responsavelRef.current) responsavelRef.current.value = form.responsavel;
      if (descricaoRef.current) descricaoRef.current.value = form.descricao;
      if (dataRef.current) dataRef.current.value = formatDateForInput(form.data);
      if (horaRef.current) horaRef.current.value = form.hora;
    }
  }, [isOpen, form]);

  // Sync form state from refs
  const syncFormFromRefs = () => {
    const newForm = {
      atividade: atividadeRef.current?.value || '',
      responsavel: responsavelRef.current?.value || '',
      descricao: descricaoRef.current?.value || '',
      data: dataRef.current?.value ? (() => {
        const value = dataRef.current!.value;
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
      })() : '',
      hora: horaRef.current?.value || ''
    };
    console.log('🔄 Syncing form from refs:', newForm);
    setForm(newForm);
  };

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      setTimeout(() => atividadeRef.current?.focus(), 100);
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
    syncFormFromRefs();
    
    const currentForm = {
      atividade: atividadeRef.current?.value || '',
      responsavel: responsavelRef.current?.value || '',
      descricao: descricaoRef.current?.value || '',
      data: dataRef.current?.value ? (() => {
        const value = dataRef.current!.value;
        const [year, month, day] = value.split('-');
        return `${day}/${month}/${year}`;
      })() : '',
      hora: horaRef.current?.value || ''
    };
    
    if (!currentForm.atividade || !currentForm.data) return;
    onSubmit(currentForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Novo Evento">
      <div 
        ref={containerRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <CalendarPlus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingEvent ? 'Editar Evento' : 'Novo Evento'}
              </h2>
              <p className="text-sm text-gray-600">{regionalLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-xl transition-colors"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Atividade */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Atividade *
            </label>
            <select
              ref={atividadeRef}
              onChange={syncFormFromRefs}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
              required
            >
              <option value="">Selecione uma atividade</option>
              {ATIVIDADE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Responsável
            </label>
            <select
              ref={responsavelRef}
              onChange={syncFormFromRefs}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm shadow-sm transition-colors"
            >
              <option value="">Selecione um responsável</option>
              {usersWithMembers.map((user: any) => (
                <option key={user.id} value={user.id}>
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
                ref={dataRef}
                type="date"
                onChange={syncFormFromRefs}
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
                  ref={horaRef}
                  type="time"
                  onChange={syncFormFromRefs}
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
              ref={descricaoRef}
              onChange={syncFormFromRefs}
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
              className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
            >
              {editingEvent ? 'Atualizar Evento' : 'Criar Evento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}