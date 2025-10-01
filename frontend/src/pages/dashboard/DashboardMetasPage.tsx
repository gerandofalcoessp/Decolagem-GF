import { useState } from 'react';
import { Target, TrendingUp, Calendar, Filter } from 'lucide-react';
import { REGIONAL_LABELS, ATIVIDADE_OPTIONS, REGIONAL_COLOR_CLASSES } from '@/pages/calendario/constants';

// Mock data - será substituído por dados reais do Supabase
const mockMetas = [
  {
    id: '1',
    titulo: 'Cadastros As Maras',
    descricao: 'Meta mensal de novos cadastros no programa As Maras',
    valorMeta: 100,
    valorAtual: 87,
    periodo: 'Mensal',
    dataInicio: '2024-01-01',
    dataFim: '2024-01-31',
    status: 'em_andamento',
    regional: 'sp',
    equipe: 'Equipe A',
  },
  {
    id: '2',
    titulo: 'Microcrédito Aprovado',
    descricao: 'Valor total de microcrédito aprovado no trimestre',
    valorMeta: 50000,
    valorAtual: 42500,
    periodo: 'Trimestral',
    dataInicio: '2024-01-01',
    dataFim: '2024-03-31',
    status: 'em_andamento',
    regional: 'rj',
    equipe: 'Equipe B',
  },
  {
    id: '3',
    titulo: 'Diagnósticos Decolagem',
    descricao: 'Número de diagnósticos do Programa Decolagem realizados',
    valorMeta: 50,
    valorAtual: 52,
    periodo: 'Mensal',
    dataInicio: '2024-01-01',
    dataFim: '2024-01-31',
    status: 'concluida',
    regional: 'nacional',
    equipe: 'Equipe Nacional',
  },
];

export default function DashboardMetasPage() {
  // Removidos: filtroStatus e filtroPeriodo
  const [filtroAtividade, setFiltroAtividade] = useState<string>('');
  const [filtroRegional, setFiltroRegional] = useState<string>('todos');
  const [filtroEquipe, setFiltroEquipe] = useState<string>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroAno, setFiltroAno] = useState<string>('todos');

  // Opções dinâmicas de regionais (todas as áreas), usando labels centralizados
  const regionalOptions = Object.entries(REGIONAL_LABELS).filter(([key]) => key !== 'todas');

  // Opções dinâmicas de equipes, derivadas de dados existentes (metas e atividades mock)
  const equipeOptions = Array.from(new Set([
    ...mockMetas.map(m => m.equipe),
    'Equipe SP',
    'Equipe RJ',
    'Equipe Nacional',
  ].filter(Boolean)));

  // Anos disponíveis: união dos anos em metas + faixa ampliada ao redor do ano atual
  const yearsFromMetas = mockMetas.flatMap(m => {
    const yi = new Date(m.dataInicio).getFullYear();
    const yf = new Date(m.dataFim).getFullYear();
    return [yi, yf].filter(Boolean) as number[];
  });
  const currentYear = new Date().getFullYear();
  const minYear = Math.min(...(yearsFromMetas.length ? yearsFromMetas : [currentYear]));
  const maxYear = Math.max(...(yearsFromMetas.length ? yearsFromMetas : [currentYear]));
  const expandedYears = Array.from({ length: (maxYear + 2) - (minYear - 2) + 1 }, (_, i) => (minYear - 2 + i).toString());
  const availableYears = Array.from(new Set([...
    yearsFromMetas.map(String),
    ...expandedYears,
  ])).sort();

  const getProgressPercentage = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-100 text-green-800';
      case 'em_andamento':
        return 'bg-blue-100 text-blue-800';
      case 'atrasada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'Concluída';
      case 'em_andamento':
        return 'Em Andamento';
      case 'atrasada':
        return 'Atrasada';
      default:
        return 'Indefinido';
    }
  };


  const metasFiltradas = mockMetas.filter(meta => {
    // matching de atividade por label selecionado ou busca vazia
    const atividadeMatch = !filtroAtividade ||
      meta.titulo.toLowerCase().includes(filtroAtividade.toLowerCase()) ||
      meta.descricao.toLowerCase().includes(filtroAtividade.toLowerCase());

    const regionalMatch = filtroRegional === 'todos' || meta.regional === filtroRegional;
    const equipeMatch = filtroEquipe === 'todos' || meta.equipe === filtroEquipe;
    const date = new Date(meta.dataInicio);
    const mes = (date.getMonth() + 1).toString();
    const ano = date.getFullYear().toString();
    const mesMatch = filtroMes === 'todos' || filtroMes === mes;
    const anoMatch = filtroAno === 'todos' || filtroAno === ano;
    const mesAnoMatch = mesMatch && anoMatch;
    return atividadeMatch && regionalMatch && equipeMatch && mesAnoMatch;
  });

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Metas</p>
              <p className="text-3xl font-bold text-gray-900">{mockMetas.length}</p>
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
                {mockMetas.filter(m => m.status === 'concluida').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-3xl font-bold text-blue-600">
                {mockMetas.filter(m => m.status === 'em_andamento').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <div className="flex items-center space-x-4">
            {/* Removidos: Status e Período */}
            {/* Atividade */}
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Atividade:</label>
              <select
                value={filtroAtividade}
                onChange={(e) => setFiltroAtividade(e.target.value)}
                className="input-sm"
              >
                <option value="">Todas</option>
                {ATIVIDADE_OPTIONS.filter(opt => opt.label.toLowerCase() !== 'outra').map((opt) => (
                  <option key={opt.label} value={opt.label}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Regional */}
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Regional:</label>
              <select
                value={filtroRegional}
                onChange={(e) => setFiltroRegional(e.target.value)}
                className="input-sm"
              >
                <option value="todos">Todos</option>
                {regionalOptions.map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            {/* Equipe */}
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Equipe:</label>
              <select
                value={filtroEquipe}
                onChange={(e) => setFiltroEquipe(e.target.value)}
                className="input-sm"
              >
                <option value="todos">Todos</option>
                {equipeOptions.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
            {/* Mês */}
            <div>
              <label className="text-sm font-medium text-gray-700 mr-2">Mês:</label>
              <select
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="input-sm"
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
              <label className="text-sm font-medium text-gray-700 mr-2">Ano:</label>
              <select
                value={filtroAno}
                onChange={(e) => setFiltroAno(e.target.value)}
                className="input-sm"
              >
                <option value="todos">Todos</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>


      {/* Detalhamento por Área */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Detalhamento por Área</h2>
          <span className="text-sm text-gray-500">Realizado / Meta • Progresso</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(REGIONAL_LABELS)
            .filter(([key]) => key !== 'todas')
            .filter(([key]) => {
              if (filtroRegional !== 'todos') {
                return key === filtroRegional && metasFiltradas.some(m => m.regional === key);
              }
              return metasFiltradas.some(m => m.regional === key);
            })
            .map(([key, label]) => {
              const metasDaArea = metasFiltradas.filter(m => m.regional === key);
              const totalMeta = metasDaArea.reduce((sum, m) => sum + m.valorMeta, 0);
              const totalAtual = metasDaArea.reduce((sum, m) => sum + m.valorAtual, 0);
              const progress = totalMeta > 0 ? Math.min((totalAtual / totalMeta) * 100, 100) : 0;
              const color = REGIONAL_COLOR_CLASSES[key] || 'bg-gray-200';
        
              return (
                <div key={key} className="rounded-xl shadow-md border border-gray-200 overflow-hidden backdrop-blur-sm"
                     style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
                  <div className={`p-4 ${color} bg-opacity-20`}> 
                    <div className="flex items-center justify-between">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900">{label}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/60 text-gray-700 border border-white/70">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="p-5 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-sm text-gray-500">Realizado</div>
                        <div className="text-xl font-bold text-gray-900">{totalAtual.toLocaleString('pt-BR')}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Meta</div>
                        <div className="text-xl font-bold text-gray-900">{totalMeta.toLocaleString('pt-BR')}</div>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4f46e5, #22c55e)' }}
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                      <span>Atualizado agora</span>
                      <button className="btn-tertiary btn-xs">Ver detalhes</button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      {/* Detalhamento por Atividade */}
      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Detalhamento por Atividade</h2>
          <span className="text-sm text-gray-500">% Realizado • % Meta • % Falta</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ATIVIDADE_OPTIONS.filter(({ label }) => label.toLowerCase() !== 'outra').map(({ label }) => {
            // Filtra metas conforme filtros ativos
            const metasDaAtividade = metasFiltradas.filter(m => 
              m.titulo.toLowerCase().includes(label.toLowerCase()) ||
              m.descricao.toLowerCase().includes(label.toLowerCase())
            );
            const totalMeta = metasDaAtividade.reduce((sum, m) => sum + m.valorMeta, 0);
            const totalAtual = metasDaAtividade.reduce((sum, m) => sum + m.valorAtual, 0);
            const percentualRealizado = totalMeta > 0 ? (totalAtual / totalMeta) * 100 : 0;
            const percentualMeta = 100; // referência
            const percentualFalta = Math.max(0, 100 - percentualRealizado);

            return (
              <div key={label} className="rounded-xl shadow-md border border-gray-200 overflow-hidden" style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.06)' }}>
                <div className="p-4 bg-gradient-to-r from-indigo-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">{label}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-white/70 text-gray-700 border border-white/80">
                      {percentualRealizado.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-5 bg-white">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg p-3 bg-emerald-50 border border-emerald-100">
                      <div className="text-xs font-medium text-emerald-700">Realizado</div>
                      <div className="text-lg font-bold text-emerald-800">{percentualRealizado.toFixed(1)}%</div>
                    </div>
                    <div className="rounded-lg p-3 bg-indigo-50 border border-indigo-100">
                      <div className="text-xs font-medium text-indigo-700">Meta</div>
                      <div className="text-lg font-bold text-indigo-800">{percentualMeta.toFixed(1)}%</div>
                    </div>
                    <div className="rounded-lg p-3 bg-rose-50 border border-rose-100">
                      <div className="text-xs font-medium text-rose-700">Falta</div>
                      <div className="text-lg font-bold text-rose-800">{percentualFalta.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="mt-4 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentualRealizado}%`, background: 'linear-gradient(90deg, #22c55e, #4f46e5)' }}
                    />
                  </div>
                </div>
              </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}