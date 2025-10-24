import { useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  CreditCard, 
  Target,
  Building2,
  Layers,
  Percent,
  Home,
  User,
  Smile,
  AlertTriangle,
  Rocket,
  UserCheck,
  Crown,
  Activity
} from 'lucide-react';

import { useAuth } from '@/store/authStore';
import { useActivities, useGoals, useUsers, useMicrocredito, useAsMaras, useDecolagem, useRegionalActivities } from '@/hooks/useApi';
import { useInstituicaoStats } from '@/hooks/useInstituicaoStats';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';


import type { Atividade, Meta, User as UserType, Participante, Microcredito } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Função utilitária para calcular percentual
const calcPercent = (total: number, meta: number) => {
  if (!meta || meta <= 0) return 0;
  return Math.min(100, Math.round((total / meta) * 100));
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: activities, loading: activitiesLoading } = useActivities();
  const { data: goals, loading: goalsLoading, refetch: refetchGoals } = useGoals();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: microcreditoData, loading: microcreditoLoading } = useMicrocredito();
  const { data: asMarasData, loading: asMarasLoading } = useAsMaras();
  const { data: decolagemData, loading: decolagemLoading } = useDecolagem();
  const { data: regionalActivities, loading: regionalActivitiesLoading, refetch: refetchRegionalActivities } = useRegionalActivities();
  const { data: instituicaoStats, loading: instituicaoStatsLoading } = useInstituicaoStats();

  // Subscription em tempo real removida - usando versão com logs abaixo

  // Subscription em tempo real para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[DashboardPage] ⚠️ Supabase não configurado, subscriptions desabilitadas');
      return;
    }

    console.log('[DashboardPage] 🔗 Configurando subscriptions em tempo real...');

    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, (payload) => {
        console.log('[DashboardPage] 🔔 Mudança detectada na tabela goals:', {
          eventType: payload.eventType,
          timestamp: new Date().toISOString(),
          record: payload.new || payload.old
        });
        refetchGoals();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'regional_activities' }, (payload) => {
        console.log('[DashboardPage] 🔔 Mudança detectada na tabela regional_activities:', {
          eventType: payload.eventType,
          timestamp: new Date().toISOString(),
          record: payload.new || payload.old
        });
        refetchRegionalActivities();
      })
      .subscribe((status) => {
        console.log('[DashboardPage] 📡 Status da subscription dashboard_changes:', status);
      });
    
    return () => {
      console.log('[DashboardPage] 🔌 Removendo subscription dashboard_changes...');
      supabase.removeChannel(channel);
    };
  }, [refetchGoals, refetchRegionalActivities]);

  // Garantir que os dados são arrays válidos - MEMOIZADO para evitar recálculos
  //Fix: API retorna { data: [...] }, então precisamos extrair o array corretamente
  const activitiesArray = useMemo(() => {
    const result = Array.isArray(activities) 
      ? activities as Atividade[] 
      : Array.isArray((activities as any)?.data) 
        ? (activities as any).data as Atividade[]
        : [];
    
    console.log('[DashboardPage] 📊 Activities processadas:', {
      total: result.length,
      timestamp: new Date().toISOString(),
      rawType: typeof activities,
      isArray: Array.isArray(activities),
      hasDataProp: activities && typeof activities === 'object' && 'data' in activities,
      sample: result.length > 0 ? result[0] : null
    });
    
    return result;
  }, [activities]);

  const goalsArray = useMemo(() => {
    const result = Array.isArray(goals) ? goals as Meta[] : [];
    
    console.log('[DashboardPage] 🎯 Goals processadas:', {
      total: result.length,
      timestamp: new Date().toISOString(),
      rawType: typeof goals,
      isArray: Array.isArray(goals),
      sample: result.length > 0 ? result[0] : null
    });
    
    return result;
  }, [goals]);

  const membersArray = useMemo(() => {
    // users agora retorna dados diretamente da tabela usuarios
    const result = Array.isArray(users) ? users as UserType[] : [];
    
    console.log('[DashboardPage] 👥 Users processados:', {
      total: result.length,
      timestamp: new Date().toISOString(),
      rawType: typeof users,
      isArray: Array.isArray(users),
      sample: result.length > 0 ? result[0] : null
    });
    
    return result;
  }, [users]);

  const microcreditoArray = useMemo(() => {
    const result = Array.isArray(microcreditoData) ? microcreditoData as Microcredito[] : [];
    
    console.log('[DashboardPage] 💰 Microcredito processado:', {
      total: result.length,
      timestamp: new Date().toISOString(),
      rawType: typeof microcreditoData,
      isArray: Array.isArray(microcreditoData),
      sample: result.length > 0 ? result[0] : null
    });
    
    return result;
  }, [microcreditoData]);

  const asMarasArray = useMemo(() => {
    const result = Array.isArray(asMarasData) ? asMarasData as Participante[] : [];
    
    console.log('[DashboardPage] 🌟 As Maras processado:', {
      total: result.length,
      timestamp: new Date().toISOString(),
      rawType: typeof asMarasData,
      isArray: Array.isArray(asMarasData),
      sample: result.length > 0 ? result[0] : null
    });
    
    return result;
  }, [asMarasData]);

  const decolagemArray = useMemo(() => {
    const result = Array.isArray(decolagemData) ? decolagemData as Participante[] : [];
    
    console.log('[DashboardPage] 🚀 Decolagem processado:', {
      total: result.length,
      timestamp: new Date().toISOString(),
      rawType: typeof decolagemData,
      isArray: Array.isArray(decolagemData),
      sample: result.length > 0 ? result[0] : null
    });
    
    return result;
  }, [decolagemData]);


  // Helpers para matching flexível e somatórios - MEMOIZADOS para performance
  const normalize = useCallback((s?: string) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim(), []);
  
  const canonicalizeTokens = useCallback((s?: string) => {
    const na = normalize(s).replace(/[^a-z0-9]+/g, ' ');
    const rawTokens = na.split(/\s+/).filter(Boolean);
    return rawTokens.map(t => {
      let tok = t;
      // singularizar básico
      if (tok.endsWith('s')) tok = tok.slice(0, -1);
      // mapeamentos de sinônimos comuns
      const map: Record<string, string> = {
        ongs: 'ong', ong: 'ong',
        ligas: 'liga', liga: 'liga',
        diagnosticos: 'diagnostico', diagnostico: 'diagnostico',
        familias: 'familia', familia: 'familia',
        retençao: 'retencao', retencao: 'retencao',
        nps: 'nps',
        maras: 'maras', mara: 'maras',
        decolagem: 'decolagem',
        nacional: 'nacional'
      };
      return map[tok] || tok;
    });
  }, [normalize]);

  const isStringMatch = useCallback((a?: string, b?: string) => {
    const ta = canonicalizeTokens(a);
    const tb = canonicalizeTokens(b);
    if (ta.length === 0 || tb.length === 0) return false;
    const setA = new Set(ta);
    const inter = tb.filter(x => setA.has(x));
    // Se o label contém "decolagem" ou "maras", exigir que esse token esteja presente
    const requireProgramToken = tb.includes('decolagem') || tb.includes('maras');
    const hasProgramToken = inter.includes('decolagem') || inter.includes('maras');
    const requiredOverlap = Math.min(tb.length, 2); // exigir ao menos 2 tokens quando houver 2 ou mais
    if (requireProgramToken) {
      // Exigir o token do programa + ao menos outro token significativo
      return hasProgramToken && inter.length >= requiredOverlap;
    }
    // Caso geral: exigir ao menos 2 tokens (ou todos, quando só houver 2)
    return inter.length >= requiredOverlap;
  }, [canonicalizeTokens]);

  const doesActivityMatch = useCallback((activity: Partial<Atividade>, label: string) => {
    const fields = [
      (activity as any).atividade_label,
      (activity as any).titulo,
      (activity as any).tipo,
      (activity as any).categoria
    ].filter(Boolean) as string[];
    return fields.some(f => isStringMatch(f, label));
  }, [isStringMatch]);

  const isSameDay = useCallback((dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  }, []);

  const sumActivitiesByLabels = useCallback((labels: string[], options?: { todayOnly?: boolean }) => {
    return activitiesArray.reduce((acc, a) => {
      const match = labels.some(l => doesActivityMatch(a, l));
      if (!match) return acc;
      if (options?.todayOnly) {
        // Buscar a melhor data disponível na atividade (compatível com DashboardMetasPage)
        const activityDate = (a as any).activity_date || (a as any).data_inicio || (a as any).created_at || (a as any).data || (a as any).date;
        if (!isSameDay(activityDate)) return acc;
      }
      // Quantidade pode vir como string ou número e com diferentes nomes de campo
      const qRaw = (a as any).quantidade ?? (a as any).qtd ?? 1;
      const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
      return acc + (isNaN(numQ) ? 1 : numQ);
    }, 0);
  }, [activitiesArray, doesActivityMatch, isSameDay]);

  const sumGoalsByLabels = useCallback((labels: string[]) => {
    return goalsArray
      .filter(g => {
        const fields = [
          (g as any).titulo,
          (g as any).descricao,
          (g as any).nome,
          (g as any).atividade_tipo,
          (g as any).categoria
        ].filter(Boolean) as string[];
        return labels.some(l => fields.some(f => isStringMatch(f, l)));
      })
      .reduce((sum, g) => {
        const raw = (g as any).valorMeta ?? (g as any).valor_meta ?? 0;
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
        return sum + (isNaN(num) ? 0 : num);
      }, 0);
  }, [goalsArray, isStringMatch]);

  // Preferir metas Nacionais quando existirem; caso contrário, somar todas as correspondentes
  const sumGoalsByLabelsPreferNational = useCallback((labels: string[]) => {
    const matches = goalsArray.filter(g => {
      const fields = [
        (g as any).titulo,
        (g as any).descricao,
        (g as any).nome,
        (g as any).atividade_tipo,
        (g as any).categoria
      ].filter(Boolean) as string[];
      return labels.some(l => fields.some(f => isStringMatch(f, l)));
    });
    const nationalMatches = matches.filter(g => {
      const reg = ((g as any).regional ?? '').toString().toLowerCase();
      return reg.includes('nacional') || reg.includes('todas');
    });
    const toSum = nationalMatches.length > 0 ? nationalMatches : matches;
    return toSum.reduce((sum, g) => {
      const raw = (g as any).valorMeta ?? (g as any).valor_meta ?? 0;
      const num = typeof raw === 'number' ? raw : parseFloat(String(raw));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  }, [goalsArray, isStringMatch]);

  // Estatísticas baseadas nos dados reais já existentes
  const stats = useMemo(() => ({
    participantes: {
      total: membersArray.length,
      meta: 1500,
      percentual: calcPercent(membersArray.length, 1500)
    },
    atividades: {
      total: activitiesArray.length,
      meta: 100,
      percentual: calcPercent(activitiesArray.length, 100)
    },
    metas: {
      total: goalsArray.length,
      concluidas: goalsArray.filter(goal => (goal as any).valor_atual >= (goal as any).valor_meta).length,
      percentual: calcPercent(goalsArray.filter(goal => (goal as any).valor_atual >= (goal as any).valor_meta).length, goalsArray.length || 1)
    }
  }), [membersArray, activitiesArray, goalsArray, calcPercent]);

  // Função para calcular NPS baseado nos dados de atividades regionais
  const calculateNPS = useCallback(() => {
    if (!regionalActivities || !Array.isArray(regionalActivities)) {
      return 0;
    }

    // Filtrar atividades que são do tipo NPS
    const npsActivities = regionalActivities.filter(activity => {
      const title = (activity.titulo || '').toLowerCase();
      const type = (activity.tipo || '').toLowerCase();
      const description = (activity.descricao || '').toLowerCase();
      
      return title.includes('nps') || 
             type.includes('nps') || 
             description.includes('nps');
    });

    if (npsActivities.length === 0) {
      return 0;
    }

    // Calcular a média dos valores de NPS
    const totalNPS = npsActivities.reduce((sum, activity) => {
      const quantidade = parseFloat(activity.quantidade) || 0;
      return sum + quantidade;
    }, 0);

    return npsActivities.length > 0 ? Number((totalNPS / npsActivities.length).toFixed(1)) : 0;
  }, [regionalActivities]);

  // Estatísticas específicas dos programas baseadas nos dados reais
  const programStats = useMemo(() => ({
    asMaras: {
      participantes: asMarasArray.length,
      ongsTotal: new Set(asMarasArray.map(p => (p as any).ong_id).filter(Boolean)).size,
      ongsMeta: 150,
      ligasTotal: Math.ceil(asMarasArray.length / 6),
      ligasMeta: 20,
      retencaoPercentual: asMarasArray.length > 0 ? 
        Math.round((asMarasArray.filter(p => (p as any).status === 'ativo').length / asMarasArray.length) * 100) : 0,
      retencaoMetaPercentual: 90,
      evasaoTotal: asMarasArray.filter(p => (p as any).status === 'inativo').length
    },
    decolagem: {
      familias: decolagemArray.length,
      ongsTotal: new Set(decolagemArray.map(f => (f as any).ong_id).filter(Boolean)).size,
      ongsMeta: 100,
      familiasMeta: 600,
      npsNota: calculateNPS(), // Calculado baseado nos dados de atividades regionais
      npsMeta: 9.0,
      evasaoTotal: decolagemArray.filter(f => (f as any).status === 'inativo').length
    },
    microcredito: {
      emprestimos: microcreditoArray.length,
      valorTotal: microcreditoArray.reduce((sum, emp) => sum + (((emp as any).valor_aprovado || 0) as number), 0),
      inadimplencia: microcreditoArray.filter(emp => (emp as any).status === 'inadimplente').length,
      inadimplenciaPercentual: (() => {
        // Usar dados da API regional_activities para inadimplência
        const inadimplenciaFromRegional = sumActivitiesByLabels(['Inadimplência']);
        return inadimplenciaFromRegional;
      })()
    }
  }), [asMarasArray, decolagemArray, microcreditoArray, calculateNPS]);

  // Dados para gráficos usando dados reais da API de instituições
  const chartData = useMemo(() => {
    console.log('Chart data update - instituicaoStats:', instituicaoStats);
    console.log('ONGs Decolagem:', instituicaoStats?.resumo?.ongsDecolagem);
    console.log('ONGs Maras:', instituicaoStats?.resumo?.ongsMaras);
    
    return {
      programas: [
        { 
          name: 'ONGs Decolagem', 
          value: instituicaoStats?.resumo?.ongsDecolagem || 0,
          color: '#3B82F6' // Azul moderno e profissional
        },
        { 
          name: 'ONGs Maras', 
          value: instituicaoStats?.resumo?.ongsMaras || 0,
          color: '#EC4899' // Rosa vibrante mantido
        },
      ],
    atividadesRegional: [
      { name: 'Nacional', value: 40, color: '#14B8A6' },
      { name: 'Norte', value: 18, color: '#10B981' },
      { name: 'Nordeste', value: 22, color: '#3B82F6' },
      { name: 'Centro-Oeste', value: 12, color: '#F59E0B' },
      { name: 'Sudeste', value: 28, color: '#8B5CF6' },
      { name: 'Sul', value: 15, color: '#EF4444' },
    ],
    inadimplencia: [
      { month: 'Jan', value: 0 },
      { month: 'Fev', value: 0 },
      { month: 'Mar', value: 0 },
      { month: 'Abr', value: 0 },
      { month: 'Mai', value: 0 },
      { month: 'Jun', value: programStats.microcredito.inadimplenciaPercentual },
    ],
    familiasEvolucao: [
      { month: 'Jan', value: Math.max(300, programStats.decolagem.familias - 200) },
      { month: 'Fev', value: Math.max(320, programStats.decolagem.familias - 180) },
      { month: 'Mar', value: Math.max(340, programStats.decolagem.familias - 160) },
      { month: 'Abr', value: Math.max(360, programStats.decolagem.familias - 140) },
      { month: 'Mai', value: Math.max(380, programStats.decolagem.familias - 120) },
      { month: 'Jun', value: programStats.decolagem.familias },
    ],
  }}, [stats, programStats, instituicaoStats]);

  // Evolução mensal de Famílias Embarcadas Decolagem (Jan-Dez)
  const familiasEvolucaoData = useMemo(() => {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const currentYear = new Date().getFullYear();
    const monthlyTotals = new Array(12).fill(0);

    // Somar atividades que correspondem ao label desejado por mês (apenas do ano corrente)
    activitiesArray.forEach((a) => {
      const matches = doesActivityMatch(a, 'Famílias Embarcadas Decolagem') || doesActivityMatch(a, 'familias_embarcadas_decolagem');
      if (!matches) return;
      const rawDate = (a as any).activity_date || (a as any).data_inicio || (a as any).created_at || (a as any).data || (a as any).date;
      const d = rawDate ? new Date(rawDate) : null;
      if (!d || isNaN(d.getTime()) || d.getFullYear() !== currentYear) return;
      const monthIdx = d.getMonth(); // 0..11
      const qRaw = (a as any).quantidade ?? (a as any).qtd ?? 1;
      const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
      monthlyTotals[monthIdx] += isNaN(numQ) ? 1 : numQ;
    });

    // Fallback: se todos os valores forem 0, gerar uma distribuição suave baseada no total de famílias do programa
    const allZero = monthlyTotals.every(v => v === 0);
    if (allZero && programStats?.decolagem?.familias > 0) {
      const total = programStats.decolagem.familias;
      // Distribuição suave crescente
      for (let i = 0; i < 12; i++) {
        const weight = Math.pow((i + 1) / 12, 1.2);
        const value = Math.round(total * weight) - (i > 0 ? Math.round(total * Math.pow(i / 12, 1.2)) : 0);
        monthlyTotals[i] = Math.max(0, value);
      }
    }

    return months.map((m, i) => ({ name: m, value: monthlyTotals[i] }));
  }, [activitiesArray, doesActivityMatch, programStats]);

  // Evolução mensal de Diagnósticos Realizados (Jan-Dez)
  const diagnosticosEvolucaoData = useMemo(() => {
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const currentYear = new Date().getFullYear();
    const monthlyTotals = new Array(12).fill(0);

    activitiesArray.forEach((a) => {
      const matches = doesActivityMatch(a, 'Diagnósticos Realizados') || doesActivityMatch(a, 'diagnosticos_realizados');
      if (!matches) return;
      const rawDate = (a as any).activity_date || (a as any).data_inicio || (a as any).created_at || (a as any).data || (a as any).date;
      const d = rawDate ? new Date(rawDate) : null;
      if (!d || isNaN(d.getTime()) || d.getFullYear() !== currentYear) return;
      const monthIdx = d.getMonth();
      const qRaw = (a as any).quantidade ?? (a as any).qtd ?? 1;
      const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
      monthlyTotals[monthIdx] += isNaN(numQ) ? 1 : numQ;
    });

    const allZero = monthlyTotals.every(v => v === 0);
    if (allZero) {
      const total = sumActivitiesByLabels(['Diagnósticos Realizados', 'diagnosticos_realizados']);
      if (total > 0) {
        for (let i = 0; i < 12; i++) {
          const weight = Math.pow((i + 1) / 12, 1.2);
          const value = Math.round(total * weight) - (i > 0 ? Math.round(total * Math.pow(i / 12, 1.2)) : 0);
          monthlyTotals[i] = Math.max(0, value);
        }
      }
    }

    return months.map((m, i) => ({ name: m, value: monthlyTotals[i] }));
  }, [activitiesArray, doesActivityMatch, sumActivitiesByLabels]);

  // Novos cálculos usando atividades e metas reais
  const familiasEmbarcadasRealizado = sumActivitiesByLabels(['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem']);
  
  // Total de Pessoas Atendidas: Famílias Embarcadas Decolagem × 4 (considerando 4 pessoas por família)
  const pessoasAtendidas = familiasEmbarcadasRealizado * 4;
  const familiasEmbarcadasMeta = sumGoalsByLabelsPreferNational(['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem']) || 10000;

  const diagnosticosRealizadosRealizado = sumActivitiesByLabels(['Diagnósticos Realizados', 'diagnosticos_realizados']);
  const diagnosticosRealizadosMeta = sumGoalsByLabelsPreferNational(['Diagnósticos Realizados', 'diagnosticos_realizados']) || 12000;

  // Usando dados da API /api/instituicoes para os cards ONGs
  const ongsDecolagemRealizado = instituicaoStats?.resumo?.ongsDecolagem || 0;
  const ongsDecolagemMeta = sumGoalsByLabelsPreferNational(['ONGs Decolagem', 'ongs_decolagem']) || 240;

  const ongsMarasRealizado = instituicaoStats?.resumo?.ongsMaras || 0;
  const ongsMarasMeta = sumGoalsByLabelsPreferNational(['ONGs Maras', 'ongs_maras']) || 100;

  const ligasMarasFormadasRealizadoTmp = sumActivitiesByLabels(['Ligas Maras Formadas', 'ligas_maras_formadas']);
  const ligasMarasFormadasRealizado = ligasMarasFormadasRealizadoTmp > 0 ? ligasMarasFormadasRealizadoTmp : programStats.asMaras.ligasTotal;
  const ligasMarasFormadasMeta = sumGoalsByLabelsPreferNational(['Ligas Maras Formadas', 'ligas_maras_formadas']) || 1600;

  // Cálculo do Total Maras baseado nas Ligas Maras Formadas (sempre × 6)
  const totalMaras = ligasMarasFormadasRealizado * 6;
  const totalMarasMeta = ligasMarasFormadasMeta * 6;

  // Implementação correta para Leads do Dia - mostrar último registro (não acumulativo)
  const getLeadsDoDiaRealizado = useCallback(() => {
    // Filtrar atividades que são "Leads do dia"
    const leadsActivities = activitiesArray.filter(a => 
      doesActivityMatch(a, 'Leads do dia') || 
      doesActivityMatch(a, 'Leads do Dia') || 
      doesActivityMatch(a, 'leads_do_dia')
    );
    
    if (leadsActivities.length === 0) return 0;
    
    // Ordenar por data (mais recente primeiro) e pegar o primeiro
    const sortedActivities = leadsActivities.sort((a, b) => {
      const dateA = new Date((a as any).activity_date || (a as any).data_inicio || (a as any).created_at || 0);
      const dateB = new Date((b as any).activity_date || (b as any).data_inicio || (b as any).created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    const latestActivity = sortedActivities[0];
    const qRaw = (latestActivity as any).quantidade ?? (latestActivity as any).qtd ?? 0;
    const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
    return isNaN(numQ) ? 0 : numQ;
  }, [activitiesArray, doesActivityMatch]);

  // Implementação para Leads Maras - buscar dados da tabela regional_activities
  const getLeadsMarasRealizado = useCallback(() => {
    if (!regionalActivities || !Array.isArray(regionalActivities)) {
      return 0;
    }

    // Filtrar atividades que são do tipo "leads_maras"
    const leadsMarasActivities = regionalActivities.filter(activity => {
      const tipo = (activity.tipo || '').toLowerCase();
      return tipo === 'leads_maras' || tipo === 'leads maras';
    });

    if (leadsMarasActivities.length === 0) {
      return 0;
    }

    // Somar todas as quantidades de leads maras
    const totalLeadsMaras = leadsMarasActivities.reduce((sum, activity) => {
      const quantidade = parseFloat(activity.quantidade) || 0;
      return sum + quantidade;
    }, 0);

    return totalLeadsMaras;
  }, [regionalActivities]);

  // Implementação correta para Total de Leads - somar apenas Leads do dia (não incluir Leads Maras)
  const getTotalLeadsRealizado = useCallback(() => {
    return sumActivitiesByLabels(['Leads do dia', 'Leads do Dia', 'leads_do_dia']);
  }, [sumActivitiesByLabels]);

  const leadsDoDiaRealizado = getLeadsDoDiaRealizado();
  const leadsMarasRealizado = getLeadsMarasRealizado();
  const totalLeads = getTotalLeadsRealizado();
  const totalLeadsMeta = programStats.decolagem.familiasMeta;
  const leadsDoDiaMeta = sumGoalsByLabels(['Leads do dia', 'Leads do Dia', 'leads_do_dia']) || totalLeadsMeta;

  // Cálculo para Processo Seletivo
  const processoSeletivoRealizado = sumActivitiesByLabels(['Processo seletivo', 'seletivas', 'Processo Seletivo']);
  const processoSeletivoMeta = sumGoalsByLabelsPreferNational(['Processo seletivo', 'seletivas', 'Processo Seletivo']) || 50;

  // Cálculo para Conversão de Leads
  const conversaoLeadsRealizado = sumActivitiesByLabels(['Conversão de Leads', 'conversao_leads', 'Conversao de Leads']);
  const conversaoLeadsMeta = sumGoalsByLabelsPreferNational(['Conversão de Leads', 'conversao_leads', 'Conversao de Leads']) || 100;

  // Cálculo para Imersão Maras
  const imersaoMarasRealizado = sumActivitiesByLabels(['Imersão Maras', 'imersao', 'Imersao Maras']);
  const imersaoMarasMeta = sumGoalsByLabelsPreferNational(['Imersão Maras', 'imersao', 'Imersao Maras']) || 50;

  // Cálculo para Encontro Líder Maras
  const encontroLiderMarasRealizado = sumActivitiesByLabels(['Encontro Líder Maras', 'encontro_lider_maras', 'Encontro Lider Maras']);
  const encontroLiderMarasMeta = sumGoalsByLabelsPreferNational(['Encontro Líder Maras', 'encontro_lider_maras', 'Encontro Lider Maras']) || 30;

  // Cálculo de retenção usando dados do endpoint /api/instituicoes/stats
  const retencaoDecolagemPercentual = instituicaoStats?.porPrograma?.decolagem && instituicaoStats?.evasaoPorPrograma?.decolagem !== undefined
    ? Math.round(((instituicaoStats.porPrograma.decolagem / (instituicaoStats.porPrograma.decolagem + instituicaoStats.evasaoPorPrograma.decolagem)) * 100) || 0)
    : 0;
  
  const retencaoMarasPercentual = instituicaoStats?.porPrograma?.as_maras && instituicaoStats?.evasaoPorPrograma?.as_maras !== undefined
    ? Math.round(((instituicaoStats.porPrograma.as_maras / (instituicaoStats.porPrograma.as_maras + instituicaoStats.evasaoPorPrograma.as_maras)) * 100) || 0)
    : 0;

  const retencaoDecolagemMetaPercentual = sumGoalsByLabels(['Retenção Decolagem', 'Retencao Decolagem', 'retencao_decolagem']) || 90;
  const retencaoMarasMetaPercentual = sumGoalsByLabels(['Retenção Maras', 'Retencao Maras', 'retencao_maras']) || programStats.asMaras.retencaoMetaPercentual;
  
  const isLoading = activitiesLoading || goalsLoading || usersLoading || 
                   microcreditoLoading || asMarasLoading || decolagemLoading || instituicaoStatsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Geral</h1>
          <p className="text-gray-600 mt-1">
            Bem-vindo(a) de volta, {user?.nome || 'Super Administrador'}! Os dados são atualizados em tempo real!
          </p>
        </div>
      </div>

      {/* Stats Cards - Linha 1: Leads do dia, Leads Maras, Total de Leads e Conversão de Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Leads do dia"
          value={`${leadsDoDiaRealizado}`}
          icon={TrendingUp}
          trend={leadsDoDiaRealizado > 0 ? 'up' : 'down'}
          color="secondary"
          iconColor="maras"
        />
        <StatsCard
          title="Total de Leads"
          value={totalLeads.toString()}
          icon={User}
          trend={'neutral'}
          color="secondary"
          iconColor="maras"
        />
        <StatsCard
          title="Leads Maras"
          value={`${leadsMarasRealizado}`}
          icon={TrendingUp}
          trend={leadsMarasRealizado > 0 ? 'up' : 'down'}
          color="secondary"
          iconColor="maras"
        />
        <StatsCard
          title="Conversão de Leads"
          value={conversaoLeadsRealizado.toString()}
          icon={Target}
          trend={calcPercent(conversaoLeadsRealizado, conversaoLeadsMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={conversaoLeadsMeta}
          iconColor="maras"
        />
      </div>

      {/* Stats Cards - Linha 2: Processo Seletivo, Ligas Maras Formadas, Total Maras e ONGs Maras (Ativas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Processo Seletivo"
          value={processoSeletivoRealizado.toString()}
          icon={UserCheck}
          trend={calcPercent(processoSeletivoRealizado, processoSeletivoMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={processoSeletivoMeta}
          iconColor="maras"
        />
        <StatsCard
          title="Ligas Maras Formadas"
          value={ligasMarasFormadasRealizado.toString()}
          icon={Layers}
          trend={calcPercent(ligasMarasFormadasRealizado, ligasMarasFormadasMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={ligasMarasFormadasMeta}
          iconColor="maras"
        />
        <StatsCard
          title="Total Maras"
          value={totalMaras.toString()}
          icon={User}
          trend="neutral"
          color="secondary"
          goalValue={1} // Valor dummy para ativar a seção de meta
          customMetaText="(A Liga é composta por 6 Maras)"
          hideMetaPercentage={true}
          iconColor="maras"
        />
        <StatsCard
          title="ONGs Maras (Ativas)"
          value={ongsMarasRealizado.toString()}
          icon={Building2}
          trend={calcPercent(ongsMarasRealizado, ongsMarasMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={ongsMarasMeta}
          iconColor="maras"
        />
      </div>

      {/* Stats Cards - Linha 3: Imersão Maras, Encontro Líder Maras, Evasão Maras e Retenção Maras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Imersão Maras"
          value={imersaoMarasRealizado.toString()}
          icon={Crown}
          trend={calcPercent(imersaoMarasRealizado, imersaoMarasMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={imersaoMarasMeta}
          iconColor="maras"
        />
        <StatsCard
          title="Encontro Líder Maras"
          value={encontroLiderMarasRealizado.toString()}
          icon={Activity}
          trend={calcPercent(encontroLiderMarasRealizado, encontroLiderMarasMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={encontroLiderMarasMeta}
          iconColor="maras"
        />
        <StatsCard
          title="Evasão Maras"
          value={(instituicaoStats?.evasaoPorPrograma?.as_maras || 0).toString()}
          icon={AlertTriangle}
          trend="down"
          color="error"
          iconColor="maras"
        />
        <StatsCard
          title="Retenção Maras"
          value={`${retencaoMarasPercentual}%`}
          icon={Percent}
          trend={retencaoMarasPercentual >= retencaoMarasMetaPercentual ? 'up' : 'down'}
          color="secondary"
          goalValue={retencaoMarasMetaPercentual}
          iconColor="maras"
        />
      </div>

      {/* Stats Cards - Linha 4: ONGs Decolagem (Ativas), Diagnósticos Realizados, Famílias Embarcadas e Total de Pessoas Atendidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="ONGs Decolagem (Ativas)"
          value={ongsDecolagemRealizado.toString()}
          icon={Home}
          trend={calcPercent(ongsDecolagemRealizado, ongsDecolagemMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={ongsDecolagemMeta}
          iconColor="decolagem"
        />
        <StatsCard
          title="Diagnósticos Realizados"
          value={diagnosticosRealizadosRealizado.toString()}
          icon={Rocket}
          trend={calcPercent(diagnosticosRealizadosRealizado, diagnosticosRealizadosMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={diagnosticosRealizadosMeta}
          iconColor="decolagem"
        />
        <StatsCard
          title="Famílias Embarcadas"
          value={familiasEmbarcadasRealizado.toString()}
          icon={Users}
          trend={calcPercent(familiasEmbarcadasRealizado, familiasEmbarcadasMeta) >= 80 ? 'up' : 'down'}
          color="secondary"
          goalValue={familiasEmbarcadasMeta}
          iconColor="decolagem"
        />
        <StatsCard
          title="Total de Pessoas Atendidas"
          value={pessoasAtendidas.toString()}
          icon={Users}
          trend={'neutral'}
          color="secondary"
          iconColor="decolagem"
        />
      </div>

      {/* Stats Cards - Linha 5: Evasão Decolagem, Retenção Decolagem, Inadimplência e NPS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Evasão Decolagem"
          value={(instituicaoStats?.evasaoPorPrograma?.decolagem || 0).toString()}
          icon={AlertTriangle}
          trend="down"
          color="error"
          iconColor="decolagem"
        />
        <StatsCard
          title="Retenção Decolagem"
          value={`${retencaoDecolagemPercentual}%`}
          icon={Percent}
          trend={retencaoDecolagemPercentual >= retencaoDecolagemMetaPercentual ? 'up' : 'down'}
          color="secondary"
          goalValue={retencaoDecolagemMetaPercentual}
          iconColor="decolagem"
        />
        <StatsCard
          title="Inadimplência"
          value={`${programStats.microcredito.inadimplenciaPercentual}%`}
          icon={AlertTriangle}
          trend="down"
          change={programStats.microcredito.inadimplenciaPercentual}
          color="error"
          iconColor="light-red"
        />
        <StatsCard
          title="NPS"
          value={(calculateNPS() > 0 ? calculateNPS().toString() : Math.round(((programStats.decolagem.npsNota || 0) * 10)).toString())}
          icon={Smile}
          trend={(calculateNPS() > 0 ? calculateNPS() : Math.round(((programStats.decolagem.npsNota || 0) * 10)) ) >= (sumGoalsByLabels(['NPS', 'nps']) || 70) ? 'up' : 'down'}
          change={calcPercent((calculateNPS() > 0 ? calculateNPS() : Math.round(((programStats.decolagem.npsNota || 0) * 10)) ), (sumGoalsByLabels(['NPS', 'nps']) || 70))}
          color="secondary"
          goalValue={sumGoalsByLabels(['NPS', 'nps']) || 70}
          iconColor="green"
        />
      </div>

      {/* Gráficos - Evoluções Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard
          title="Evolução Famílias Embarcadas Decolagem"
          subtitle={`Ano ${new Date().getFullYear()} • valores mensais`}
          type="line"
          data={familiasEvolucaoData}
          lineColor="#3B82F6"
          showMovingAverage
          movingAverageWindow={3}
          movingAvgColor="#10B981"
          movingAvgLabel="Média móvel (3 meses)"
        />
        <ChartCard
          title="Evolução Diagnósticos Realizados"
          subtitle={`Ano ${new Date().getFullYear()} • valores mensais`}
          type="line"
          data={diagnosticosEvolucaoData}
          lineColor="#8B5CF6"
          showMovingAverage
          movingAverageWindow={3}
          movingAvgColor="#10B981"
          movingAvgLabel="Média móvel (3 meses)"
        />
      </div>
    </div>
  );
}