import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Download, 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Image as ImageIcon, 
  Edit, 
  Edit2,
  Trash2, 
  Eye,
  Activity,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  Building2,
  Hash
} from 'lucide-react';
import LazyImage from '@/components/ui/LazyImage';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from "xlsx";

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ConfirmModal from '@/components/modals/ConfirmModal';
import { useRegionalActivities, useUsersWithMembers } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS } from '@/pages/calendario/constants';
import RegionalActivityService from '@/services/regionalActivityService';
import type { Atividade } from '@/types';

// Mapeamento de estados por regional
const REGIONAL_STATES: Record<string, string[]> = {
  nacional: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
  comercial: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
  centro_oeste: ['DF','GO','MT','MS'],
  mg_es: ['MG','ES'],
  nordeste_1: ['CE','PB','RN','MA','PI'],
  nordeste_2: ['BA','SE','PE','AL'],
  norte: ['AC','AP','AM','PA','RO','RR','TO'],
  rj: ['RJ'],
  sp: ['SP'],
  sul: ['RS','PR','SC'],
};

// Lista de estados brasileiros
// Estados da Regional Norte apenas
const ESTADOS_NORTE = [
  { value: 'AC', label: 'Acre' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'PA', label: 'Pará' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'TO', label: 'Tocantins' }
];

interface FilterState {
  search: string;
  tipo: string;
  estado: string;
  responsavel: string;
  mes: string;
  ano: string;
}

interface EvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidences: Array<{ url: string; filename: string; mimetype?: string }>;
  activityTitle: string;
}

function EvidenceModal({ isOpen, onClose, evidences, activityTitle }: EvidenceModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Evidências da Atividade</h3>
            <p className="text-sm text-gray-600">{activityTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {evidences.length > 0 ? (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {evidences.map((evidence, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <LazyImage
                      src={evidence.url}
                      alt={evidence.filename}
                      className="w-full h-full object-cover"
                      width={80}
                      height={80}
                    />
                  </button>
                ))}
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <LazyImage
                  src={evidences[selectedIndex].url}
                  alt={evidences[selectedIndex].filename}
                  className="w-full max-h-96 object-contain rounded-lg"
                  width={600}
                  height={384}
                />
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {evidences[selectedIndex].filename}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Nenhuma evidência disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GestaoAtividadesRegionaisPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: activities = [], isLoading, refetch } = useRegionalActivities();
  // Buscar todos usuários (inclui líderes regionais) para popular lista de responsáveis
  const { data: usersApiData } = useUsersWithMembers();
  const userNames = useMemo(() => {
    const arr = usersApiData ?? [];
    try {
      return Array.from(new Set((arr as any[])
        .map(u => (u?.nome ?? u?.name ?? u?.email ?? '').toString().trim())
        .filter(v => v.length > 0))) as string[];
    } catch {
      return [] as string[];
    }
  }, [usersApiData]);
  
  // Função para mapear a regional do usuário para o formato usado nos filtros
  const mapUserRegionalToFilter = (userRegional?: string): string => {
    if (!userRegional) return 'todas';
    
    const mapping: Record<string, string> = {
      'Nacional': 'nacional',
      'Comercial': 'comercial',
      'Centro-Oeste': 'centro_oeste',
      'MG/ES': 'mg_es',
      'Nordeste 1': 'nordeste_1',
      'Nordeste 2': 'nordeste_2',
      'Norte': 'norte',
      'Rio de Janeiro': 'rj',
      'São Paulo': 'sp',
      'Sul': 'sul',
      // Mapeamentos com prefixo "R."
      'R. Nacional': 'nacional',
      'R. Comercial': 'comercial',
      'R. Centro-Oeste': 'centro_oeste',
      'R. MG/ES': 'mg_es',
      'R. Nordeste 1': 'nordeste_1',
      'R. Nordeste 2': 'nordeste_2',
      'R. Norte': 'norte',
      'R. Rio de Janeiro': 'rj',
      'R. São Paulo': 'sp',
      'R. Sul': 'sul',
    };
    
    return mapping[userRegional] || 'todas';
  };

  // Determinar filtro regional inicial baseado no usuário logado
  const getInitialRegionalFilter = (): string => {
    console.log('🔍 Debug - Usuário logado:', {
      user: user,
      role: user?.role,
      regional: user?.regional,
      isSuperAdmin: user?.role === 'super_admin'
    });
    
    // Se o usuário é super_admin, pode ver todas as regionais
    if (user?.role === 'super_admin') {
      const filter = searchParams.get('regional') || 'todas';
      console.log('👑 Super admin - filtro:', filter);
      return filter;
    }
    
    // Para outros usuários, filtrar pela sua regional
    const mappedRegional = mapUserRegionalToFilter(user?.regional);
    console.log('👤 Usuário comum - regional mapeada:', mappedRegional);
    return mappedRegional;
  };

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tipo: searchParams.get('tipo') || 'todos',
    estado: 'todos',
    responsavel: 'todos',
    mes: 'todos',
    ano: 'todos'
  });

  const [evidenceModal, setEvidenceModal] = useState<{
    isOpen: boolean;
    evidences: Array<{ url: string; filename: string; mimetype?: string }>;
    activityTitle: string;
  }>({
    isOpen: false,
    evidences: [],
    activityTitle: ''
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // Extrair responsáveis únicos (de atividades + de todos usuários)
  const responsaveis = useMemo(() => {
    const nomesAtividades = Array.from(new Set(
      activities
        .map(a => a.responsavel?.nome)
        .filter(Boolean)
    )) as string[];
    const all = Array.from(new Set([...nomesAtividades, ...userNames]));
    return ['todos', ...all.sort()];
  }, [activities, userNames]);

  const availableYears = useMemo(() => [2025, 2026, 2027], []);

  // Filtrar atividades
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchSearch = !filters.search || 
        activity.titulo.toLowerCase().includes(filters.search.toLowerCase()) ||
        activity.descricao?.toLowerCase().includes(filters.search.toLowerCase()) ||
        activity.responsavel?.nome?.toLowerCase().includes(filters.search.toLowerCase());

      const matchTipo = filters.tipo === 'todos' || activity.tipo === filters.tipo;
      
      const matchEstado = filters.estado === 'todos' || activity.estado === filters.estado;
      
      const matchResponsavel = filters.responsavel === 'todos' || 
        activity.responsavel?.nome === filters.responsavel;

      const d = new Date(activity.data_inicio);
      const mes = (d.getMonth() + 1).toString();
      const ano = d.getFullYear().toString();
      const matchMes = filters.mes === 'todos' || filters.mes === mes;
      const matchAno = filters.ano === 'todos' || filters.ano === ano;

      // Filtro por regional - aplicar apenas se uma regional específica foi selecionada
      const regionalParam = searchParams.get('regional');
      const matchRegional = !regionalParam || regionalParam === 'todas' || 
        activity.regional === regionalParam;

      return matchSearch && matchTipo && matchEstado && matchResponsavel && 
             matchMes && matchAno && matchRegional;
    });
  }, [activities, filters, searchParams]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = activities.length;
    const filtradas = filteredActivities.length;
    const comEvidencias = activities.filter(a => (a.evidencias?.length || 0) > 0).length;
    const regionaisUnicas = new Set(activities.map(a => a.regional)).size;
    const tiposUnicos = new Set(activities.map(a => a.tipo)).size;
    const responsaveisUnicos = new Set(activities.map(a => a.responsavel?.nome).filter(Boolean)).size;

    return {
      total,
      filtradas,
      comEvidencias,
      semEvidencias: total - comEvidencias,
      regionaisUnicas,
      tiposUnicos,
      responsaveisUnicos
    };
  }, [activities, filteredActivities]);

  // Exportar para XLSX
  const exportToXLSX = () => {
    const exportData = filteredActivities.map(activity => ({
      'Título': activity.titulo,
      'Tipo': activity.tipo,
      'Data da Atividade': format(parseISO(activity.data_inicio), 'dd/MM/yyyy', { locale: ptBR }),
      'Estado': ESTADOS_BRASIL.find(e => e.value === activity.estado)?.label || activity.estado,
      'Programa': activity.programa || '',
      'Responsável': activity.responsavel?.nome || '',
      'Local': activity.local || '',
      'Participantes': activity.participantes_confirmados || 0,
      'Quantidade': activity.quantidade || '',
      'Descrição': activity.descricao || '',
      'Evidências': (activity.evidencias?.length || 0) > 0 ? 'Sim' : 'Não',
      'Qtd. Evidências': activity.evidencias?.length || 0,
      'Data de Registro': format(parseISO(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Atividades Regionais');
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 30 }, // Título
      { wch: 20 }, // Tipo
      { wch: 12 }, // Data
      { wch: 15 }, // Regional
      { wch: 15 }, // Programa
      { wch: 20 }, // Responsável
      { wch: 25 }, // Local
      { wch: 12 }, // Participantes
      { wch: 10 }, // Quantidade
      { wch: 40 }, // Descrição
      { wch: 10 }, // Evidências
      { wch: 12 }, // Qtd. Evidências
      { wch: 18 }  // Data de Registro
    ];
    ws['!cols'] = colWidths;

    const fileName = `atividades_regionais_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const openEvidenceModal = (activity: Atividade) => {
    setEvidenceModal({
      isOpen: true,
      evidences: activity.evidencias || [],
      activityTitle: activity.titulo
    });
  };

  const closeEvidenceModal = () => {
    setEvidenceModal({
      isOpen: false,
      evidences: [],
      activityTitle: ''
    });
  };

  const handleEdit = (activity: Atividade) => {
    // Navegar para a página de edição
    navigate(`/regionais/atividades/editar/${activity.id}`);
  };

  const handleDelete = async (activityId: string) => {
    setActivityToDelete(activityId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!activityToDelete) return;
    
    try {
      // Chamar o serviço para deletar a atividade
      await RegionalActivityService.deleteActivity(activityToDelete);
      
      // Atualizar a lista de atividades imediatamente
      await refetch();
      
      console.log('✅ Atividade excluída com sucesso:', activityToDelete);
    } catch (error) {
      console.error('❌ Erro ao excluir atividade:', error);
      // Aqui você pode adicionar uma notificação de erro se necessário
    } finally {
      setShowConfirmModal(false);
      setActivityToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando atividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => navigate('/regionais')}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </Button>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    Gestão de Atividades Regionais
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Gerencie, visualize e exporte todas as atividades regionais cadastradas
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                  <Button
                    onClick={exportToXLSX}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar XLSX
                  </Button>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-6 mb-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Filtros Avançados</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  search: '',
                  tipo: 'todos',
                  estado: 'todos',
                  responsavel: 'todos',
                  mes: 'todos',
                  ano: 'todos'
                })}
              >
                Limpar Filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Busca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Título, descrição ou responsável..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Atividade
                  </label>
                  <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos os tipos</option>
                    {ATIVIDADE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={filters.estado}
                    onChange={(e) => setFilters({ ...filters, estado: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos os estados</option>
                    {ESTADOS_NORTE.map(estado => (
                      <option key={estado.value} value={estado.value}>{estado.label}</option>
                    ))}
                  </select>
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <select
                    value={filters.responsavel}
                    onChange={(e) => setFilters({ ...filters, responsavel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {responsaveis.map(responsavel => (
                      <option key={responsavel} value={responsavel}>
                        {responsavel === 'todos' ? 'Todos os responsáveis' : responsavel}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mês */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês
                  </label>
                  <select
                    value={filters.mes}
                    onChange={(e) => setFilters({ ...filters, mes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos</option>
                    <option value="1">Janeiro</option>
                    <option value="2">Fevereiro</option>
                    <option value="3">Março</option>
                    <option value="4">Abril</option>
                    <option value="5">Maio</option>
                    <option value="6">Junho</option>
                    <option value="7">Julho</option>
                    <option value="8">Agosto</option>
                    <option value="9">Setembro</option>
                    <option value="10">Outubro</option>
                    <option value="11">Novembro</option>
                    <option value="12">Dezembro</option>
                  </select>
                </div>

                {/* Ano */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <select
                    value={filters.ano}
                    onChange={(e) => setFilters({ ...filters, ano: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="todos">Todos</option>
                    {availableYears.map((y) => (
                      <option key={y} value={y.toString()}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status das Evidências removido conforme solicitação */}
            </div>
          </Card>

        {/* Resultados */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {filteredActivities.length} de {stats.total} atividades
            </p>
            {filteredActivities.length !== stats.total && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  search: '',
                  tipo: 'todos',
                  estado: 'todos',
                  responsavel: 'todos',
                  mes: 'todos',
                  ano: 'todos'
                })}
              >
                Ver Todas
              </Button>
            )}
          </div>
        </div>

        {/* Lista de Atividades */}
        <div className="space-y-6">
          {filteredActivities.length === 0 ? (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma atividade encontrada
              </h3>
              <p className="text-gray-600">
                Tente ajustar os filtros ou cadastrar uma nova atividade.
              </p>
            </Card>
          ) : (
            filteredActivities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  {/* Header com título e badges */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {activity.titulo}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {ATIVIDADE_OPTIONS.find(opt => opt.value === activity.tipo)?.label || activity.tipo}
                        </span>
                        {(activity.evidencias?.length || 0) > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {activity.evidencias?.length} evidência(s)
                          </span>
                        )}
                        {activity.quantidade && activity.quantidade > 0 && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Quantidade: {activity.quantidade}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Evidências Preview */}
                    {(activity.evidencias?.length || 0) > 0 && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="flex gap-2">
                          {activity.evidencias?.slice(0, 3).map((evidence, index) => (
                            <div
                              key={index}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openEvidenceModal(activity)}
                            >
                              <img
                                src={evidence.url}
                                alt={evidence.filename}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {(activity.evidencias?.length || 0) > 3 && (
                            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center text-xs text-gray-500 font-medium">
                              +{(activity.evidencias?.length || 0) - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Informações principais - linha única para Data, Estados, Responsável e Instituição */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Data da Atividade */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Data da Atividade</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {format(parseISO(activity.data_inicio), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>

                    {/* Estados */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Estados</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {(() => {
                          // Parse dos estados se necessário
                          let estados = activity.estados;
                          if (typeof estados === 'string') {
                            try {
                              estados = JSON.parse(estados);
                            } catch {
                              estados = [];
                            }
                          }

                          // Verificar se é array válido e não vazio
                          if (Array.isArray(estados) && estados.length > 0) {
                            return estados.join(', ');
                          }
                          return 'N/A';
                        })()}
                      </p>
                    </div>

                    {/* Responsável */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Responsável</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.responsavel?.nome || activity.responsavel || 'N/A'}
                      </p>
                    </div>

                    {/* Instituição */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Instituição</span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.instituicao?.nome || activity.instituicao || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Informações secundárias */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Participantes - só exibir se houver participantes confirmados */}
                    {activity.participantes_confirmados > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Participantes</span>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {activity.participantes_confirmados}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  {activity.descricao && (
                    <div className="mb-6">
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Descrição</span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {activity.descricao}
                      </p>
                    </div>
                  )}

                  {/* Footer com data de registro e ações */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium">Registrada em:</span>
                      {activity.created_at ? format(parseISO(activity.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : 'Data não disponível'}
                    </div>

                    <div className="flex items-center gap-2">
                      {(activity.evidencias?.length || 0) > 0 && (
                        <button
                          onClick={() => openEvidenceModal(activity)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Ver Evidências
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleEdit(activity)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                      
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Evidence Modal */}
      <EvidenceModal
        isOpen={evidenceModal.isOpen}
        onClose={closeEvidenceModal}
        evidences={evidenceModal.evidences}
        activityTitle={evidenceModal.activityTitle}
      />

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setActivityToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir esta atividade? Esta ação não pode ser desfeita."
        type="danger"
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
}