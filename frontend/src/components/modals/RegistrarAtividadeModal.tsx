import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, Crown, Shield, UserCheck, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import LazyImage from '@/components/ui/LazyImage';
import type { TipoAtividade, Programa, Regional, Evidencia } from '@/types';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS, PROGRAMA_LABELS, REGIONAL_STATES, STATE_LABELS } from '@/pages/calendario/constants';
import { useUsersWithMembers } from '@/hooks/useApi';
import { useRegionalData } from '@/hooks/useRegionalData';
import { useAuthStore } from '@/store/authStore';

interface RegistrarAtividadeForm {
  atividade: TipoAtividade | string;
  atividadeLabel: string;
  atividadeCustomLabel: string;
  responsavel: string;
  descricao: string;
  dataAtividade: string;
  regional: Regional;
  estados: string[];
  programa: Programa | string;
  instituicaoId: string;
  evidencias: Evidencia[];
  quantidade?: number;
}

interface RegistrarAtividadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: RegistrarAtividadeForm) => void;
  regionalId?: string; // Regional pré-selecionada quando vem da página Regionais
}

export function RegistrarAtividadeModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  regionalId 
}: RegistrarAtividadeModalProps) {
  const firstFieldRef = useRef<HTMLSelectElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  
  // Get current user to determine their regional
  const { user } = useAuthStore();
  
  const [form, setForm] = useState<RegistrarAtividadeForm>({
    atividade: '',
    atividadeLabel: '',
    atividadeCustomLabel: '',
    responsavel: '',
    descricao: '',
    dataAtividade: '',
    regional: regionalId as Regional || 'nacional',
    estados: [],
    programa: '',
    instituicaoId: '',
    evidencias: [],
    quantidade: undefined,
  });

  const [customTypes, setCustomTypes] = useState<{ value: TipoAtividade; label: string }[]>([]);
  const [ongs, setOngs] = useState<Array<{ id: string; nome: string }>>([]);
  const [evidenciaError, setEvidenciaError] = useState<string>('');

  // User data hooks
  const { data: usersWithMembers, loading: usersLoading, error: usersError } = useUsersWithMembers();
  const { getRegionalAliases } = useRegionalData();

  // User filtering logic similar to EventModal
  const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  
  const REGIONAL_ALIASES: Record<string, string[]> = {
    nacional: ['nacional'],
    centroeste: ['centroeste', 'centro-oeste', 'centrooeste', 'r. centro-oeste', 'r.centro-oeste'],
    centro_oeste: ['centroeste', 'centro-oeste', 'centrooeste', 'r. centro-oeste', 'r.centro-oeste'],
    nordeste: ['nordeste'],
    nordeste_2: ['nordeste2', 'nordeste 2', 'nordeste_2', 'r.nordeste2', 'r. nordeste 2', 'r.nordeste 2'],
    norte: ['norte'],
    rj: ['rj', 'riodejaneiro', 'rio de janeiro', 'r. rio de janeiro', 'r.rio de janeiro'],
    sp: ['sp', 'saopaulo', 'são paulo', 'sao paulo', 'r. sao paulo', 'r.sao paulo', 'r. são paulo', 'r.são paulo'],
    sul: ['sul'],
    mg_es: ['mg/es', 'mg es', 'mges', 'minas gerais', 'espirito santo', 'r. mg/es', 'r.mg/es'],
  };

  const filteredUsers = (usersWithMembers || [])
    .filter((user: any) => {
      // Usar tanto area quanto regional do usuário, e também verificar user_metadata
      const userRegional = user.regional || user.area || user.user_metadata?.regional || '';
      const normalizedUserRegional = normalize(userRegional);
      
      // Debug logs para Centro-Oeste
      if (form.regional === 'centroeste' || userRegional.toLowerCase().includes('centro')) {
        console.log('🔍 DEBUG Centro-Oeste:', {
          formRegional: form.regional,
          userRegional,
          normalizedUserRegional,
          userId: user.id,
          userName: user.nome || user.email
        });
      }
      
      // Mapear a regional do form para as aliases corretas
      let regionalKey = form.regional;
      if (form.regional === 'nordeste_2') {
        regionalKey = 'nordeste_2';
      }
      
      const matchers = REGIONAL_ALIASES[regionalKey] || [];
      const byRegional = matchers.some((m) => normalizedUserRegional.includes(m));
      const isNational = normalizedUserRegional === 'nacional';
      
      // Debug logs para Centro-Oeste
      if (form.regional === 'centroeste') {
        console.log('🔍 DEBUG Centro-Oeste Matching:', {
          formRegional: form.regional,
          regionalKey,
          matchers,
          byRegional,
          userRegional,
          normalizedUserRegional,
          userId: user.id,
          userName: user.nome || user.email
        });
      }
      
      // Usuários nacionais só aparecem na regional "nacional"
      if (form.regional === 'nacional') {
        return byRegional || isNational;
      }
      
      // Para outras regionais, mostrar apenas usuários da regional específica
      return byRegional;
    })
    .sort((a: any, b: any) => (
      (a.nome || a.email || '').localeCompare(b.nome || b.email || '')
    ));

  // Debug log para verificar todos os usuários carregados
  useEffect(() => {
    if (form.regional === 'centroeste' && usersWithMembers) {
      console.log('🔍 DEBUG Todos os usuários carregados:', usersWithMembers.map(u => ({
        id: u.id,
        nome: u.nome || u.email,
        regional: u.regional,
        area: u.area,
        user_metadata: u.user_metadata
      })));
    }
  }, [form.regional, usersWithMembers]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setForm({
        atividade: '',
        atividadeLabel: '',
        atividadeCustomLabel: '',
        responsavel: '',
        descricao: '',
        dataAtividade: '',
        regional: regionalId as Regional || 'nacional',
        estados: [],
        programa: '',
        instituicaoId: '',
        evidencias: [],
        quantidade: undefined,
      });
      setEvidenciaError('');
    }
  }, [isOpen, regionalId]);

  // Load ONGs
  useEffect(() => {
    if (!isOpen) return;
    
    const loadOngs = async () => {
      try {
        const { InstituicaoService } = await import('@/services/instituicaoService');
        const instituicoes = await InstituicaoService.getInstituicoes();
        
        // Get user's regional for filtering
        const userRegional = user?.regional;
        console.log('🏢 Filtrando instituições para regional:', userRegional);
        
        // Map user regional to database format
        const mapUserRegionalToDbFormat = (regional: string): string => {
          if (!regional) return '';
          
          const mapping: Record<string, string> = {
            'R. Norte': 'norte',
            'R. Centro-Oeste': 'centro_oeste',
            'R. Nordeste': 'nordeste',
            'R. Sudeste': 'sudeste',
            'R. Sul': 'sul',
            'R. MG/ES': 'mg_es',
            'R. Rio de Janeiro': 'rj',
            'R. São Paulo': 'sp',
            'R. Nordeste 1': 'nordeste_1',
            'R. Nordeste 2': 'nordeste_2',
            'Nacional': 'nacional',
            'Comercial': 'comercial',
            // Cases already in correct format
            'norte': 'norte',
            'centro_oeste': 'centro_oeste',
            'nordeste': 'nordeste',
            'sudeste': 'sudeste',
            'sul': 'sul',
            'mg_es': 'mg_es',
            'rj': 'rj',
            'sp': 'sp',
            'nordeste_1': 'nordeste_1',
            'nordeste_2': 'nordeste_2',
            'nacional': 'nacional',
            'comercial': 'comercial'
          };
          
          return mapping[regional] || regional.toLowerCase();
        };
        
        const mappedUserRegional = mapUserRegionalToDbFormat(userRegional || '');
        console.log('🔄 Mapeamento regional:', { original: userRegional, mapped: mappedUserRegional });
        
        // Filter institutions based on user's regional
        let filteredInstituicoes;
        if (mappedUserRegional === 'nacional' || user?.role === 'super_admin') {
          // Nacional users or super admins can see all institutions
          filteredInstituicoes = instituicoes;
          console.log('👑 Usuário nacional/super admin - mostrando todas as instituições');
        } else {
          // Filter by user's regional
          filteredInstituicoes = instituicoes.filter((inst) => inst.regional === mappedUserRegional);
          console.log('👤 Usuário regional - filtrando por:', mappedUserRegional);
        }
        
        console.log('📊 Instituições encontradas:', filteredInstituicoes.length);
        
        const mapped = filteredInstituicoes.map((inst) => ({ 
          id: inst.id!, 
          nome: inst.nome 
        })).filter((o) => o.id && o.nome);
        setOngs(mapped);
      } catch (error) {
        console.error('Erro ao carregar instituições:', error);
        setOngs([]);
      }
    };
    
    loadOngs();
  }, [isOpen, user?.regional]); // Add user?.regional as dependency

  // Focus management
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
        handleCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

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
  
    const currentEvidencias = form.evidencias || [];
    setForm({ ...form, evidencias: [...currentEvidencias, ...newItems].slice(0, MAX_FILES) });
  };

  const removeEvidencia = (id: string) => {
    setForm({ ...form, evidencias: (form.evidencias || []).filter((ev: Evidencia) => ev.id !== id) });
  };

  const handleCancel = () => {
    setForm({
      atividade: '',
      atividadeLabel: '',
      atividadeCustomLabel: '',
      responsavel: '',
      descricao: '',
      dataAtividade: '',
      regional: regionalId as Regional || 'nacional',
      estados: [],
      programa: '',
      instituicaoId: '',
      evidencias: [],
      quantidade: undefined,
    });
    setEvidenciaError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!form.atividade || !form.dataAtividade || !form.regional || !form.programa) {
      return;
    }
    onSubmit(form);
    handleCancel();
  };

  if (!isOpen) return null;

  const availableStates = REGIONAL_STATES[form.regional] || [];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Registrar Atividade">
      <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl ring-1 ring-gray-200" ref={containerRef} tabIndex={-1}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Activity className="w-6 h-6 text-orange-600" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 leading-tight">Registrar Atividade</h3>
              <p className="text-sm text-gray-500">Registre atividades para contabilizar nas metas</p>
            </div>
          </div>
          <button aria-label="Fechar modal" className="p-2 rounded-xl hover:bg-gray-100 transition-colors" onClick={handleCancel}>
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Atividade */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Atividade *</label>
              <select
                ref={firstFieldRef}
                aria-label="Selecionar tipo de atividade"
                value={form.atividade}
                onChange={(e) => {
                  const selectedOption = [...ATIVIDADE_OPTIONS, ...customTypes].find(opt => opt.value === e.target.value);
                  setForm({ 
                    ...form, 
                    atividade: e.target.value as TipoAtividade,
                    atividadeLabel: selectedOption?.label || e.target.value
                  });
                }}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors"
              >
                <option value="">Selecione uma atividade</option>
                {ATIVIDADE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
                {customTypes.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Programa */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Programa *</label>
              <select
                aria-label="Selecionar programa"
                value={form.programa}
                onChange={(e) => setForm({ ...form, programa: e.target.value as Programa })}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors"
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
                  setForm({ ...form, quantidade: num });
                }}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors"
                placeholder="Informe a quantidade (opcional)"
              />
              <p className="mt-1 text-xs text-gray-500">Use para contabilizar itens como pessoas atendidas, encontros realizados, etc.</p>
            </div>

            {/* Instituição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Instituição</label>
              <select
                aria-label="Selecionar instituição"
                value={form.instituicaoId || ''}
                onChange={(e) => setForm({ ...form, instituicaoId: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors"
              >
                <option value="">Nenhuma instituição</option>
                {ongs.map((ong) => (
                  <option key={ong.id} value={ong.id}>{ong.nome}</option>
                ))}
              </select>
            </div>

            {/* Regional - só mostra se não foi pré-selecionada */}
            {!regionalId && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Regional *</label>
                <select
                  aria-label="Selecionar regional"
                  value={form.regional}
                  onChange={(e) => setForm({ ...form, regional: e.target.value as Regional })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                >
                  {Object.entries(REGIONAL_LABELS).filter(([key]) => key !== 'todas').map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Data da atividade */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Data da Atividade *</label>
              <input 
                type="date" 
                aria-label="Data da atividade"
                value={form.dataAtividade} 
                onChange={(e) => setForm({ ...form, dataAtividade: e.target.value })} 
                className="w-full md:max-w-[220px] border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors" 
                placeholder="dd/mm/yyyy"
              />
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável</label>
              <select
                aria-label="Selecionar responsável"
                value={form.responsavel}
                onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors"
              >
                <option value="">Selecione um responsável</option>
                {usersLoading && <option disabled>Carregando usuários...</option>}
                {usersError && <option disabled>Erro ao carregar usuários</option>}
                {filteredUsers
                  .filter((user: any) => user.id && typeof user.id === 'string' && user.id.length > 0)
                  .map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.nome || user.email}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Estados */}
          {availableStates.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Estado(s)</label>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">Selecione os estados onde a atividade foi realizada</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, estados: [...availableStates] })}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Selecionar todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, estados: [] })}
                    className="text-xs text-gray-500 hover:text-gray-600 font-medium"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {availableStates.map((uf) => (
                  <label key={uf} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.estados.includes(uf)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const newForm = {
                          ...form,
                          estados: checked
                            ? Array.from(new Set([...form.estados, uf]))
                            : form.estados.filter((s: string) => s !== uf),
                        };
                        setForm(newForm);
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">{STATE_LABELS[uf] || uf} ({uf})</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">Marque as caixas para selecionar múltiplos estados.</p>
            </div>
          )}

          {/* Descrição */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
            <textarea
              aria-label="Descrição da atividade"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm transition-colors"
              rows={3}
              placeholder="Descrição detalhada da atividade"
            />
          </div>

          {/* Evidências */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Evidências</label>
            <p className="text-xs text-gray-500 mb-2">Adicione até 2 fotos como evidência da atividade realizada (JPG, JPEG, PNG, WebP · máx. 5MB cada).</p>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              onChange={(e) => handleEvidenciasChange(e.target.files)}
              className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
            {evidenciaError && (
              <p className="text-xs text-red-600 mt-2">{evidenciaError}</p>
            )}
            {form.evidencias && form.evidencias.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {form.evidencias.slice(0,5).map((ev) => (
                  <div key={ev.id} className="border rounded-xl p-2 flex items-center space-x-2">
                    {ev.url ? (
                      <LazyImage 
                        src={ev.url} 
                        alt={ev.filename} 
                        className="w-16 h-16 object-cover rounded-md" 
                        width={64}
                        height={64}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-md" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 truncate">{ev.filename}</p>
                      <p className="text-xs text-gray-500">{(ev.size / (1024*1024)).toFixed(2)} MB</p>
                    </div>
                    <Button variant="destructive" onClick={() => removeEvidencia(ev.id)} className="rounded-md">Remover</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
          <Button variant="outline" onClick={handleCancel} className="px-6 rounded-xl shadow-sm">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-sm"
            disabled={!form.atividade || !form.dataAtividade || !form.regional || !form.programa}
            aria-disabled={!form.atividade || !form.dataAtividade || !form.regional || !form.programa}
          >
            Registrar Atividade
          </Button>
        </div>
      </div>
    </div>
  );
}