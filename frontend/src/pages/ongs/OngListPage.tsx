import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ONGForm, Regional, Programa } from '@/types';
import { Building2, Plus, Edit, Trash2, UserX, Search, Eye } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { EvasaoModal } from '@/components/modals/EvasaoModal';
import { InstituicaoService, Instituicao } from '@/services/instituicaoService';

interface ONG extends ONGForm {
  id: string;
  created_at: string;
  status: 'ativa' | 'inativa' | 'evadida';
}

export default function OngListPage() {
  const navigate = useNavigate();
  const [ongs, setOngs] = useState<ONG[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativa' | 'inativa' | 'evadida'>('todos');
  const [filtroRegional, setFiltroRegional] = useState<'todas' | Regional>('todas');
  const [filtroPrograma, setFiltroPrograma] = useState<'todos' | Programa>('todos');
  const [evasaoModal, setEvasaoModal] = useState<{ isOpen: boolean; ong: ONG | null }>({
    isOpen: false,
    ong: null
  });
  const { showSuccess, showError, showConfirmation } = useNotificationStore();

  // Carregar ONGs da API
  useEffect(() => {
    const loadOngs = async () => {
      try {
        setLoading(true);
        const instituicoes = await InstituicaoService.getInstituicoes();
        
        // Converter formato da API para o formato esperado pela interface
        const ongsList: ONG[] = instituicoes.map((inst: Instituicao) => ({
          id: inst.id!,
          nome: inst.nome,
          cnpj: inst.cnpj,
          endereco: inst.endereco,
          cidade: inst.cidade,
          estado: inst.estado,
          cep: inst.cep,
          telefone: inst.telefone,
          email: inst.email,
          regional: inst.regional,
          programa: inst.programa,
          programas: inst.programas || [], // Incluir o campo programas
          observacoes: inst.observacoes || '',
          nome_lider: inst.nome_lider,
          documentos: inst.documentos || [],
          created_at: inst.created_at!,
          status: inst.status
        }));
        
        setOngs(ongsList);
      } catch (error) {
        console.error('Erro ao carregar instituições:', error);
        showError('Erro ao carregar instituições');
        setOngs([]);
      } finally {
        setLoading(false);
      }
    };

    loadOngs();
  }, [showError]);

  // Filtrar ONGs
  const ongsFiltradas = useMemo(() => {
    return ongs.filter(ong => {
      const matchSearch = !searchTerm || 
        ong.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ong.cnpj && ong.cnpj.includes(searchTerm)) ||
        (ong.cidade && ong.cidade.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchRegional = filtroRegional === 'todas' || ong.regional === filtroRegional;
      const matchPrograma = filtroPrograma === 'todos' || ong.programa === filtroPrograma;
      const matchStatus = filtroStatus === 'todos' || ong.status === filtroStatus;

      return matchSearch && matchRegional && matchPrograma && matchStatus;
    });
  }, [ongs, searchTerm, filtroRegional, filtroPrograma, filtroStatus]);

  const handleEdit = (ong: ONG) => {
    navigate(`/ongs/editar/${ong.id}`, { state: { ong } });
  };

  const handleDelete = async (ong: ONG) => {
    const confirmed = await showConfirmation({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir a ONG "${ong.nome}"?`,
      onConfirm: () => {},
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    if (confirmed) {
      try {
        await InstituicaoService.deleteInstituicao(ong.id);
        
        // Atualizar lista local
        const updatedOngs = ongs.filter(o => o.id !== ong.id);
        setOngs(updatedOngs);
        
        showSuccess('Instituição excluída com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir instituição:', error);
        showError('Erro ao excluir instituição');
      }
    }
  };

  const handleEvasao = (ong: ONG) => {
    setEvasaoModal({ isOpen: true, ong });
  };

  const handleConfirmEvasao = async (motivo: string, data: string) => {
    if (!evasaoModal.ong) return;

    try {
      await InstituicaoService.marcarEvasao(evasaoModal.ong.id, {
        motivo,
        data
      });

      // Atualizar lista local
      const updatedOngs = ongs.map(o => 
        o.id === evasaoModal.ong!.id 
          ? { 
              ...o, 
              status: 'evadida' as const,
              evasao: {
                motivo,
                data,
                registradoEm: new Date().toISOString()
              }
            } 
          : o
      );
      
      setOngs(updatedOngs);
      setEvasaoModal({ isOpen: false, ong: null });
      showSuccess('Evasão registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar evasão:', error);
      showError('Erro ao registrar evasão');
    }
  };

  const getRegionalLabel = (regional: Regional) => {
    const labels: Record<Regional, string> = {
      nacional: 'Nacional',
      comercial: 'Comercial',
      centro_oeste: 'Centro-Oeste',
      mg_es: 'MG/ES',
      nordeste_1: 'Nordeste 1',
      nordeste_2: 'Nordeste 2',
      norte: 'Norte',
      rj: 'RJ',
      sp: 'SP',
      sul: 'Sul'
    };
    return labels[regional] || regional;
  };

  const getProgramaLabel = (programa: Programa) => {
    const labels: Record<Programa, string> = {
      as_maras: 'As Maras',
      microcredito: 'Microcrédito',
      decolagem: 'Decolagem'
    };
    return labels[programa] || programa;
  };

  const getProgramasDisplay = (ong: ONG) => {
    // Debug: Log para verificar dados recebidos
    if (ong.nome?.includes('Wise Madness') || ong.nome?.includes('Recomeçar')) {
      console.log(`🔍 DEBUG ${ong.nome}:`, {
        programa: ong.programa,
        programas: ong.programas,
        programasLength: ong.programas?.length,
        programasType: typeof ong.programas
      });
    }
    
    // Priorizar programas (múltiplos) sobre programa (único)
    if (ong.programas && ong.programas.length > 0) {
      const result = ong.programas.map(p => getProgramaLabel(p)).join(', ');
      if (ong.nome?.includes('Wise Madness') || ong.nome?.includes('Recomeçar')) {
        console.log(`✅ Retornando múltiplos programas para ${ong.nome}:`, result);
      }
      return result;
    }
    // Fallback para programa único (compatibilidade)
    if (ong.programa) {
      const result = getProgramaLabel(ong.programa);
      if (ong.nome?.includes('Wise Madness') || ong.nome?.includes('Recomeçar')) {
        console.log(`⚠️ Retornando programa único para ${ong.nome}:`, result);
      }
      return result;
    }
    if (ong.nome?.includes('Wise Madness') || ong.nome?.includes('Recomeçar')) {
      console.log(`❌ Nenhum programa encontrado para ${ong.nome}`);
    }
    return '-';
  };

  const getStatusBadge = (status: ONG['status']) => {
    const styles = {
      ativa: 'bg-green-100 text-green-800',
      inativa: 'bg-gray-100 text-gray-800',
      evadida: 'bg-red-100 text-red-800'
    };
    const labels = {
      ativa: 'Ativa',
      inativa: 'Inativa',
      evadida: 'Evadida'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Carregando ONGs...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-pink-600" />
          <h1 className="text-2xl font-bold text-gray-900">Instituições</h1>
        </div>
        <Button 
          className="bg-pink-600 hover:bg-pink-700 text-white"
          onClick={() => navigate('/ongs/cadastrar')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Instituição
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Barra de busca */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ ou cidade..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtros sempre visíveis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Regional</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                value={filtroRegional}
                onChange={(e) => setFiltroRegional(e.target.value as Regional | 'todas')}
              >
                <option value="todas">Todas as Regionais</option>
                <option value="nacional">Nacional</option>
                <option value="comercial">Comercial</option>
                <option value="centro_oeste">Centro-Oeste</option>
                <option value="mg_es">MG/ES</option>
                <option value="nordeste_1">Nordeste 1</option>
                <option value="nordeste_2">Nordeste 2</option>
                <option value="norte">Norte</option>
                <option value="rj">RJ</option>
                <option value="sp">SP</option>
                <option value="sul">Sul</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                value={filtroPrograma}
                onChange={(e) => setFiltroPrograma(e.target.value as Programa | 'todos')}
              >
                <option value="todos">Todos os Programas</option>
                <option value="as_maras">As Maras</option>
                <option value="microcredito">Microcrédito</option>
                <option value="decolagem">Decolagem</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as 'todos' | 'ativa' | 'inativa' | 'evadida')}
              >
                <option value="todos">Todos os Status</option>
                <option value="ativa">Ativas</option>
                <option value="inativa">Inativas</option>
                <option value="evadida">Evadidas</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-900">{ongs.length}</div>
          <div className="text-sm text-gray-600">Total de ONGs</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{ongs.filter(o => o.status === 'ativa').length}</div>
          <div className="text-sm text-gray-600">ONGs Ativas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-gray-600">{ongs.filter(o => o.status === 'inativa').length}</div>
          <div className="text-sm text-gray-600">ONGs Inativas</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{ongs.filter(o => o.status === 'evadida').length}</div>
          <div className="text-sm text-gray-600">ONGs Evadidas</div>
        </Card>
      </div>

      {/* Lista de ONGs */}
      <Card className="overflow-hidden">
        {ongsFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {ongs.length === 0 ? 'Nenhuma ONG cadastrada' : 'Nenhuma ONG encontrada com os filtros aplicados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Regional
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Programa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ongsFiltradas.map((ong) => (
                  <tr key={ong.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ong.nome}</div>
                        {ong.cnpj && (
                          <div className="text-sm text-gray-500">{ong.cnpj}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getRegionalLabel(ong.regional)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getProgramasDisplay(ong)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ong.cidade || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ong.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/ongs/detalhes/${ong.id}`)}
                          className="text-green-600 hover:text-green-700"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(ong)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(ong)}
                          title="Excluir instituição"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {ong.status === 'ativa' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEvasao(ong)}
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Evasão */}
      <EvasaoModal
        isOpen={evasaoModal.isOpen}
        onClose={() => setEvasaoModal({ isOpen: false, ong: null })}
        onConfirm={handleConfirmEvasao}
        ongNome={evasaoModal.ong?.nome || ''}
      />
    </div>
  );
}