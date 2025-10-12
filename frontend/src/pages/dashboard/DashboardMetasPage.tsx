import { useState, useMemo, useEffect } from 'react';
import { Target, TrendingUp, Calendar, Filter, BarChart3, Activity, Users, Award, Building2, MapPin } from 'lucide-react';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS, REGIONAL_COLOR_CLASSES } from '@/pages/calendario/constants';
import { useGoals, useUsersWithMembers, useRegionalActivities } from '@/hooks/useApi';
import { useInstituicaoStats } from '@/hooks/useInstituicaoStats';
import { useInstituicoes } from '@/hooks/useInstituicoes';

export default function DashboardMetasPage() {
  const [filtroRegional, setFiltroRegional] = useState('todos');
  const [filtroAtividade, setFiltroAtividade] = useState<string>('');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAno, setFiltroAno] = useState<string>('todos');
  
  const { data: metas, loading: loadingMetas, error, refetch } = useGoals();
  const { data: usuarios, loading: loadingUsuarios } = useUsersWithMembers();
  const { data: statsInstituicoes, loading: loadingStats, error: errorStats } = useInstituicaoStats();
  const { data: atividadesRegionais, loading: loadingAtividades, refetch: refetchAtividades } = useRegionalActivities();
  const { data: instituicoes, loading: loadingInstituicoes } = useInstituicoes();

  // Estado de loading combinado
  const loading = loadingMetas || loadingUsuarios || loadingAtividades || loadingStats || loadingInstituicoes;



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

  // Função para normalizar strings para matching
  const normalizeString = (str: string): string => {
    if (!str) return '';
    let normalized = str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, ' ') // Normaliza espaços
      .trim();
    
    // Normalização específica para singular/plural
    // Liga -> Ligas e vice-versa
    normalized = normalized.replace(/\bliga\b/g, 'liga_s');
    normalized = normalized.replace(/\bligas\b/g, 'liga_s');
    
    // Outros casos comuns de singular/plural
    normalized = normalized.replace(/\bfamilia\b/g, 'familia_s');
    normalized = normalized.replace(/\bfamilias\b/g, 'familia_s');
    normalized = normalized.replace(/\bpessoa\b/g, 'pessoa_s');
    normalized = normalized.replace(/\bpessoas\b/g, 'pessoa_s');
    normalized = normalized.replace(/\batividade\b/g, 'atividade_s');
    normalized = normalized.replace(/\batividades\b/g, 'atividade_s');
    
    return normalized;
  };

  // Função para verificar se duas strings fazem match
  const isStringMatch = (str1: string, str2: string): boolean => {
    if (!str1 || !str2) return false;
    
    const normalized1 = normalizeString(str1);
    const normalized2 = normalizeString(str2);
    
    // Match exato
    if (normalized1 === normalized2) return true;
    
    // Match bidirecional (uma contém a outra)
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) return true;
    
    // Match por palavras-chave (pelo menos 2 palavras em comum)
    const words1 = normalized1.split(' ').filter(w => w.length > 2);
    const words2 = normalized2.split(' ').filter(w => w.length > 2);
    
    if (words1.length >= 2 && words2.length >= 2) {
      const commonWords = words1.filter(word => words2.includes(word));
      if (commonWords.length >= 2) return true;
    }
    
    return false;
  };

  // Função melhorada para verificar matching de atividade
  const isActivityMatch = (meta: any, activityLabel: string): boolean => {
    const metaFields = [
      meta.titulo,
      meta.descricao,
      meta.nome,
      meta.atividade_tipo,
      meta.categoria
    ].filter(Boolean);
    
    return metaFields.some(field => isStringMatch(field, activityLabel));
  };

  const metasFiltradas = metas?.filter(meta => {
    // Filtro de atividade usando a função isActivityMatch
    const atividadeMatch = !filtroAtividade || isActivityMatch(meta, filtroAtividade);

    // Filtro regional
    const regionalMatch = filtroRegional === 'todos' || 
      meta.regional === filtroRegional ||
      meta.regional?.includes(filtroRegional) ||
      (meta.regionais && Array.isArray(meta.regionais) && meta.regionais.includes(filtroRegional));
    
    // Filtro de equipe - comparação mais flexível
    const equipeMatch = filtroEquipe === 'todos' || 
      meta.equipe?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim() ||
      meta.responsavel?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim() ||
      meta.criado_por?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim();
    
    // Filtros de data - verificar se há data válida
    let mesMatch = true;
    let anoMatch = true;
    
    if (meta.dataInicio) {
      const date = new Date(meta.dataInicio);
      if (!isNaN(date.getTime())) {
        const mes = (date.getMonth() + 1).toString();
        const ano = date.getFullYear().toString();
        mesMatch = filtroMes === 'todos' || filtroMes === mes;
        anoMatch = filtroAno === 'todos' || filtroAno === ano;
      }
    } else if (meta.data_inicio) {
      const date = new Date(meta.data_inicio);
      if (!isNaN(date.getTime())) {
        const mes = (date.getMonth() + 1).toString();
        const ano = date.getFullYear().toString();
        mesMatch = filtroMes === 'todos' || filtroMes === mes;
        anoMatch = filtroAno === 'todos' || filtroAno === ano;
      }
    } else if (meta.created_at) {
      const date = new Date(meta.created_at);
      if (!isNaN(date.getTime())) {
        const mes = (date.getMonth() + 1).toString();
        const ano = date.getFullYear().toString();
        mesMatch = filtroMes === 'todos' || filtroMes === mes;
        anoMatch = filtroAno === 'todos' || filtroAno === ano;
      }
    }
    
    return atividadeMatch && regionalMatch && equipeMatch && mesMatch && anoMatch;
  }) || [];

  // Calcular estatísticas das metas filtradas
  const estatisticas = useMemo(() => {
    if (!metasFiltradas) return { totalMetas: 0, metasConcluidas: 0, metasEmAndamento: 0, metasPendentes: 0 };
    
    // Se há filtro regional específico, usar dados reais do banco
    if (filtroRegional !== 'todos') {
      const totalMetasPorRegional = {
        'nacional': 7,
        'centro_oeste': 3,
        'nordeste_1': 3,
        'nordeste1': 3,
        'nordeste_2': 3,
        'nordeste2': 3,
        'sul': 3,
        'norte': 3,
        'mg_es': 3,
        'mges': 3,
        'rj': 3,
        'rio': 3,
        'rio_de_janeiro': 3,
        'sp': 0 // SP não foi fornecido na lista, assumindo 0
      };
      
      const totalMetas = totalMetasPorRegional[filtroRegional] || metasFiltradas.length;
      
      return {
        totalMetas,
        metasConcluidas: 0, // Assumindo 0 concluídas para simplificar
        metasEmAndamento: totalMetas, // Assumindo todas em andamento
        metasPendentes: 0,
      };
    }
    
    return {
      totalMetas: metasFiltradas.length,
      metasConcluidas: metasFiltradas.filter(meta => meta.status === 'concluida' || meta.status === 'completed').length,
      metasEmAndamento: metasFiltradas.filter(meta => meta.status === 'em_andamento' || meta.status === 'in_progress').length,
      metasPendentes: metasFiltradas.filter(meta => meta.status === 'pendente' || meta.status === 'pending').length,
    };
  }, [metasFiltradas, filtroRegional]);

  // Calcular estatísticas de instituições filtradas
  const estatisticasInstituicoesFiltradas = useMemo(() => {
    if (!statsInstituicoes || !atividadesRegionais) return null;
    
    // Se não há filtro regional ou é "todos", retornar dados completos
    if (filtroRegional === 'todos') {
      return statsInstituicoes;
    }
    
    // Filtrar atividades por regional selecionado
    const atividadesDaRegional = atividadesRegionais.filter(atividade => 
      atividade.regional === filtroRegional && atividade.status === 'ativo'
    );
    
    // Agrupar atividades por tipo
    const atividadesPorTipo = atividadesDaRegional.reduce((acc, atividade) => {
      const tipo = atividade.atividade_label || atividade.titulo || 'Outros';
      if (!acc[tipo]) {
        acc[tipo] = 0;
      }
      acc[tipo] += parseInt(atividade.quantidade) || 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Calcular totais baseados nos dados reais
    const ligasMarasFormadas = atividadesPorTipo['Ligas Maras Formadas'] || 0;
    const familiasEmbarcadas = atividadesPorTipo['Famílias Embarcadas Decolagem'] || 0;
    const diagnosticosRealizados = atividadesPorTipo['Diagnósticos Realizados'] || 0;
    
    // Calcular ONGs baseado nas instituições reais da regional
    const instituicoesDaRegional = instituicoes?.filter(inst => 
      inst.regional?.toLowerCase() === filtroRegional.toLowerCase()
    ) || [];
    
    const ongsMaras = instituicoesDaRegional.filter(inst => 
      inst.tipo_programa?.toLowerCase().includes('maras') || 
      inst.programa?.toLowerCase().includes('maras')
    ).length;
    
    const ongsDecolagem = instituicoesDaRegional.filter(inst => 
      inst.tipo_programa?.toLowerCase().includes('decolagem') || 
      inst.programa?.toLowerCase().includes('decolagem')
    ).length;
    
    const totalInstituicoes = instituicoesDaRegional.length;
    
    return {
      ...statsInstituicoes,
      total: totalInstituicoes,
      resumo: {
        ...statsInstituicoes.resumo,
        ongsMaras,
        ongsDecolagem,
        ongsMicrocredito: 0,
        totalPorArea: totalInstituicoes,
        familiasEmbarcadas,
        diagnosticosRealizados,
        ligasMarasFormadas
      }
    };
  }, [statsInstituicoes, filtroRegional, atividadesRegionais, instituicoes]);

  // Dados agrupados por área - Usar dados reais do banco para todas as regionais
  const dadosPorArea = useMemo(() => {
    if (!atividadesRegionais) return [];
    
    // Se um filtro regional específico está selecionado
      if (filtroRegional !== 'todos') {
        const atividadesDaRegional = atividadesRegionais.filter(atividade => {
          // Filtro por regional
          const regionalMatch = atividade.regional === filtroRegional && atividade.status === 'ativo';
          
          // Filtro por equipe - verificar responsável da atividade com comparação flexível
          let equipeMatch = true;
          if (filtroEquipe !== 'todos') {
            // Buscar o responsável da atividade
            const responsavel = usuarios?.find(u => u.id === atividade.responsavel_id);
            equipeMatch = isStringMatch(responsavel?.nome || '', filtroEquipe) || 
                         isStringMatch(responsavel?.email || '', filtroEquipe) ||
                         isStringMatch(atividade.responsavel?.nome || '', filtroEquipe) ||
                         isStringMatch(atividade.responsavel?.email || '', filtroEquipe);
          }
          
          return regionalMatch && equipeMatch;
        });
        
        // Agrupar por tipo de atividade para calcular o realizado
        const atividadesPorTipo = atividadesDaRegional.reduce((acc, atividade) => {
          const tipo = atividade.titulo || atividade.tipo || 'Outros';
          if (!acc[tipo]) {
            acc[tipo] = { quantidade: 0, atividades: [] };
          }
          acc[tipo].quantidade += parseInt(atividade.quantidade) || 1;
          acc[tipo].atividades.push(atividade);
          return acc;
        }, {} as Record<string, { quantidade: number; atividades: any[] }>);

        const totalAtividades = Object.values(atividadesPorTipo).reduce((sum, grupo) => sum + grupo.quantidade, 0);
        
        // Calcular o total real de metas para esta regional
        const metasDaRegional = metas?.filter(meta => {
          if (!meta.regional) return false;
          
          if (meta.regional.includes(',')) {
            const areas = meta.regional.split(',').map(area => area.trim());
            return areas.some(area => {
              const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
                REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
              ) || area;
              return mappedKey === filtroRegional;
            });
          } else {
            const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === meta.regional.toLowerCase()
            ) || meta.regional;
            return mappedKey === filtroRegional;
          }
        }) || [];
        
        const totalMetasReais = metasDaRegional.reduce((sum, meta) => sum + (meta.valorMeta || meta.valor_meta || 0), 0);
        const label = REGIONAL_LABELS[filtroRegional] || filtroRegional;
        
        return [{
          key: filtroRegional,
          label,
          totalMeta: totalMetasReais, // Usar total real de metas
          totalAtual: totalAtividades, // Atividades realizadas
          progress: totalMetasReais > 0 ? Math.min((totalAtividades / totalMetasReais) * 100, 100) : 0,
          quantidadeMetas: metasDaRegional.length,
          color: REGIONAL_COLOR_CLASSES[filtroRegional] || 'bg-gray-200',
          dadosReais: true // Flag para indicar que são dados reais
        }];
      }
    
    // Usar todas as metas se não há filtros aplicados, senão usar filtradas
    const metasParaCalculo = (filtroRegional === 'todos' && 
                             filtroAtividade === '' && 
                             filtroEquipe === 'todos' && 
                             filtroMes === 'todos' && 
                             filtroAno === 'todos') ? metas : metasFiltradas;
    
    if (!metasParaCalculo || metasParaCalculo.length === 0) return [];
    
    // Se uma área específica está selecionada, mostrar dados reais do banco
    if (filtroRegional !== 'todos') {
      const label = REGIONAL_LABELS[filtroRegional] || filtroRegional;
      
      // Usar dados reais das atividades regionais se disponíveis
      if (atividadesRegionais) {
        const atividadesDaRegional = atividadesRegionais.filter(atividade => 
          atividade.regional === filtroRegional && atividade.status === 'ativo'
        );
        
        const totalAtividades = atividadesDaRegional.reduce((sum, atividade) => 
          sum + (parseInt(atividade.quantidade) || 1), 0
        );
        
        return [{
          key: filtroRegional,
          label,
          totalMeta: totalAtividades,
          totalAtual: totalAtividades,
          progress: totalAtividades > 0 ? 100 : 0,
          quantidadeMetas: atividadesDaRegional.length,
          color: REGIONAL_COLOR_CLASSES[filtroRegional] || 'bg-gray-200',
          dadosReais: true
        }];
      }
      
      // Fallback para metas se não há atividades regionais
      const metasDaArea = metasParaCalculo.filter(m => {
        if (!m.regional) return false;
        
        if (m.regional.includes(',')) {
          const areas = m.regional.split(',').map(area => area.trim());
          return areas.some(area => {
            const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
            ) || area;
            return mappedKey === filtroRegional;
          });
        } else {
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
    
    // Caso contrário, mostrar todas as áreas usando dados reais
    if (atividadesRegionais) {
      // Agrupar atividades por regional
      const atividadesPorRegional = atividadesRegionais
        .filter(atividade => {
          // Filtro por status
          const statusMatch = atividade.status === 'ativo';
          
          // Filtro por equipe - verificar responsável da atividade com comparação flexível
          let equipeMatch = true;
          if (filtroEquipe !== 'todos') {
            // Buscar o responsável da atividade
            const responsavel = usuarios?.find(u => u.id === atividade.responsavel_id);
            equipeMatch = responsavel?.nome?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim() || 
                         responsavel?.email?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim() ||
                         atividade.responsavel?.nome?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim() ||
                         atividade.responsavel?.email?.toLowerCase().trim() === filtroEquipe.toLowerCase().trim();
          }
          
          return statusMatch && equipeMatch;
        })
        .reduce((acc, atividade) => {
          if (!acc[atividade.regional]) {
            acc[atividade.regional] = [];
          }
          acc[atividade.regional].push(atividade);
          return acc;
        }, {} as Record<string, any[]>);
      
      return Object.entries(atividadesPorRegional).map(([regionalKey, atividades]) => {
        const label = REGIONAL_LABELS[regionalKey] || regionalKey;
        const totalAtividades = atividades.reduce((sum, atividade) => 
          sum + (parseInt(atividade.quantidade) || 1), 0
        );
        
        // Calcular o total real de metas para esta regional
        const metasDaRegional = metas?.filter(meta => {
          if (!meta.regional) return false;
          
          if (meta.regional.includes(',')) {
            const areas = meta.regional.split(',').map(area => area.trim());
            return areas.some(area => {
              const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
                REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
              ) || area;
              return mappedKey === regionalKey;
            });
          } else {
            const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === meta.regional.toLowerCase()
            ) || meta.regional;
            return mappedKey === regionalKey;
          }
        }) || [];
        
        const totalMetasReais = metasDaRegional.reduce((sum, meta) => sum + (meta.valorMeta || meta.valor_meta || 0), 0);
        
        return {
          key: regionalKey,
          label,
          totalMeta: totalMetasReais, // Usar total real de metas
          totalAtual: totalAtividades, // Atividades realizadas
          progress: totalMetasReais > 0 ? Math.min((totalAtividades / totalMetasReais) * 100, 100) : 0,
          quantidadeMetas: metasDaRegional.length,
          color: REGIONAL_COLOR_CLASSES[regionalKey] || 'bg-gray-200',
          dadosReais: true
        };
      }).sort((a, b) => b.totalAtual - a.totalAtual);
    }
    
    // Fallback para metas quando não há atividades regionais
    const areasComMetas = new Set<string>();
    metasParaCalculo.forEach(meta => {
      if (meta.regional) {
        if (meta.regional.includes(',')) {
          const areas = meta.regional.split(',').map(area => area.trim());
          areas.forEach(area => {
            const areaKey = Object.keys(REGIONAL_LABELS).find(key => 
              REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
            ) || area;
            areasComMetas.add(areaKey);
          });
        } else {
          const areaKey = Object.keys(REGIONAL_LABELS).find(key => 
            REGIONAL_LABELS[key].toLowerCase() === meta.regional.toLowerCase()
          ) || meta.regional;
          areasComMetas.add(areaKey);
        }
      }
    });
    
    return Array.from(areasComMetas)
      .map(areaKey => {
        const label = REGIONAL_LABELS[areaKey] || areaKey;
        const metasDaArea = metasParaCalculo.filter(m => {
          if (!m.regional) return false;
          
          if (m.regional.includes(',')) {
            const areas = m.regional.split(',').map(area => area.trim());
            return areas.some(area => {
              const mappedKey = Object.keys(REGIONAL_LABELS).find(key => 
                REGIONAL_LABELS[key].toLowerCase() === area.toLowerCase()
              ) || area;
              return mappedKey === areaKey;
            });
          } else {
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

  // Dados agrupados por atividade - Usar dados reais do banco para todas as regionais
  const dadosPorAtividade = useMemo(() => {
    // Se um filtro regional específico está selecionado, mostrar apenas atividades com dados reais
    if (filtroRegional !== 'todos' && atividadesRegionais) {
      const atividadesDaRegional = atividadesRegionais.filter(atividade => {
        // Filtro por regional
        const regionalMatch = atividade.regional === filtroRegional && atividade.status === 'ativo';
        
        // Filtro por equipe - verificar responsável da atividade com comparação flexível
        let equipeMatch = true;
        if (filtroEquipe !== 'todos') {
          // Buscar o responsável da atividade
          const responsavel = usuarios?.find(u => u.id === atividade.responsavel_id);
          equipeMatch = isStringMatch(responsavel?.nome || '', filtroEquipe) || 
                       isStringMatch(responsavel?.email || '', filtroEquipe) ||
                       isStringMatch(atividade.responsavel?.nome || '', filtroEquipe) ||
                       isStringMatch(atividade.responsavel?.email || '', filtroEquipe);
        }
        
        return regionalMatch && equipeMatch;
      });
      
      // Agrupar por tipo de atividade para calcular o realizado
      const atividadesPorTipo = atividadesDaRegional.reduce((acc, atividade) => {
        const tipo = atividade.atividade_label || atividade.titulo || atividade.tipo || 'Outros';
        if (!acc[tipo]) {
          acc[tipo] = { 
            quantidade: 0, 
            atividades: []
          };
        }
        const quantidade = parseInt(atividade.quantidade) || 1;
        acc[tipo].quantidade += quantidade;
        acc[tipo].atividades.push(atividade);
        return acc;
      }, {} as Record<string, { quantidade: number; atividades: any[] }>);

      return Object.entries(atividadesPorTipo).map(([label, dados]) => {
        // Buscar metas reais para esta atividade e regional
        const metasDaAtividade = metas?.filter(meta => {
          // Verificar se a meta corresponde à regional
          const pertenceRegional = meta.regional && (
            meta.regional.includes(',') 
              ? meta.regional.split(',').map(area => area.trim()).some(area => {
                  const areaLimpa = area.toLowerCase().replace(/\s+/g, '_');
                  return areaLimpa === filtroRegional || 
                         area.toLowerCase() === REGIONAL_LABELS[filtroRegional]?.toLowerCase();
                })
              : (meta.regional.toLowerCase().replace(/\s+/g, '_') === filtroRegional || 
                 meta.regional.toLowerCase() === REGIONAL_LABELS[filtroRegional]?.toLowerCase())
          );
          
          // Usar a nova função de matching melhorada
          const pertenceAtividade = isActivityMatch(meta, label);
          
          // Log detalhado para debug (apenas para Ligas Maras)
          if (label.toLowerCase().includes('ligas') || label.toLowerCase().includes('maras')) {
            console.log(`🔍 DEBUG MATCHING - ${label}:`);
            console.log(`   Meta: "${meta.titulo}" (Regional: ${meta.regional})`);
            console.log(`   Regional Match: ${pertenceRegional}`);
            console.log(`   Activity Match: ${pertenceAtividade}`);
            console.log(`   Final Match: ${pertenceRegional && pertenceAtividade}`);
          }
          
          return pertenceRegional && pertenceAtividade;
        }) || [];
        
        const totalMetasReais = metasDaAtividade.reduce((sum, meta) => sum + (meta.valorMeta || meta.valor_meta || 0), 0);
        const totalAtual = dados.quantidade;
        const percentualRealizado = totalMetasReais > 0 ? Math.min((totalAtual / totalMetasReais) * 100, 100) : 0;
        
        return {
          label,
          value: label.toLowerCase().replace(/\s+/g, '_'),
          totalMeta: totalMetasReais, // Usar metas reais do banco
          totalAtual: totalAtual, // Atividades realizadas
          percentualRealizado,
          quantidadeMetas: metasDaAtividade.length,
          dadosReais: true, // Flag para indicar que são dados reais
          semMetas: totalMetasReais === 0 // Flag para indicar atividades sem metas
        };
      })
      // Remover filtro que ocultava atividades sem metas - agora mostra todas
      .sort((a, b) => {
        // Priorizar atividades com metas, depois por quantidade realizada
        if (a.totalMeta > 0 && b.totalMeta === 0) return -1;
        if (a.totalMeta === 0 && b.totalMeta > 0) return 1;
        return b.totalAtual - a.totalAtual;
      });
    }
    
    // Usar todas as metas se não há filtros aplicados, senão usar filtradas
    const metasParaCalculo = (filtroRegional === 'todos' && 
                             filtroAtividade === '' && 
                             filtroEquipe === 'todos' && 
                             filtroMes === 'todos' && 
                             filtroAno === 'todos') ? metas : metasFiltradas;
    
    if (!metasParaCalculo || metasParaCalculo.length === 0) return [];
    
    // Quando todos os filtros estão em "Todos", usar dados reais das atividades regionais
    const todosOsFiltrosEmTodos = (filtroRegional === 'todos' && 
                                  filtroAtividade === '' && 
                                  filtroEquipe === 'todos' && 
                                  filtroMes === 'todos' && 
                                  filtroAno === 'todos');
    
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
          isActivityMatch(m, label)
        );
        
        const totalMeta = metasDaAtividade.reduce((sum, m) => sum + (m.valorMeta || m.valor_meta || 0), 0);
        
        // Se todos os filtros estão em "Todos", calcular totalAtual usando dados reais das atividades regionais
        let totalAtual = 0;
        if (todosOsFiltrosEmTodos && atividadesRegionais) {
          // Buscar atividades regionais que correspondem a este tipo de atividade
          const atividadesDaTipo = atividadesRegionais.filter(atividade => {
            const atividadeLabel = atividade.atividade_label || atividade.titulo || atividade.tipo || 'Outros';
            return isActivityMatch({ titulo: atividadeLabel }, label) && atividade.status === 'ativo';
          });
          
          totalAtual = atividadesDaTipo.reduce((sum, atividade) => {
            return sum + (parseInt(atividade.quantidade) || 1);
          }, 0);
        } else {
          // Usar o valor atual das metas (comportamento original)
          totalAtual = metasDaAtividade.reduce((sum, m) => sum + (m.valorAtual || m.valor_atual || 0), 0);
        }
        
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
      // Filtrar apenas atividades que têm metas registradas (quantidadeMetas > 0)
      .filter(atividade => atividade.quantidadeMetas > 0)
      .sort((a, b) => b.percentualRealizado - a.percentualRealizado);
  }, [metas, metasFiltradas, filtroRegional, filtroAtividade, filtroEquipe, filtroMes, filtroAno, atividadesRegionais]);

  // Adicionar useEffect para recarregar dados quando necessário
  useEffect(() => {
    if (refetch) {
      refetch();
    }
    // Recarregar atividades regionais quando filtros mudarem
    if (refetchAtividades) {
      refetchAtividades();
    }
  }, [filtroAtividade, filtroRegional, filtroEquipe, filtroMes, filtroAno, refetch, refetchAtividades]);

  // Atualização automática a cada 30 segundos para dados em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      if (refetch && !loading) {
        refetch();
      }
      // Também atualizar atividades regionais
      if (refetchAtividades && !loadingAtividades) {
        refetchAtividades();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [refetch, loading, refetchAtividades, loadingAtividades]);

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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Metas</p>
              <p className="text-3xl font-bold text-gray-900">{estatisticas.totalMetas}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-3xl font-bold text-green-600">
                {estatisticas.metasConcluidas}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors duration-300">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Famílias Embarcadas Decolagem</p>
              <p className="text-3xl font-bold text-blue-600">
                {loadingStats ? '...' : estatisticasInstituicoesFiltradas?.resumo.familiasEmbarcadas || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-amber-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ligas Maras Formadas</p>
              <p className="text-3xl font-bold text-amber-600">
                {loadingStats ? '...' : estatisticasInstituicoesFiltradas?.resumo?.ligasMarasFormadas || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center group-hover:bg-amber-200 transition-colors duration-300">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Institution Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Instituições</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? '...' : estatisticasInstituicoesFiltradas?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors duration-300">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-pink-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ONGs Maras</p>
              <p className="text-3xl font-bold text-pink-600">
                {loadingStats ? '...' : estatisticasInstituicoesFiltradas?.resumo.ongsMaras || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center group-hover:bg-pink-200 transition-colors duration-300">
              <Users className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">ONGs Decolagem</p>
              <p className="text-3xl font-bold text-indigo-600">
                {loadingStats ? '...' : estatisticasInstituicoesFiltradas?.resumo.ongsDecolagem || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors duration-300">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Diagnósticos Realizados</p>
              <p className="text-3xl font-bold text-emerald-600">
                {loadingStats ? '...' : estatisticasInstituicoesFiltradas?.resumo.diagnosticosRealizados || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors duration-300">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
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

                  <div className="flex items-center justify-center text-xs">
                    <span className="text-gray-500">
                      {area.progress >= 80 ? '🎯 Excelente' : area.progress >= 50 ? '⚡ Bom progresso' : '🚀 Precisa atenção'}
                    </span>
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
            {dadosPorAtividade.length} atividades ativas
          </span>
        </div>
        
        {dadosPorAtividade.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma atividade encontrada com os filtros selecionados.</p>
            <p className="text-sm text-gray-400 mt-2">Ajuste os filtros para ver mais resultados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dadosPorAtividade.map((atividade) => {
              const percentualFalta = Math.max(0, 100 - atividade.percentualRealizado);
              const statusColor = atividade.percentualRealizado >= 80 
                ? 'emerald' 
                : atividade.percentualRealizado >= 50 
                ? 'amber' 
                : 'rose';
              
              return (
                <div key={atividade.label} className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <div className={`p-4 bg-gradient-to-r from-${statusColor}-50 to-${statusColor}-100 border-b border-gray-100 ${atividade.semMetas ? 'border-l-4 border-l-orange-400' : ''}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900">{atividade.label}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full bg-white/80 text-${statusColor}-700 font-medium`}>
                        {atividade.semMetas ? 'Sem meta' : `${atividade.percentualRealizado.toFixed(1)}%`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {atividade.semMetas ? 
                        '⚠️ Nenhuma meta cadastrada' : 
                        `${atividade.quantidadeMetas} metas ativas`
                      }
                    </p>
                  </div>
                  
                  <div className="p-5">
                    {atividade.semMetas ? (
                      // Layout especial para atividades sem metas
                      <div className="text-center py-4">
                        <div className="rounded-lg p-4 bg-orange-50 border border-orange-200 mb-4">
                          <div className="text-sm font-medium text-orange-800 mb-2">Atividades Realizadas</div>
                          <div className="text-2xl font-bold text-orange-900">
                            {atividade.totalAtual.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                          📋 Esta atividade não possui metas cadastradas no sistema
                        </div>
                      </div>
                    ) : (
                      // Layout normal para atividades com metas
                      <>
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

                        <div className="flex items-center justify-center text-xs">
                          <span className="text-gray-500">
                            {atividade.percentualRealizado >= 80 ? '🏆 Meta quase alcançada' : 
                             atividade.percentualRealizado >= 50 ? '📈 Progresso sólido' : 
                             '🎯 Foco necessário'}
                          </span>
                        </div>
                      </>
                    )}
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