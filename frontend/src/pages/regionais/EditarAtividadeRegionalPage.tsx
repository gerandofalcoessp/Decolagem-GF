import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, X, Activity, Crown, Shield, UserCheck, Users, Upload, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { NotificationModal } from '@/components/modals/NotificationModal';
import type { TipoAtividade, Programa, Regional, Evidencia, Atividade } from '@/types';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS, PROGRAMA_LABELS, REGIONAL_STATES, STATE_LABELS } from '@/pages/calendario/constants';
import { useUsersWithMembers } from '@/hooks/useApi';
import { useRegionalData } from '@/hooks/useRegionalData';
import { API_BASE_URL } from '@/utils/config';

interface EditarAtividadeForm {
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

export default function EditarAtividadeRegionalPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState<EditarAtividadeForm>({
    atividade: '',
    atividadeLabel: '',
    atividadeCustomLabel: '',
    responsavel: '',
    descricao: '',
    dataAtividade: '',
    regional: 'nacional',
    estados: [],
    programa: '',
    instituicaoId: '',
    evidencias: [],
    quantidade: undefined,
  });

  const [customTypes, setCustomTypes] = useState<{ value: TipoAtividade; label: string }[]>([]);
  const [ongs, setOngs] = useState<Array<{ id: string; nome: string }>>([]);
  const [evidenciaError, setEvidenciaError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newEvidencias, setNewEvidencias] = useState<File[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ type: 'success', title: '', message: '' });

  // User data hooks
  const { data: usersWithMembers, loading: usersLoading, error: usersError } = useUsersWithMembers();
  const { getRegionalAliases } = useRegionalData();

  // User filtering logic similar to EventModal
  const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  const REGIONAL_ALIASES: Record<string, string[]> = {
    nacional: ['nacional'],
    centroeste: ['centroeste', 'centro-oeste', 'centrooeste'],
    nordeste: ['nordeste'],
    norte: ['norte'],
    rj: ['rj', 'riodejaneiro'],
    sp: ['sp', 'saopaulo'],
    sul: ['sul'],
  };

  const filteredUsers = (usersWithMembers || [])
    .filter((u: any) => {
      const aff = normalize(u.area || u.regional || '');
      const matchers = REGIONAL_ALIASES[form.regional] || [];
      const byRegional = matchers.some((m) => aff.includes(m));
      const isNational = aff === 'nacional';
      
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

  // Handle evidence file upload
  const handleEvidenciasChange = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    let hasError = false;

    // Verificar se não excede o limite total (existentes + novas)
    const totalEvidencias = form.evidencias.length + newEvidencias.length + fileArray.length;
    if (totalEvidencias > 2) {
      setEvidenciaError('Máximo de 2 evidências permitidas no total');
      return;
    }

    fileArray.forEach(file => {
      // Validar tipo de arquivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        hasError = true;
        setEvidenciaError('Apenas arquivos JPG, JPEG, PNG e WebP são permitidos');
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5 * 1024 * 1024) {
        hasError = true;
        setEvidenciaError('Cada arquivo deve ter no máximo 5MB');
        return;
      }

      validFiles.push(file);
    });

    if (!hasError) {
      setNewEvidencias(prev => [...prev, ...validFiles]);
      setEvidenciaError('');
    }
  };

  // Remove existing evidence
  const removeExistingEvidencia = (index: number) => {
    const updatedEvidencias = form.evidencias.filter((_, i) => i !== index);
    setForm({ ...form, evidencias: updatedEvidencias });
  };

  // Remove new evidence
  const removeNewEvidencia = (index: number) => {
    setNewEvidencias(prev => prev.filter((_, i) => i !== index));
  };

  // Load activity data
  useEffect(() => {
    const loadActivity = async () => {
      if (!id) return;
      
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/regional-activities/${id}/with-files`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Atividade não encontrada');
        }

        const activity: Atividade = await response.json();
        
        // Parse estados if it's a string
        let parsedEstados: string[] = [];
        if (typeof activity.estados === 'string') {
          try {
            parsedEstados = JSON.parse(activity.estados);
          } catch {
            parsedEstados = [];
          }
        } else if (Array.isArray(activity.estados)) {
          parsedEstados = activity.estados;
        }

        setForm({
          atividade: activity.tipo || '',
          atividadeLabel: activity.titulo || '',
          atividadeCustomLabel: '',
          responsavel: activity.responsavel?.id || '',
          descricao: activity.descricao || '',
          dataAtividade: activity.data_inicio ? activity.data_inicio.split('T')[0] : '',
          regional: activity.regional || 'nacional',
          estados: parsedEstados,
          programa: activity.programa || '',
          instituicaoId: activity.instituicao_id || '',
          evidencias: activity.evidencias || [],
          quantidade: activity.quantidade,
        });
      } catch (error) {
        console.error('Erro ao carregar atividade:', error);
        setNotificationData({
          type: 'error',
          title: 'Erro ao carregar atividade',
          message: 'Não foi possível carregar os dados da atividade.'
        });
        setShowNotificationModal(true);
        navigate('/regionais/gestao-atividades');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [id, navigate]);

  // Load ONGs
  useEffect(() => {
    const loadOngs = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch(`${API_BASE_URL}/api/ongs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          // Filtrar apenas instituições da regional Norte
          const ongsNorte = (data.data || []).filter((ong: any) => ong.regional === 'norte');
          setOngs(ongsNorte);
        }
      } catch (error) {
        console.error('Erro ao carregar ONGs:', error);
      }
    };

    loadOngs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.atividade || !form.dataAtividade) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Preparar dados para envio
      const atividadeData = {
        title: form.atividadeLabel === 'OUTRA' && form.atividadeCustomLabel.trim() 
          ? form.atividadeCustomLabel.trim() 
          : form.atividadeLabel || form.atividade,
        description: form.descricao || '',
        type: form.atividade,
        activity_date: form.dataAtividade,
        responsavel_id: form.responsavel || null,
        regional: form.regional,
        programa: form.programa || '',
        estados: form.estados || [],
        instituicaoId: form.instituicaoId || '',
        quantidade: form.quantidade || null,
        atividadeLabel: form.atividadeLabel || '',
        atividadeCustomLabel: form.atividadeCustomLabel || '',
        evidencias: form.evidencias || []
      };

      // Se há novas evidências, usar FormData
      if (newEvidencias.length > 0) {
        const formData = new FormData();
        
        // Adicionar campos de dados ao FormData
        Object.keys(atividadeData).forEach(key => {
          const value = atividadeData[key as keyof typeof atividadeData];
          if (value !== null && value !== undefined) {
            // Para arrays, converter para JSON string
            if (Array.isArray(value)) {
              formData.append(key, JSON.stringify(value));
            } else {
              formData.append(key, String(value));
            }
          }
        });

        // Adicionar novas evidências
        newEvidencias.forEach((file) => {
          formData.append('evidencias', file);
        });

        const response = await fetch(`${API_BASE_URL}/api/regional-activities/${id}/with-files`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar atividade');
        }
      } else {
        // Sem novas evidências, usar JSON
        const response = await fetch(`${API_BASE_URL}/api/regional-activities/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(atividadeData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao atualizar atividade');
        }
      }

      // Invalidar cache do React Query para forçar atualização dos dados
      queryClient.invalidateQueries({ queryKey: ['regional-activities'] });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      
      setNotificationData({
        type: 'success',
        title: 'Sucesso!',
        message: 'Atividade atualizada com sucesso!'
      });
      setShowNotificationModal(true);
      navigate('/regionais/gestao-atividades');
    } catch (error) {
      console.error('Erro ao atualizar atividade:', error);
      setNotificationData({
        type: 'error',
        title: 'Erro ao atualizar atividade',
        message: 'Não foi possível atualizar a atividade. Tente novamente.'
      });
      setShowNotificationModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/regionais/gestao-atividades');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Voltar
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-6 h-6 text-orange-500" />
            Editar Atividade Regional
          </h1>
        </div>

        {/* Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tipo de Atividade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Atividade *</label>
                <select
                  value={form.atividade}
                  onChange={(e) => {
                    const selectedOption = [...ATIVIDADE_OPTIONS, ...customTypes].find(opt => opt.value === e.target.value);
                    setForm({ 
                      ...form, 
                      atividade: e.target.value,
                      atividadeLabel: selectedOption?.label || e.target.value
                    });
                  }}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                  required
                >
                  <option value="">Selecione uma atividade</option>
                  {ATIVIDADE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                  {customTypes.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Campo customizado se "OUTRA" for selecionada */}
              {form.atividadeLabel === 'OUTRA' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nome da Atividade *</label>
                  <input
                    type="text"
                    value={form.atividadeCustomLabel}
                    onChange={(e) => setForm({ ...form, atividadeCustomLabel: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                    placeholder="Digite o nome da atividade"
                    required
                  />
                </div>
              )}

              {/* Programa */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Programa</label>
                <select
                  value={form.programa}
                  onChange={(e) => setForm({ ...form, programa: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                >
                  <option value="">Selecione um programa</option>
                  {Object.entries(PROGRAMA_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Responsável */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Responsável</label>
                <select
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                >
                  <option value="">Selecione um responsável</option>
                  {filteredUsers.map((user: any) => (
                    <option key={user.id} value={user.id}>
                      {user.nome || user.email} {user.role && (
                        user.role === 'super_admin' ? <Crown className="inline w-3 h-3 ml-1 text-yellow-500" /> :
                        user.role === 'admin' ? <Shield className="inline w-3 h-3 ml-1 text-blue-500" /> :
                        user.role === 'member' ? <UserCheck className="inline w-3 h-3 ml-1 text-green-500" /> :
                        <Users className="inline w-3 h-3 ml-1 text-gray-500" />
                      )}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instituição/ONG */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Instituição/ONG</label>
                <select
                  value={form.instituicaoId}
                  onChange={(e) => setForm({ ...form, instituicaoId: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                >
                  <option value="">Selecione uma instituição</option>
                  {ongs.map((ong) => (
                    <option key={ong.id} value={ong.id}>{ong.nome}</option>
                  ))}
                </select>
              </div>

              {/* Regional */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Regional *</label>
                <select
                  value={form.regional}
                  onChange={(e) => setForm({ ...form, regional: e.target.value as Regional })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                  required
                >
                  {Object.entries(REGIONAL_LABELS).filter(([key]) => key !== 'todas').map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data da atividade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data da Atividade *</label>
                <input 
                  type="date" 
                  value={form.dataAtividade} 
                  onChange={(e) => setForm({ ...form, dataAtividade: e.target.value })} 
                  className="w-full md:max-w-[220px] border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors" 
                  required
                />
              </div>

              {/* Quantidade */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Quantidade</label>
                <input
                  type="number"
                  value={form.quantidade || ''}
                  onChange={(e) => setForm({ ...form, quantidade: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                  placeholder="Ex: 25"
                />
              </div>
            </div>

            {/* Estados */}
            {form.regional && REGIONAL_STATES[form.regional] && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Estados</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-xl p-3">
                  {REGIONAL_STATES[form.regional].map((estado) => (
                    <label key={estado} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.estados.includes(estado)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, estados: [...form.estados, estado] });
                          } else {
                            setForm({ ...form, estados: form.estados.filter(e => e !== estado) });
                          }
                        }}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span>{STATE_LABELS[estado] || estado}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm shadow-sm transition-colors"
                rows={4}
                placeholder="Descreva a atividade..."
              />
            </div>

            {/* Evidências */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Evidências</label>
              
              {/* Evidências existentes */}
              {form.evidencias.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Evidências atuais:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {form.evidencias.map((evidencia, index) => (
                      <div key={index} className="relative border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Eye className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">
                              {evidencia.nome || `Evidência ${index + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {evidencia.url && (
                              <a
                                href={evidencia.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Ver
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => removeExistingEvidencia(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Novas evidências */}
              {newEvidencias.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Novas evidências:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {newEvidencias.map((file, index) => (
                      <div key={index} className="relative border border-green-200 rounded-lg p-3 bg-green-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Upload className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeNewEvidencia(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload de novas evidências */}
              {(form.evidencias.length + newEvidencias.length) < 5 && (
                <div>
                  <input
                    type="file"
                    id="evidencias"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={(e) => handleEvidenciasChange(e.target.files)}
                    className="hidden"
                  />
                  <label
                    htmlFor="evidencias"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Adicionar Evidências
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo 2 evidências. Formatos: JPG, PNG, WebP. Tamanho máximo: 5MB cada.
                  </p>
                </div>
              )}

              {evidenciaError && (
                <p className="text-red-600 text-sm mt-2">{evidenciaError}</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Modal de Notificação */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        type={notificationData.type}
        title={notificationData.title}
        message={notificationData.message}
      />
    </div>
  );
}