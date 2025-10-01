import { useState, useEffect } from 'react';
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
  Rocket
} from 'lucide-react';

import { useAuth } from '@/store/authStore';
import StatsCard from '@/components/dashboard/StatsCard';
import ChartCard from '@/components/dashboard/ChartCard';
import RecentActivities from '@/components/dashboard/RecentActivities';
import QuickActions from '@/components/dashboard/QuickActions';

// Mock data - será substituído por dados reais do Supabase
const mockStats = {
  participantes: {
    total: 1247,
    change: 12.5,
    trend: 'up' as const,
  },
  programas: {
    total: 3,
    change: 0,
    trend: 'neutral' as const,
  },
  microcredito: {
    total: 89500,
    change: 8.2,
    trend: 'up' as const,
  },
  metas: {
    total: 78,
    change: -2.1,
    trend: 'down' as const,
  },
};

const mockChartData = {
  participantes: [
    { month: 'Jan', value: 1100 },
    { month: 'Fev', value: 1150 },
    { month: 'Mar', value: 1200 },
    { month: 'Abr', value: 1180 },
    { month: 'Mai', value: 1220 },
    { month: 'Jun', value: 1247 },
  ],
  programas: [
    { name: 'As Maras', value: 45, color: '#EC4899' },
    { name: 'Microcrédito', value: 30, color: '#F97316' },
    { name: 'Decolagem', value: 25, color: '#8B5CF6' },
  ],
  atividadesRegional: [
    { name: 'Nacional', value: 40, color: '#14B8A6' }, // teal-500
    { name: 'Norte', value: 18, color: '#10B981' }, // emerald-500
    { name: 'Nordeste', value: 22, color: '#3B82F6' }, // blue-500
    { name: 'Centro-Oeste', value: 12, color: '#F59E0B' }, // amber-500
    { name: 'Sudeste', value: 28, color: '#8B5CF6' }, // violet-500
    { name: 'Sul', value: 15, color: '#EF4444' }, // red-500
  ],
  inadimplencia: [
    { month: 'Jan', value: 0 },
    { month: 'Fev', value: 0 },
    { month: 'Mar', value: 0 },
    { month: 'Abr', value: 0 },
    { month: 'Mai', value: 0 },
    { month: 'Jun', value: 0 },
    { month: 'Jul', value: 0 },
    { month: 'Ago', value: 0.5 },
    { month: 'Set', value: 2 },
    { month: 'Out', value: 0.5 },
    { month: 'Nov', value: 0 },
    { month: 'Dez', value: 0 },
  ],
  familiasEvolucao: [
    { month: 'Jan', value: 320 },
    { month: 'Fev', value: 340 },
    { month: 'Mar', value: 360 },
    { month: 'Abr', value: 380 },
    { month: 'Mai', value: 400 },
    { month: 'Jun', value: 420 },
    { month: 'Jul', value: 450 },
    { month: 'Ago', value: 470 },
    { month: 'Set', value: 500 },
    { month: 'Out', value: 500 },
    { month: 'Nov', value: 500 },
    { month: 'Dez', value: 500 },
  ],
};

// Dados mockados específicos para os cards solicitados (substituir por serviço real quando disponível)
const mockMarasMetrics = {
  ongsTotal: 120,
  ongsMeta: 150,
  ligasTotal: 15,
  ligasMeta: 20,
  retencaoPercentual: 86, // %
  retencaoMetaPercentual: 90, // %
};

const mockDecolagemMetrics = {
  ongsTotal: 80,
  ongsMeta: 100,
  familiasTotal: 500,
  familiasMeta: 600,
  npsNota: 8.7,
  npsMeta: 9.0,
  evasaoTotal: 5,
};

const totalMaras = mockMarasMetrics.ligasTotal * 6;
const totalMarasMeta = mockMarasMetrics.ligasMeta * 6;
const pessoasAtendidas = mockDecolagemMetrics.familiasTotal * 4;
const pessoasAtendidasMeta = mockDecolagemMetrics.familiasMeta * 4;

// util simples para calcular % (com proteção contra divisão por zero)
const calcPercent = (total: number, meta: number) => {
  if (!meta || meta <= 0) return 0;
  return Math.min(100, Math.round((total / meta) * 100));
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Dashboard Geral
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Visão geral das atividades e métricas dos programas
          </p>
        </div>
      </div>

      {/* Dashboard Tabs */}
      {/* Navegação por abas removida – utilize o menu lateral */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard
          title="ONGs Maras"
          value={`${mockMarasMetrics.ongsTotal} / ${mockMarasMetrics.ongsMeta}`}
          percentage={calcPercent(mockMarasMetrics.ongsTotal, mockMarasMetrics.ongsMeta)}
          showRealizadoMetaLabel
          icon={Building2}
          color="primary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Ligas Formadas"
          value={`${mockMarasMetrics.ligasTotal} / ${mockMarasMetrics.ligasMeta}`}
          percentage={calcPercent(mockMarasMetrics.ligasTotal, mockMarasMetrics.ligasMeta)}
          showRealizadoMetaLabel
          icon={Layers}
          color="secondary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Total Maras"
          value={`${totalMaras} / ${totalMarasMeta}`}
          percentage={calcPercent(totalMaras, totalMarasMeta)}
          showRealizadoMetaLabel
          icon={Users}
          color="success"
          isLoading={isLoading}
        />
        <StatsCard
          title="Retenção"
          value={`${mockMarasMetrics.retencaoPercentual}% / ${mockMarasMetrics.retencaoMetaPercentual}%`}
          percentage={calcPercent(mockMarasMetrics.retencaoPercentual, mockMarasMetrics.retencaoMetaPercentual)}
          showRealizadoMetaLabel
          icon={Percent}
          color="warning"
          isLoading={isLoading}
        />
      </div>

      {/* Cards Decolagem */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <StatsCard
          title="ONGs Decolagem"
          value={`${mockDecolagemMetrics.ongsTotal} / ${mockDecolagemMetrics.ongsMeta}`}
          percentage={calcPercent(mockDecolagemMetrics.ongsTotal, mockDecolagemMetrics.ongsMeta)}
          showRealizadoMetaLabel
          icon={Rocket}
          color="primary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Famílias Atendidas"
          value={`${mockDecolagemMetrics.familiasTotal} / ${mockDecolagemMetrics.familiasMeta}`}
          percentage={calcPercent(mockDecolagemMetrics.familiasTotal, mockDecolagemMetrics.familiasMeta)}
          showRealizadoMetaLabel
          icon={Home}
          color="secondary"
          isLoading={isLoading}
        />
        <StatsCard
          title="Pessoas Atendidas"
          value={`${pessoasAtendidas} / ${pessoasAtendidasMeta}`}
          percentage={calcPercent(pessoasAtendidas, pessoasAtendidasMeta)}
          showRealizadoMetaLabel
          icon={User}
          color="success"
          isLoading={isLoading}
        />
        <StatsCard
          title="NPS"
          value={`${mockDecolagemMetrics.npsNota.toFixed(1)} / ${mockDecolagemMetrics.npsMeta.toFixed(1)}`}
          percentage={calcPercent(mockDecolagemMetrics.npsNota, mockDecolagemMetrics.npsMeta)}
          showRealizadoMetaLabel
          icon={Smile}
          color="warning"
          isLoading={isLoading}
        />
        <StatsCard
          title="Evasão"
          value={`${mockDecolagemMetrics.evasaoTotal}`}
          icon={AlertTriangle}
          color="error"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        <ChartCard
          title="Distribuição de Atividades por Regional"
          subtitle="Quantidade de atividades por regional e nacional"
          type="doughnut"
          data={mockChartData.atividadesRegional}
          isLoading={isLoading}
        />
        <ChartCard
          title="Distribuição por Programa"
          subtitle="Participantes ativos"
          type="bar"
          data={mockChartData.programas}
          isLoading={isLoading}
        />
      </div>

      {/* Linha extra para Inadimplência e Evolução Famílias */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mt-4">
        <ChartCard
          title="Inadimplência (ONGs/Mês)"
          type="line"
          data={mockChartData.inadimplencia}
          lineColor="#EF4444"
          lineBgOpacity={0.15}
          isLoading={isLoading}
        />
        <ChartCard
          title="Evolução Famílias Atendidas"
          subtitle="Últimos 12 meses"
          type="line"
          data={mockChartData.familiasEvolucao}
          lineColor="#14B8A6"
          lineBgOpacity={0.12}
          isLoading={isLoading}
        />
      </div>
      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div>
          <RecentActivities isLoading={isLoading} />
        </div>
      </div>

      {/* Regional Info (se não for super admin) */}
      {user?.role !== 'super_admin' && (
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4 sm:p-6 border border-primary-100">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                Regional {user?.regional?.toUpperCase()}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Você está visualizando dados específicos da sua regional
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-primary-600">
                {Math.floor(mockStats.participantes.total * 0.3)}
              </div>
              <div className="text-xs sm:text-sm text-gray-500">
                Participantes locais
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}