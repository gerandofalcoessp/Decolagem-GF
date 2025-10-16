import { 
  MapPin, 
  Users, 
  Crown, 
  Shield, 
  UserCheck,
  Calendar,
  Plus,
  Activity,
  Flag,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useUserStats } from '@/hooks/useUserStats';
import { useRegionalData } from '@/hooks/useRegionalData';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RegistrarAtividadeModal } from '@/components/modals/RegistrarAtividadeModal';
import { NotificationModal } from '@/components/modals/NotificationModal';

interface Regional {
  id: string;
  name: string;
  states: string[];
  leader: {
    name: string;
    role: string;
  };
  coordinator?: {
    name: string;
    role: string;
  };
  consultants: Array<{
    name: string;
    role: string;
  }>;
  totalMembers: number;
  color: string;
}

// Mapeamento de cores para as regionais
const regionalColors: Record<string, string> = {
  'Nacional': 'bg-blue-50 border-blue-200',
  'Comercial': 'bg-green-50 border-green-200',
  'Centro-Oeste': 'bg-purple-50 border-purple-200',
  'Norte': 'bg-teal-50 border-teal-200',
  'Nordeste': 'bg-violet-50 border-violet-200',
  'Sudeste': 'bg-emerald-50 border-emerald-200',
  'Sul': 'bg-indigo-50 border-indigo-200',
  'MG/ES': 'bg-lime-50 border-lime-200',
  'Rio de Janeiro': 'bg-cyan-50 border-cyan-200',
  'São Paulo': 'bg-rose-50 border-rose-200',
  'Nordeste 1': 'bg-amber-50 border-amber-200',
  'Nordeste 2': 'bg-orange-50 border-orange-200',
  // Variações de nomenclatura que podem aparecer nos dados
  'R. Centro-Oeste': 'bg-purple-50 border-purple-200',
  'R. Norte': 'bg-teal-50 border-teal-200',
  'R. Nordeste': 'bg-violet-50 border-violet-200',
  'R. Sudeste': 'bg-emerald-50 border-emerald-200',
  'R. Sul': 'bg-indigo-50 border-indigo-200',
  'R. MG/ES': 'bg-lime-50 border-lime-200',
  'R. Rio de Janeiro': 'bg-cyan-50 border-cyan-200',
  'R. São Paulo': 'bg-rose-50 border-rose-200',
  'R. Nordeste 1': 'bg-amber-50 border-amber-200',
  'R. Nordeste 2': 'bg-orange-50 border-orange-200',
  // Variações em minúsculo
  'nacional': 'bg-blue-50 border-blue-200',
  'comercial': 'bg-green-50 border-green-200',
  'centro-oeste': 'bg-purple-50 border-purple-200',
  'centro_oeste': 'bg-purple-50 border-purple-200',
  'norte': 'bg-teal-50 border-teal-200',
  'nordeste': 'bg-violet-50 border-violet-200',
  'sudeste': 'bg-emerald-50 border-emerald-200',
  'sul': 'bg-indigo-50 border-indigo-200',
  'mg/es': 'bg-lime-50 border-lime-200',
  'mg_es': 'bg-lime-50 border-lime-200',
  'rio de janeiro': 'bg-cyan-50 border-cyan-200',
  'rj': 'bg-cyan-50 border-cyan-200',
  'são paulo': 'bg-rose-50 border-rose-200',
  'sp': 'bg-rose-50 border-rose-200',
  'nordeste 1': 'bg-amber-50 border-amber-200',
  'nordeste_1': 'bg-amber-50 border-amber-200',
  'nordeste 2': 'bg-orange-50 border-orange-200',
  'nordeste_2': 'bg-orange-50 border-orange-200',
  // Casos especiais
  'Sem Regional': 'bg-gray-50 border-gray-200',
  'sem regional': 'bg-gray-50 border-gray-200',
};

// Cores dos pontos indicadores
const getRegionalColorDot = (regionalId: string): string => {
  const colorMap: Record<string, string> = {
    'Nacional': '#3B82F6',
    'Comercial': '#10B981',
    'Centro-Oeste': '#8B5CF6',
    'Norte': '#14B8A6',
    'Nordeste': '#7C3AED',
    'Sudeste': '#059669',
    'Sul': '#4F46E5',
    'MG/ES': '#65A30D',
    'Rio de Janeiro': '#0891B2',
    'São Paulo': '#E11D48',
    'Nordeste 1': '#F59E0B',
    'Nordeste 2': '#EA580C',
    // Variações de nomenclatura
    'R. Centro-Oeste': '#8B5CF6',
    'R. Norte': '#14B8A6',
    'R. Nordeste': '#7C3AED',
    'R. Sudeste': '#059669',
    'R. Sul': '#4F46E5',
    'R. MG/ES': '#65A30D',
    'R. Rio de Janeiro': '#0891B2',
    'R. São Paulo': '#E11D48',
    'R. Nordeste 1': '#F59E0B',
    'R. Nordeste 2': '#EA580C',
    // Variações em minúsculo
    'nacional': '#3B82F6',
    'comercial': '#10B981',
    'centro-oeste': '#8B5CF6',
    'centro_oeste': '#8B5CF6',
    'norte': '#14B8A6',
    'nordeste': '#7C3AED',
    'sudeste': '#059669',
    'sul': '#4F46E5',
    'mg/es': '#65A30D',
    'mg_es': '#65A30D',
    'rio de janeiro': '#0891B2',
    'rj': '#0891B2',
    'são paulo': '#E11D48',
    'sp': '#E11D48',
    'nordeste 1': '#F59E0B',
    'nordeste_1': '#F59E0B',
    'nordeste 2': '#EA580C',
    'nordeste_2': '#EA580C',
    // Casos especiais
    'Sem Regional': '#6B7280',
    'sem regional': '#6B7280',
  };
  return colorMap[regionalId] || '#6B7280';
};

// Estados por região (para exibição) - mapeamento flexível
const estadosPorRegiao: Record<string, string[]> = {
  'Nacional': ['Todos os Estados'],
  'nacional': ['Todos os Estados'],
  'Comercial': ['Todos os Estados'],
  'comercial': ['Todos os Estados'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  'centro-oeste': ['DF', 'GO', 'MT', 'MS'],
  'centro_oeste': ['DF', 'GO', 'MT', 'MS'],
  'R. Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  'norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  'R. Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  'Nordeste': ['CE', 'PB', 'RN', 'MA', 'PI', 'BA', 'SE', 'PE', 'AL'],
  'nordeste': ['CE', 'PB', 'RN', 'MA', 'PI', 'BA', 'SE', 'PE', 'AL'],
  'R. Nordeste': ['CE', 'PB', 'RN', 'MA', 'PI', 'BA', 'SE', 'PE', 'AL'],
  'Sudeste': ['MG', 'ES', 'RJ', 'SP'],
  'sudeste': ['MG', 'ES', 'RJ', 'SP'],
  'R. Sudeste': ['MG', 'ES', 'RJ', 'SP'],
  'Sul': ['RS', 'PR', 'SC'],
  'sul': ['RS', 'PR', 'SC'],
  'R. Sul': ['RS', 'PR', 'SC'],
  'MG/ES': ['MG', 'ES'],
  'mg/es': ['MG', 'ES'],
  'mg_es': ['MG', 'ES'],
  'R. MG/ES': ['MG', 'ES'],
  'Rio de Janeiro': ['RJ'],
  'rio de janeiro': ['RJ'],
  'rj': ['RJ'],
  'R. Rio de Janeiro': ['RJ'],
  'São Paulo': ['SP'],
  'são paulo': ['SP'],
  'sp': ['SP'],
  'R. São Paulo': ['SP'],
  'Nordeste 1': ['CE', 'PB', 'RN', 'MA', 'PI'],
  'nordeste 1': ['CE', 'PB', 'RN', 'MA', 'PI'],
  'nordeste_1': ['CE', 'PB', 'RN', 'MA', 'PI'],
  'R. Nordeste 1': ['CE', 'PB', 'RN', 'MA', 'PI'],
  'Nordeste 2': ['BA', 'SE', 'PE', 'AL'],
  'nordeste 2': ['BA', 'SE', 'PE', 'AL'],
  'nordeste_2': ['BA', 'SE', 'PE', 'AL'],
  'R. Nordeste 2': ['BA', 'SE', 'PE', 'AL'],
  'Sem Regional': [],
  'sem regional': [],
};

export default function RegionaisPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: userStats, loading: statsLoading, error: statsError } = useUserStats();
  const { data: regionaisDataRaw, loading: regionaisLoading, error: regionaisError } = useRegionalData();
  
  // Estado para controlar o modal de registrar atividade
  const [showRegistrarModal, setShowRegistrarModal] = useState(false);
  const [selectedRegionalId, setSelectedRegionalId] = useState<string>('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({ type: 'success', title: '', message: '' });

  const handleRegionalClick = (regionalId: string) => {
    const mappedId = mapRegionalId(regionalId);
    navigate(`/regionais/${mappedId}`);
  };

  const handleRegistrarAtividade = (regionalId: string) => {
    setSelectedRegionalId(mapRegionalId(regionalId));
    setShowRegistrarModal(true);
  };

  const handleSubmitAtividade = async (form: any) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('Usuário não autenticado');
        return;
      }

      // Preparar FormData para envio com arquivos
      const formData = new FormData();
      
      // Adicionar dados da atividade
      const atividadeData = {
        title: form.atividadeLabel === 'OUTRA' && form.atividadeCustomLabel.trim() 
          ? form.atividadeCustomLabel.trim() 
          : form.atividadeLabel || form.atividade,
        description: form.descricao || '',
        type: form.atividade,
        activity_date: form.dataAtividade,
        responsavel_id: form.responsavel || null,
        // Para atividades NPS, sempre usar a primeira regional selecionada no formulário
        // Isso garante que a nota NPS seja contabilizada para a regional escolhida
        regional: form.atividade === 'nps' 
          ? (form.regionaisNPS && form.regionaisNPS.length > 0 ? form.regionaisNPS[0] : selectedRegionalId || form.regional)
          : selectedRegionalId || form.regional,
        // Adicionar os campos que estavam faltando
        programa: form.programa || '',
        estados: form.estados || [],
        instituicaoId: form.instituicaoId || '',
        quantidade: form.quantidade || null,
        atividadeLabel: form.atividadeLabel || '',
        atividadeCustomLabel: form.atividadeCustomLabel || '',
        // Para atividades NPS, incluir todas as regionais selecionadas
        regionaisNPS: form.atividade === 'nps' ? form.regionaisNPS || [] : []
      };

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

      // Processar evidências se existirem
      if (form.evidencias && form.evidencias.length > 0) {
        console.log('🔍 DEBUG - Processando evidências:', form.evidencias);
        
        // Converter base64 para File objects
        for (const evidencia of form.evidencias) {
          if (evidencia.url && evidencia.url.startsWith('data:')) {
            try {
              // Extrair dados do base64
              const response = await fetch(evidencia.url);
              const blob = await response.blob();
              
              // Criar File object
              const file = new File([blob], evidencia.filename, { 
                type: evidencia.mimeType 
              });
              
              formData.append('evidencias', file);
              console.log('✅ Arquivo adicionado ao FormData:', evidencia.filename);
            } catch (error) {
              console.error('❌ Erro ao processar evidência:', evidencia.filename, error);
            }
          }
        }
      }

      console.log('🔍 DEBUG - Form data recebido:', form);
      console.log('🔍 DEBUG - FormData preparado para envio');

      // Chamar a nova API para salvar a atividade regional
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/regional-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Não definir Content-Type para multipart/form-data - o browser define automaticamente
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Atividade regional salva com sucesso:', result);
      
      // Invalidar cache das atividades regionais para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['regional-activities'] });
      
      // Fechar o modal após salvar
      setShowRegistrarModal(false);
      setSelectedRegionalId('');
      
      // Mostrar confirmação de sucesso
      setNotificationData({
        type: 'success',
        title: 'Sucesso!',
        message: 'Atividade registrada com sucesso!'
      });
      setShowNotificationModal(true);
    } catch (error) {
      console.error('Erro ao registrar atividade regional:', error);
      // Mostrar mensagem de erro
      setNotificationData({
        type: 'error',
        title: 'Erro ao registrar atividade',
        message: 'Não foi possível registrar a atividade. Tente novamente.'
      });
      setShowNotificationModal(true);
    }
  };

  const mapRegionalId = (id: string): string => {
    switch (id.toLowerCase()) {
      case 'centro-oeste': return 'centro_oeste';
      case 'mg/es': return 'mg_es';
      case 'nordeste 1': return 'nordeste_1';
      case 'nordeste 2': return 'nordeste_2';
      case 'rio de janeiro': return 'rj';
      case 'são paulo': return 'sp';
      default: return id.toLowerCase().replace(/\s+/g, '_'); // nacional, comercial, norte, sul
    }
  };

  // Função para obter estados de uma regional
  const getEstadosPorRegional = (nomeRegional: string): string[] => {
    if (!nomeRegional) return [];
    
    // Normalizar o nome da regional
    const nomeNormalizado = nomeRegional.toLowerCase().trim();
    
    // Buscar no mapeamento
    const estados = estadosPorRegiao[nomeNormalizado] || estadosPorRegiao[nomeRegional];
    
    console.log(`📍 DEBUG - Regional: "${nomeRegional}", Estados encontrados:`, estados || 'NENHUM');
    console.log(`🔑 DEBUG - Chaves exatas no mapeamento que contêm "${nomeRegional}":`, 
      Object.keys(estadosPorRegiao).filter(key => key.includes(nomeRegional) || key.includes(nomeNormalizado))
    );
    
    return estados || [];
  };

  // Converter dados do hook para o formato esperado pelo componente
  console.log('🔍 DEBUG - Dados brutos recebidos do hook:', regionaisDataRaw);
  console.log('🗺️ DEBUG - Mapeamento de estados disponível:', Object.keys(estadosPorRegiao));
  
  const regionaisData: Regional[] = (regionaisDataRaw || []).map(data => {
    const states = getEstadosPorRegional(data.regional);
    
    // Determinar o líder (regional ou nacional para casos específicos)
    const leaderData = data.liderRegional || 
      (data.liderNacional && (data.regional === 'Nacional' || data.regional === 'Comercial') ? data.liderNacional : null);
    
    // Debug específico para Centro-Oeste
    if (data.regional === 'Centro-Oeste' || data.regional === 'R. Centro-Oeste') {
      console.log('🔍 DEBUG CENTRO-OESTE - Dados brutos:', data);
      console.log('🔍 DEBUG CENTRO-OESTE - Líder encontrado:', leaderData);
      console.log('🔍 DEBUG CENTRO-OESTE - liderRegional:', data.liderRegional);
    }
    
    return {
      id: data.regional,
      name: data.regional,
      states: states,
      leader: leaderData ? {
        name: leaderData.nome,
        role: leaderData.funcao
      } : undefined,
      coordinator: data.coordenadores.length > 0 ? {
        name: data.coordenadores[0].nome,
        role: data.coordenadores[0].funcao
      } : undefined,
      consultants: data.consultores.map(c => ({
        name: c.nome,
        role: c.funcao
      })),
      totalMembers: data.totalMembros,
      color: regionalColors[data.regional] || 'bg-slate-50 border-slate-200'
    };
  });

  // Reordenar os dados para colocar R. Centro-Oeste logo após Nacional
  // Remover o card 'Comercial' desta página (ele deve aparecer apenas no Nacional)
  const regionaisSemComercial = regionaisData.filter(r => r.name !== 'Comercial' && r.id !== 'Comercial' && r.id !== 'comercial');
  const reorderedRegionaisData = [...regionaisSemComercial].sort((a, b) => {
    // Nacional sempre primeiro
    if (a.name === 'Nacional') return -1;
    if (b.name === 'Nacional') return 1;
    
    // R. Centro-Oeste ou Centro-Oeste logo após Nacional
    if (a.name === 'R. Centro-Oeste' || a.name === 'Centro-Oeste') return -1;
    if (b.name === 'R. Centro-Oeste' || b.name === 'Centro-Oeste') return 1;
    
    // Manter ordem original para os demais
    return 0;
  });
  
  console.log('✅ DEBUG - Dados finais processados:', reorderedRegionaisData.map(r => ({ name: r.name, statesCount: r.states.length, states: r.states })));

  // Usar dados reais se disponíveis, senão usar dados mockados como fallback
  const totalLideres = userStats?.lideresRegionais ?? 0;
  const totalCoordenadores = userStats?.coordenadores ?? 0;
  const totalMembros = userStats?.totalMembros ?? 0;
  const totalNacional = userStats?.totalNacional ?? 0; // Usuários com função "Nacional"

  // Estados de loading e erro
  const isLoading = statsLoading || regionaisLoading;
  const hasError = statsError || regionaisError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Carregando dados regionais...</div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <div className="text-lg text-red-600 mb-2">Erro ao carregar dados</div>
          <div className="text-sm text-gray-600">{statsError || regionaisError}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Regionais</h1>
        <p className="text-gray-600">Gestão das 8 Regionais e Equipes</p>
      </div>

      {/* Estatísticas removidas conforme solicitação: ocultar os 4 cards principais */}

      {/* Regional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reorderedRegionaisData.map((regional) => (
          <Card key={regional.id} className={`p-6 ${regionalColors[regional.id] || 'bg-slate-50 border-slate-200'} hover:shadow-xl hover:scale-105 hover:border-opacity-80 transition-all duration-300 cursor-pointer`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3 shadow-sm"
                  style={{ backgroundColor: getRegionalColorDot(regional.id) }}
                />
                <h3 className="text-xl font-semibold text-gray-900">{regional.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{regional.totalMembers}</p>
                <p className="text-sm text-gray-600">membros</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Estados:</p>
              <div className="flex flex-wrap gap-2">
                {regional.states.map((state) => (
                  <span
                    key={state}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {state}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-6">
              {regional.leader && (
                <div className="flex items-center">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Líder Regional:</span> {regional.leader.name}
                  </span>
                </div>
              )}
              
              {/* Debug específico para Centro-Oeste */}
              {(regional.name === 'Centro-Oeste' || regional.name === 'R. Centro-Oeste') && (
                <div style={{ display: 'none' }}>
                  {console.log('🔍 DEBUG CARD CENTRO-OESTE - regional.leader:', regional.leader)}
                  {console.log('🔍 DEBUG CARD CENTRO-OESTE - regional completo:', regional)}
                </div>
              )}

              {regional.coordinator && (
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm">
                    <span className="font-medium">Coordenador:</span> {regional.coordinator.name}
                  </span>
                </div>
              )}

              {regional.consultants && regional.consultants.length > 0 && (
                <div className="flex items-start">
                  <UserCheck className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium">Consultores:</span>
                    <div className="mt-1">
                      {regional.consultants.map((consultant, index) => (
                        <span key={index} className="block text-gray-600">
                          • {consultant.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-2"
                size="sm"
                onClick={() => handleRegistrarAtividade(regional.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Registrar Atividade
              </Button>



              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                size="sm"
                onClick={() => navigate(`/regionais/gestao-atividades?regional=${mapRegionalId(regional.id)}`)}
              >
                <Activity className="h-4 w-4 mr-1" />
                Todas as Atividades
              </Button>

              <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2"
                size="sm"
                onClick={() => navigate(`/regionais/calendario?regional=${regional.id}`)}
              >
                <Calendar className="h-4 w-4 mr-1" />
                Calendário Atividades
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de Registrar Atividade */}
      <RegistrarAtividadeModal
        isOpen={showRegistrarModal}
        onClose={() => {
          setShowRegistrarModal(false);
          setSelectedRegionalId('');
        }}
        onSubmit={handleSubmitAtividade}
        regionalId={selectedRegionalId}
      />

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