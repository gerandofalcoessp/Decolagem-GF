import { useState, useMemo, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Filter, BarChart3, Activity, Users, Award, Building2, MapPin } from 'lucide-react';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS, REGIONAL_COLOR_CLASSES } from '@/pages/calendario/constants';
import { useGoals, useUsersWithMembers } from '@/hooks/useApi';
import { useInstituicaoStats } from '@/hooks/useInstituicaoStats';

export default function DashboardMetasPage() {
  const [filtroRegional, setFiltroRegional] = useState('todos');
  const [filtroAtividade, setFiltroAtividade] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  
  const { data: metas, loading, error, refetch } = useGoals();
  const { data: usuarios, loading: loadingUsuarios } = useUsersWithMembers();
  const { data: statsInstituicoes, loading: loadingStats, error: errorStats } = useInstituicaoStats();



  // Calcular estatísticas das metas
  const estatisticas = useMemo(() => {
    if (!metas) return { totalMetas: 0, metasConcluidas: 0, metasEmAndamento: 0, metasPendentes: 0 };
    
    return {
      totalMetas: metas.length,
      metasConcluidas: metas.filter(meta => meta.status === 'concluida' || meta.status === 'completed').length,
      metasEmAndamento: metas.filter(meta => meta.status === 'em_andamento' || meta.status === 'in_progress').length,
      metasPendentes: metas.filter(meta => meta.status === 'pendente' || meta.status === 'pending').length,
    };
  }, [metas]);

  // Opções dinâmicas de regionais (todas as áreas), usando labels centralizados
  const regionalOptions = Object.entries(REGIONAL_LABELS).filter(([key]) => key !== 'todas');

  // Opções dinâmicas de equipes, derivadas de dados existentes e usuários cadastrados
  const equipeOptions = useMemo(() => {
    const equipesFromMetas = metas?.map(m => m.equipe).filter(Boolean) || [];
    const equipesFromUsuarios = usuarios?.map(u => u.nome).filter(Boolean) || [];
    
    return Array.from(new Set([
      ...equipesFromMetas,
      ...equipesFromUsuarios,
      'Equipe SP',
      'Equipe RJ', 
      'Equipe Nacional',
    ])).sort();
  }, [metas, usuarios]);

  // Anos disponíveis: união dos anos em metas + faixa ampliada ao redor do ano atual
  const yearsFromMetas = metas?.flatMap(m => {
    const yi = m.dataInicio ? new Date(m.dataInicio).getFullYear() : null;
    const yf = m.dataFim ? new Date(m.dataFim).getFullYear() : null;
    return [yi, yf].filter(Boolean) as number[];
  }) || [];
  
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(...(yearsFromMetas.length ? yearsFromMetas : [currentYear]));
  const maxYear = Math.max(...(yearsFromMetas.length ? yearsFromMetas : [currentYear]));
  const expandedYears = Array.from({ length: (maxYear + 2) - (minYear - 2) + 1 }, (_, i) => (minYear - 2 + i).toString());
  const availableYears = Array.from(new Set([...
    yearsFromMetas.map(String),
    ...expandedYears,
  ])).sort();

  const metasFiltradas = metas?.filter(meta => {
    // matching de atividade por label selecionado ou busca vazia
    const atividadeMatch = !filtroAtividade ||
      meta.titulo?.toLowerCase().includes(filtroAtividade.toLowerCase()) ||
      meta.descricao?.toLowerCase().includes(filtroAtividade.toLowerCase()) ||
      meta.nome?.toLowerCase().includes(filtroAtividade.toLowerCase());

    const regionalMatch = filtroRegional === 'todos' || 
      meta.regional === filtroRegional ||
      meta.regional?.includes(filtroRegional) ||
      (meta.regionais && Array.isArray(meta.regionais) && meta.regionais.includes(filtroRegional));
    const equipeMatch = filtroEquipe === 'todos' || 
      meta.equipe === filtroEquipe ||
      meta.responsavel === filtroEquipe ||
      meta.criado_por === filtroEquipe;
    
    // Se não há dataInicio, considerar apenas os filtros básicos
    if (!meta.dataInicio) return atividadeMatch && regionalMatch && equipeMatch;
    
    const date = new Date(meta.dataInicio);
    const mes = (date.getMonth() + 1).toString();
    const ano = date.getFullYear().toString();
    const mesMatch = filtroMes === 'todos' || filtroMes === mes;
    const anoMatch = filtroAno === 'todos' || filtroAno === ano;
    
    return atividadeMatch && regionalMatch && equipeMatch && mesMatch && anoMatch;
  }) || [];

  // Dados agrupados por área - Mostrar apenas áreas com metas cadastradas
  const dadosPorArea = useMemo(() => {
    // Usar todas as metas se não há filtros aplicados, senão usar filtradas
    const metasParaCalculo = (filtroRegional === 'todos' && 
                             filtroAtividade === '' && 
                             filtroEquipe === 'todos' && 
                             filtroMes === 'todos' && 
                             filtroAno === 'todos') ? metas : metasFiltradas;
    
    if (!metasParaCalculo || metasParaCalculo.length === 0) return [];
    
    // Se uma área específica está selecionada, mostrar apenas essa área
    if (filtroRegional !== 'todos') {
      const label = REGIONAL_LABELS[filtroRegional] || filtroRegional;
      // Filtrar metas que pertencem a esta área específica
      const metasDaArea = metasParaCalculo.filter(m => {
        if (!m.regional) return false;
        
        if (m.regional.includes(',')) {
          // Meta com múltiplas áreas - verificar se esta área está incluída
          const areas = m.regional.split(',').map(area => area.trim());
          return areas.some(area => {
            const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
            ) || area;
            return mappedKey === filtroRegional;
          });
        } else {
          // Meta com área única
          const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
            REGIONAL_LABELS[key].toLowerCase() === m.regional.toLowerCase()
          ) || m.regional;
          return mappedKey === filtroRegional;
        }
      });
      
      const totalMeta = metasDaArea.reduce((sum, m) => sum + (m.valorMeta || m.valor_meta || 0), 0);
      const totalAtual = metasDaArea.reduce((sum, m) => sum + (m.valorAtual || m.valor_atual || 0), 0);
      const progress = totalMeta > 0 ? Math.min((totalAtual / totalMeta) * 100, 100) : 0;
      const quantidadeMetas = metasDaArea.length;
      
      return [{
        key: filtroRegional,
        label,
        totalMeta,
        totalAtual,
        progress,
        quantidadeMetas,
        color: REGIONAL_COLOR_CLASSES[filtroRegional] || 'bg-gray-200'
      }];
    }
    
    // Caso contrário, mostrar todas as áreas (quando filtroRegional === 'todos')
    // Primeiro, identificar quais áreas realmente têm metas
    const areasComMetas = new Set<string>();
    metasParaCalculo.forEach(meta => {
      if (meta.regional) {
        // Se o campo regional contém múltiplas áreas separadas por vírgula, processar cada uma
        if (meta.regional.includes(',')) {
          const areas = meta.regional.split(',').map(area => area.trim());
          areas.forEach(area => {
            // Mapear o nome da área para a chave correta
            const areaKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
            ) || area;
            areasComMetas.add(areaKey);
          });
        } else {
          // Área única
          const areaKey = Object.keys(REGIONAL_LABELS).find(key => 
            REGIONAL_LABELS[key].toLowerCase() === meta.regional.toLowerCase()
          ) || meta.regional;
          areasComMetas.add(areaKey);
        }
      }
    });
    
    // Depois, criar dados apenas para as áreas que têm metas
    return Array.from(areasComMetas)
      .map(areaKey => {
        const label = REGIONAL_LABELS[areaKey] || areaKey;
        // Filtrar metas que pertencem a esta área específica
        const metasDaArea = metasParaCalculo.filter(m => {
          if (!m.regional) return false;
          
          if (m.regional.includes(',')) {
            // Meta com múltiplas áreas - verificar se esta área está incluída
            const areas = m.regional.split(',').map(area => area.trim());
            return areas.some(area => {
              const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
                REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
              ) || area;
              return mappedKey === areaKey;
            });
          } else {
            // Meta com área única
            const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === m.regional.toLowerCase()
            ) || m.regional;
            return mappedKey === areaKey;
          }
        });
        const totalMeta = metasDaArea.reduce((sum, m) => sum + (m.valorMeta || m.valor_meta || 0), 0);
        const totalAtual = metasDaArea.reduce((sum, m) => sum + (m.valorAtual || m.valor_atual || 0), 0);
        const progress = totalMeta > 0 ? Math.min((totalAtual / totalMeta) * 100, 100) : 0;
        const quantidadeMetas = metasDaArea.length;
        
        return {
          key: areaKey,
          label,
          totalMeta,
          totalAtual,
          progress,
          quantidadeMetas,
          color: REGIONAL_COLOR_CLASSES[areaKey] || 'bg-gray-200'
        };
      })
      .sort((a, b) => b.progress - a.progress);
  }, [metas, metasFiltradas, filtroRegional, filtroAtividade, filtroEquipe, filtroMes, filtroAno]);

  // Dados agrupados por atividade - Sempre mostrar dados, mesmo sem filtros
  const dadosPorAtividade = useMemo(() => {
    // Usar todas as metas se não há filtros aplicados, senão usar filtradas
    const metasParaCalculo = (filtroRegional === 'todos' && 
                             filtroAtividade === '' && 
                             filtroEquipe === 'todos' && 
                             filtroMes === 'todos' && 
                             filtroAno === 'todos') ? metas : metasFiltradas;
    
    if (!metasParaCalculo || metasParaCalculo.length === 0) return [];
    
    // Criar uma lista única de atividades (sem duplicatas de label)
    const atividadesUnicas = ATIVIDADE_OPTIONS
      .filter(({ label }) => label.toLowerCase() !== 'outra')
      .reduce((acc, current) => {
        // Evitar duplicatas baseadas no label
        if (!acc.find(item => item.label === current.label)) {
          acc.push(current);
        }
        return acc;
      }, [] as typeof ATIVIDADE_OPTIONS);
    
    return atividadesUnicas.map(({ label, value }) => {
        const metasDaAtividade = metasParaCalculo.filter(m => 
          m.titulo?.toLowerCase().includes(label.toLowerCase()) ||
          m.descricao?.toLowerCase().includes(label.toLowerCase()) ||
          m.nome?.toLowerCase().includes(label.toLowerCase())
        );
        
        const totalMeta = metasDaAtividade.reduce((sum, m) => sum + (m.valorMeta || m.valor_meta || 0), 0);
        const totalAtual = metasDaAtividade.reduce((sum, m) => sum + (m.valorAtual || m.valor_atual || 0), 0);
        const percentualRealizado = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;
        const quantidadeMetas = metasDaAtividade.length;
        
        return {
          label,
          value,
          totalMeta,
          totalAtual,
          percentualRealizado,
          quantidadeMetas
        };
      })
      // Mostrar todas as atividades, mesmo com 0 metas (para manter consistência visual)
      .sort((a, b) => b.percentualRealizado - a.percentualRealizado);
  }, [metas, metasFiltradas, filtroRegional, filtroAtividade, filtroEquipe, filtroMes, filtroAno]);

  // Adicionar useEffect para recarregar dados quando necessário
  useEffect(() => {
    if (refetch) {
      refetch();
    }
  }, [filtroAtividade, filtroRegional, filtroEquipe, filtroMes, filtroAno, refetch]);

  // Atualização automática a cada 30 segundos para dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      if (refetch && !loading) {
        refetch();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refetch, loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando metas...</p>
        </div>


      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Target className="w-12 h-12 mx-auto" />
          </div>
          <p className="text-gray-600">Erro ao carregar metas: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard Metas
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Acompanhe o progresso das metas estabelecidas
          </p>
        </div>
      </div>

      {/* Dashboard Tabs */}
      {/* Navegação por abas removida – utilize o menu lateral */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Metas</p>
              <p className="text-3xl font-bold text-gray-900">{estatisticas.totalMetas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-3xl font-bold text-green-600">
                {estatisticas.metasConcluidas}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-600">
                {estatisticas.metasEmAndamento}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-amber-600">
                {estatisticas.metasPendentes}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Institution Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Instituições</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? '...' : statsInstituicoes?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ONGs Maras</p>
              <p className="text-3xl font-bold text-pink-600">
                {loadingStats ? '...' : statsInstituicoes?.resumo.ongsMaras || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ONGs Decolagem</p>
              <p className="text-3xl font-bold text-indigo-600">
                {loadingStats ? '...' : statsInstituicoes?.resumo.ongsDecolagem || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Áreas Ativas</p>
              <p className="text-3xl font-bold text-emerald-600">
                {loadingStats ? '...' : statsInstituicoes?.resumo.totalPorArea || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Atividade */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Atividade</label>
            <select
              value={filtroAtividade}
              onChange={(e) => setFiltroAtividade(e.target.value)}
              className="input-sm text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas</option>
              {ATIVIDADE_OPTIONS.filter(opt => opt.label.toLowerCase() !== 'outra').map((opt) => (
                <option key={opt.label} value={opt.label}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Área */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Área</label>
            <select
              value={filtroRegional}
              onChange={(e) => setFiltroRegional(e.target.value)}
              className="input-sm text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos</option>
              {regionalOptions.map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Equipe */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Equipe</label>
            <select
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
              className="input-sm text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos</option>
              {equipeOptions.map((eq) => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>

          {/* Mês */}
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Mês</label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="input-sm text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">Ano</label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              className="input-sm text-sm border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="todos">Todos</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>


      {/* Detalhamento por Área - Modernizado */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Detalhamento por Área</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {dadosPorArea.filter(area => area.quantidadeMetas > 0).length} áreas ativas
          </span>
        </div>
        
        {dadosPorArea.filter(area => area.quantidadeMetas > 0).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma meta encontrada para as áreas com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mt-2">Ajuste os filtros para ver mais resultados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dadosPorArea
              .filter(area => area.quantidadeMetas > 0)
              .map((area) => (
              <div key={area.key} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className={`p-4 ${area.color} bg-opacity-10 border-b border-gray-100`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{area.label}</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-white/80 text-gray-700 font-medium">
                        {area.progress.toFixed(1)}%
                      </span>
                      <Users className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{area.quantidadeMetas} metas ativas</p>
                </div>
                
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 mb-1">Realizado</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {area.totalAtual.toLocaleString('pt-BR')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 mb-1">Meta</div>
                      <div className="text-xl font-bold text-indigo-600">
                        {area.totalMeta.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-3 rounded-full transition-all duration-700 ease-out"
                      style={{ 
                        width: `${area.progress}%`, 
                        background: area.progress >= 80 
                          ? 'linear-gradient(90deg, #10b981, #059669)' 
                          : area.progress >= 50 
                          ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                          : 'linear-gradient(90deg, #ef4444, #dc2626)'
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {area.progress >= 80 ? '🎯 Excelente' : area.progress >= 50 ? '⚡ Bom progresso' : '🚀 Precisa atenção'}
                    </span>
                    <button className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                      Ver detalhes →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Detalhamento por Atividade - Modernizado */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-emerald-600" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Detalhamento por Atividade</h2>
          </div>
          <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            {dadosPorAtividade.filter(atividade => filtroRegional !== 'todos' || atividade.quantidadeMetas > 0).length} atividades ativas
          </span>
        </div>
        
        {dadosPorAtividade.filter(atividade => filtroRegional !== 'todos' || atividade.quantidadeMetas > 0).length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma meta encontrada para atividades com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mt-2">Ajuste os filtros para ver mais resultados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dadosPorAtividade
              .filter(atividade => filtroRegional !== 'todos' || atividade.quantidadeMetas > 0)
              .map((atividade) => {
              const percentualFalta = Math.max(0, 100 - atividade.percentualRealizado);
              const statusColor = atividade.percentualRealizado >= 80 
                ? 'emerald' 
                : atividade.percentualRealizado >= 50 
                ? 'amber' 
                : 'rose';
              
              return (
                <div key={atividade.label} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`p-4 bg-gradient-to-r from-${statusColor}-50 to-${statusColor}-100 border-b border-gray-100`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">{atividade.label}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full bg-white/80 text-${statusColor}-700 font-medium`}>
                        {atividade.percentualRealizado.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{atividade.quantidadeMetas} metas ativas</p>
                  </div>
                  
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-100 text-center">
                        <div className="text-xs font-medium text-emerald-700 mb-1">Realizado</div>
                        <div className="text-sm font-bold text-emerald-800">
                          {atividade.percentualRealizado.toFixed(1)}%
                        </div>
                      </div>
                      <div className="rounded-lg p-3 bg-indigo-50 border border-indigo-100 text-center">
                        <div className="text-xs font-medium text-indigo-700 mb-1">Meta</div>
                        <div className="text-sm font-bold text-indigo-800">100%</div>
                      </div>
                      <div className="rounded-lg p-3 bg-rose-50 border border-rose-100 text-center">
                        <div className="text-xs font-medium text-rose-700 mb-1">Falta</div>
                        <div className="text-sm font-bold text-rose-800">
                          {percentualFalta.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Valores absolutos</span>
                        <span>{atividade.totalAtual.toLocaleString('pt-BR')} / {atividade.totalMeta.toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-700 ease-out"
                          style={{ 
                            width: `${atividade.percentualRealizado}%`, 
                            background: atividade.percentualRealizado >= 80 
                              ? 'linear-gradient(90deg, #10b981, #059669)' 
                              : atividade.percentualRealizado >= 50 
                              ? 'linear-gradient(90deg, #f59e0b, #d97706)' 
                              : 'linear-gradient(90deg, #ef4444, #dc2626)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {atividade.percentualRealizado >= 80 ? '🏆 Meta quase alcançada' : 
                         atividade.percentualRealizado >= 50 ? '📈 Progresso sólido' : 
                         '🎯 Foco necessário'}
                      </span>
                      <button className="text-emerald-600 hover:text-emerald-800 font-medium transition-colors">
                        Detalhes →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}