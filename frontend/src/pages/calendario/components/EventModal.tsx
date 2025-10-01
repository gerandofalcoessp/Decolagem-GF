import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { TipoAtividade, Programa, Evidencia } from '@/types';
import ConflictBanner from './ConflictBanner';
import type { ConflictWarning } from './ConflictBanner';
import { REGIONAL_STATES, STATE_LABELS, PROGRAMA_LABELS } from '@/pages/calendario/constants'

interface EventModalProps {
  isOpen: boolean;
  editingId: string | null;
  form: {
    atividade: TipoAtividade | '';
    atividadeLabel: string;
    atividadeCustomLabel: string;
    responsavel: string;
    descricao: string;
    dataAtividade: string; // novo: única data de atividade
    regional: string;
    // removendo UI de local (mantém no formulário para compatibilidade externa, mas não exibe)
    local: string;
    estados: string[]; // novo: seleção múltipla de UFs
    // novos campos
    programa?: Programa | '';
    instituicaoId?: string;
    // Novo: evidências de imagens
    evidencias?: Evidencia[];
    // Novo: quantidade
    quantidade?: number;
  };
  setForm: React.Dispatch<React.SetStateAction<EventModalProps['form']>>;
  customTypes: { value: TipoAtividade; label: string }[];
  setCustomTypes: React.Dispatch<React.SetStateAction<{ value: TipoAtividade; label: string }[]>>;
  REGIONAL_LABELS: Record<string, string>;
  ATIVIDADE_OPTIONS: { value: TipoAtividade; label: string }[];
  onClose: () => void;
  onSubmit: () => void;
  // novo: permite ocultar o campo de seleção de regional quando já estiver fixo no contexto
  showRegionalField?: boolean;
  // novo: aviso de conflito de horário (apenas visual)
  conflictWarning?: {
    hasConflict: boolean;
    message: string;
    details?: { title: string; range: string }[];
  };
}

// PROGRAMA_LABELS centralizado em '@/pages/calendario/constants'

export default function EventModal({
  isOpen,
  editingId,
  form,
  setForm,
  customTypes,
  setCustomTypes,
  REGIONAL_LABELS,
  ATIVIDADE_OPTIONS,
  onClose,
  onSubmit,
  showRegionalField = true,
  conflictWarning,
}: EventModalProps) {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [ongs, setOngs] = useState<Array<{ id: string; nome: string }>>([]);
  const [evidenciaError, setEvidenciaError] = useState<string>('');
  
  const handleEvidenciasChange = async (files: FileList | null) => {
    if (!files) return;
    const MAX_FILES = 2;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ACCEPTED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
    const current = form.evidencias || [];
    const remainingSlots = MAX_FILES - current.length;
    const toProcess = Array.from(files).slice(0, Math.max(0, remainingSlots));
  
    const invalid = toProcess.find(f => !ACCEPTED.includes(f.type) || f.size > MAX_SIZE);
    if (invalid) {
      setEvidenciaError('Formato inválido ou arquivo maior que 5MB. Aceitos: JPG, JPEG, PNG, WebP.');
      return;
    }
  
    setEvidenciaError('');
  
    const readFileAsDataURL = (file: File) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  
    const newItems: Evidencia[] = [];
    for (const f of toProcess) {
      const url = await readFileAsDataURL(f);
      newItems.push({
        id: `${f.name}-${Date.now()}`,
        filename: f.name,
        mimeType: f.type as any,
        size: f.size,
        url,
        created_at: new Date().toISOString(),
      });
    }
  
    setForm(prev => ({ ...prev, evidencias: [...current, ...newItems].slice(0, MAX_FILES) }));
  };
  
  const removeEvidencia = (id: string) => {
    setForm(prev => ({ ...prev, evidencias: (prev.evidencias || []).filter(ev => ev.id !== id) }));
  };
  
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem('ongs');
      const parsed = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(parsed) ? parsed : [];
      const mapped = list.map((o: any) => ({ id: o.id, nome: o.nome })).filter((o: any) => o.id && o.nome);
      setOngs(mapped);
    } catch {
      setOngs([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && firstFieldRef.current) {
      firstFieldRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedElement.current = document.activeElement as HTMLElement;
  
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll<HTMLElement>(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey) {
          if (active === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (active === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label={editingId ? 'Editar Evento' : 'Novo Evento'}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" ref={containerRef} tabIndex={-1}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
          <button aria-label="Fechar modal" className="p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={onClose}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Atividade *</label>
              <select
                ref={firstFieldRef}
                aria-label="Selecionar atividade"
                value={form.atividade || ''}
                onChange={(e) => {
                  const value = e.target.value as TipoAtividade;
                  const label = e.target.options[e.target.selectedIndex]?.text || '';
                  setForm((f) => ({ ...f, atividade: value, atividadeLabel: label }));
                }}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma atividade</option>
                {[...ATIVIDADE_OPTIONS.filter(o => o.label !== 'OUTRA'), ...customTypes, { value: 'outros' as TipoAtividade, label: 'OUTRA' }].map((opt) => (
                  <option key={`${opt.value}-${opt.label}`} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {form.atividadeLabel === 'OUTRA' && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    aria-label="Nome da nova atividade"
                    value={form.atividadeCustomLabel}
                    onChange={(e) => setForm((f) => ({ ...f, atividadeCustomLabel: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nome da nova atividade"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const name = form.atividadeCustomLabel.trim();
                      if (!name) return;
                      setCustomTypes((prev) => [...prev, { value: 'outros', label: name }]);
                      setForm((f) => ({ ...f, atividadeLabel: name }));
                    }}
                    className="whitespace-nowrap"
                  >
                    Salvar no filtro
                  </Button>
                </div>
              )}
            </div>

            {/* Programa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Programa *</label>
              <select
                aria-label="Selecionar programa"
                value={form.programa || ''}
                onChange={(e) => setForm((f) => ({ ...f, programa: e.target.value as Programa }))}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione um programa</option>
                {Object.entries(PROGRAMA_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Quantidade</label>
              <input
                type="number"
                min={0}
                step={1}
                aria-label="Quantidade"
                value={typeof form.quantidade === 'number' ? form.quantidade : ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = val === '' ? undefined : Math.max(0, Math.floor(Number(val)));
                  setForm((f) => ({ ...f, quantidade: num }));
                }}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Informe a quantidade (opcional)"
              />
              <p className="mt-1 text-xs text-gray-500">Use para contabilizar itens como famílias atendidas, encontros realizados, etc.</p>
            </div>

            {/* Instituição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Instituição</label>
              <select
                aria-label="Selecionar instituição"
                value={form.instituicaoId || ''}
                onChange={(e) => setForm((f) => ({ ...f, instituicaoId: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Selecione uma instituição</option>
                {ongs.map((o) => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Lista exibe ONGs cadastradas na página "Cadastrar ONG".</p>
            </div>
          </div>

          {showRegionalField && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Regional *</label>
              <select
                aria-label="Selecionar regional"
                value={form.regional}
                onChange={(e) => setForm((f) => ({ ...f, regional: e.target.value }))}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(REGIONAL_LABELS).filter(([key]) => key !== 'todas').map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável</label>
            <select
              aria-label="Selecionar responsável"
              value={form.responsavel}
              onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Nenhum responsável</option>
              <option value="Líder Regional">Líder Regional</option>
              <option value="Coordenador Nacional">Coordenador Nacional</option>
              <option value="Gerente Comercial">Gerente Comercial</option>
              <option value="Consultor">Consultor</option>
            </select>
          </div>

          {/* Campo Local removido da UI */}
          {/* Campo Local foi descontinuado; mantido apenas no form por compatibilidade. */}
        </div>

        {/* Data da atividade e Estado(s) lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Data da Atividade *</label>
            <input 
              type="date" 
              aria-label="Data da atividade"
              value={form.dataAtividade} 
              onChange={(e) => setForm((f) => ({ ...f, dataAtividade: e.target.value }))} 
              className="w-full md:max-w-[220px] border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="dd/mm/yyyy"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado(s)</label>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-500">Filtro por UF da regional</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  onClick={() => {
                    const all = REGIONAL_STATES[form.regional] || [];
                    setForm((f) => ({ ...f, estados: all }));
                  }}
                >
                  Selecionar todos
                </button>
                <button
                  type="button"
                  className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                  onClick={() => setForm((f) => ({ ...f, estados: [] }))}
                >
                  Limpar
                </button>
              </div>
            </div>
            <div
              aria-label="Selecionar estados"
              className="w-full border border-gray-300 rounded-xl p-3 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 max-h-40 overflow-y-auto bg-white"
            >
              {(REGIONAL_STATES[form.regional] || []).map((uf) => (
                <label key={uf} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    aria-label={`Selecionar estado ${uf}`}
                    checked={form.estados.includes(uf)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setForm((f) => ({
                        ...f,
                        estados: checked
                          ? Array.from(new Set([...f.estados, uf]))
                          : f.estados.filter((s) => s !== uf),
                      }));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{STATE_LABELS[uf] || uf} ({uf})</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Marque as caixas para selecionar múltiplos estados.</p>
          </div>
        </div>

        {/* Descrição por último */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
          <textarea
            aria-label="Descrição do evento"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Descrição detalhada do evento"
          />
        </div>

        {/* Evidências */}
        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Evidências</label>
          <p className="text-xs text-gray-500 mb-2">Adicione até 2 fotos como evidência da atividade realizada (JPG, JPEG, PNG, WebP · máx. 5MB cada).</p>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={(e) => handleEvidenciasChange(e.target.files)}
            className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
          />
          {evidenciaError && (
            <p className="text-xs text-red-600 mt-2">{evidenciaError}</p>
          )}
          {form.evidencias && form.evidencias.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {form.evidencias.slice(0,2).map((ev) => (
                <div key={ev.id} className="border rounded-xl p-2 flex items-center space-x-2">
                  {ev.url ? (
                    <img src={ev.url} alt={ev.filename} className="w-16 h-16 object-cover rounded-md" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-md" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-gray-800 truncate">{ev.filename}</p>
                    <p className="text-xs text-gray-500">{(ev.size / (1024*1024)).toFixed(2)} MB</p>
                  </div>
                  <Button variant="outline" onClick={() => removeEvidencia(ev.id)} className="text-red-600">Remover</Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {conflictWarning && (
          <ConflictBanner warning={conflictWarning} />
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-6">
            Cancelar
          </Button>
          <Button 
            onClick={onSubmit} 
            className="px-6 bg-pink-500 hover:bg-pink-600 text-white"
            disabled={!form.atividade || !form.dataAtividade || !form.regional || !form.programa}
            aria-disabled={!form.atividade || !form.dataAtividade || !form.regional || !form.programa}
          >
            {editingId ? 'Salvar Alterações' : 'Criar Evento'}
          </Button>
        </div>
      </div>
    </div>
  );
}