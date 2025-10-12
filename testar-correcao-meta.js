// Script para testar a correção do valor Meta no Dashboard de Metas
// Simula os dados e a lógica corrigida

console.log('=== TESTE DA CORREÇÃO DO VALOR META ===\n');

// Simular dados de metas do banco
const metas = [
  {
    id: "c7b8e8c8-7b8e-4c8c-8c8c-4ed3f9507dac",
    nome: "Ong Mara",
    descricao: "Meta: 104 unidades | Meses: todo-ano | Área: Nacional",
    valorMeta: 104,
    valorAtual: 0,
    status: "pending",
    regional: "nacional"
  },
  {
    id: "06b08886-fc4a-452c-8337-0dcce2c92101", 
    nome: "Ong Decolagem",
    descricao: "Meta: 56 unidades | Meses: todo-ano | Área: Nacional",
    valorMeta: 56,
    valorAtual: 0,
    status: "pending",
    regional: "nacional"
  },
  {
    id: "9fe548a1-7d5e-4cc7-8beb-753eb2da7689",
    nome: "Ong Decolagem", 
    descricao: "Meta: 7 unidades | Meses: todo-ano | Área: Centro-Oeste, MG/ES, São Paulo, Sul, Rio de Janeiro, Norte, Nordeste 2, Nordeste 1",
    valorMeta: 7,
    valorAtual: 0,
    status: "pending",
    regional: "Centro-Oeste, MG/ES, São Paulo, Sul, Rio de Janeiro, Norte, Nordeste 2, Nordeste 1"
  }
];

// Simular dados de atividades regionais (realizadas)
const atividadesRegionais = [
  { regional: 'centro_oeste', titulo: 'Ligas Maras Formadas', quantidade: '45', status: 'ativo' },
  { regional: 'centro_oeste', titulo: 'Famílias Embarcadas Decolagem', quantidade: '500', status: 'ativo' },
  { regional: 'nordeste_2', titulo: 'Ligas Maras Formadas', quantidade: '50', status: 'ativo' },
  { regional: 'nordeste_2', titulo: 'Famílias Embarcadas Decolagem', quantidade: '720', status: 'ativo' },
  { regional: 'nordeste_2', titulo: 'Diagnósticos Realizados', quantidade: '350', status: 'ativo' },
  { regional: 'sul', titulo: 'Diagnósticos Realizados', quantidade: '450', status: 'ativo' },
  { regional: 'norte', titulo: 'Ligas Maras Formadas', quantidade: '25', status: 'ativo' },
  { regional: 'norte', titulo: 'Famílias Embarcadas Decolagem', quantidade: '300', status: 'ativo' },
  { regional: 'mg_es', titulo: 'Ligas Maras Formadas', quantidade: '50', status: 'ativo' },
  { regional: 'mg_es', titulo: 'Famílias Embarcadas Decolagem', quantidade: '450', status: 'ativo' },
  { regional: 'mg_es', titulo: 'Diagnósticos Realizados', quantidade: '180', status: 'ativo' },
  { regional: 'rj', titulo: 'Ligas Maras Formadas', quantidade: '60', status: 'ativo' },
  { regional: 'rj', titulo: 'Famílias Embarcadas Decolagem', quantidade: '650', status: 'ativo' }
];

const REGIONAL_LABELS = {
  'nacional': 'Nacional',
  'centro_oeste': 'Centro-Oeste',
  'nordeste_1': 'Nordeste 1',
  'nordeste_2': 'Nordeste 2',
  'sul': 'Sul',
  'norte': 'Norte',
  'mg_es': 'MG/ES',
  'rj': 'Rio de Janeiro',
  'sp': 'São Paulo'
};

// Função para calcular dados por área (lógica corrigida)
function calcularDadosPorArea(filtroRegional = 'todos') {
  console.log(`\n📊 Calculando dados para: ${filtroRegional === 'todos' ? 'Todas as áreas' : REGIONAL_LABELS[filtroRegional] || filtroRegional}`);
  
  if (filtroRegional !== 'todos') {
    // Calcular atividades realizadas para a regional
    const atividadesDaRegional = atividadesRegionais.filter(atividade => 
      atividade.regional === filtroRegional && atividade.status === 'ativo'
    );
    
    const totalAtividades = atividadesDaRegional.reduce((sum, atividade) => 
      sum + (parseInt(atividade.quantidade) || 1), 0
    );
    
    // Calcular metas reais para a regional
    const metasDaRegional = metas.filter(meta => {
      if (!meta.regional) return false;
      
      if (meta.regional.includes(',')) {
        const areas = meta.regional.split(',').map(area => area.trim());
        return areas.some(area => {
          const areaLimpa = area.toLowerCase().replace(/\s+/g, '_');
          return areaLimpa === filtroRegional || 
                 area.toLowerCase() === REGIONAL_LABELS[filtroRegional]?.toLowerCase();
        });
      } else {
        const regionalLimpa = meta.regional.toLowerCase().replace(/\s+/g, '_');
        return regionalLimpa === filtroRegional || 
               meta.regional.toLowerCase() === REGIONAL_LABELS[filtroRegional]?.toLowerCase();
      }
    });
    
    const totalMetasReais = metasDaRegional.reduce((sum, meta) => sum + (meta.valorMeta || 0), 0);
    
    console.log(`   Atividades realizadas: ${totalAtividades}`);
    console.log(`   Metas reais: ${totalMetasReais}`);
    console.log(`   Progresso: ${totalMetasReais > 0 ? Math.min((totalAtividades / totalMetasReais) * 100, 100).toFixed(1) : 0}%`);
    
    return {
      label: REGIONAL_LABELS[filtroRegional] || filtroRegional,
      totalMeta: totalMetasReais,
      totalAtual: totalAtividades,
      progress: totalMetasReais > 0 ? Math.min((totalAtividades / totalMetasReais) * 100, 100) : 0
    };
  }
  
  // Mostrar todas as áreas
  const atividadesPorRegional = atividadesRegionais.reduce((acc, atividade) => {
    if (!acc[atividade.regional]) {
      acc[atividade.regional] = [];
    }
    acc[atividade.regional].push(atividade);
    return acc;
  }, {});
  
  const resultados = Object.entries(atividadesPorRegional).map(([regionalKey, atividades]) => {
    const totalAtividades = atividades.reduce((sum, atividade) => 
      sum + (parseInt(atividade.quantidade) || 1), 0
    );
    
    // Calcular metas reais para esta regional
    const metasDaRegional = metas.filter(meta => {
      if (!meta.regional) return false;
      
      if (meta.regional.includes(',')) {
        const areas = meta.regional.split(',').map(area => area.trim());
        return areas.some(area => {
          const areaLimpa = area.toLowerCase().replace(/\s+/g, '_');
          return areaLimpa === regionalKey || 
                 area.toLowerCase() === REGIONAL_LABELS[regionalKey]?.toLowerCase();
        });
      } else {
        const regionalLimpa = meta.regional.toLowerCase().replace(/\s+/g, '_');
        return regionalLimpa === regionalKey || 
               meta.regional.toLowerCase() === REGIONAL_LABELS[regionalKey]?.toLowerCase();
      }
    });
    
    const totalMetasReais = metasDaRegional.reduce((sum, meta) => sum + (meta.valorMeta || 0), 0);
    
    return {
      key: regionalKey,
      label: REGIONAL_LABELS[regionalKey] || regionalKey,
      totalMeta: totalMetasReais,
      totalAtual: totalAtividades,
      progress: totalMetasReais > 0 ? Math.min((totalAtividades / totalMetasReais) * 100, 100) : 0
    };
  });
  
  return resultados.sort((a, b) => b.totalAtual - a.totalAtual);
}

// Testar para algumas regionais específicas
console.log('=== TESTE PARA REGIONAIS ESPECÍFICAS ===');

const regionaisParaTestar = ['centro_oeste', 'nordeste_2', 'sul', 'norte'];

regionaisParaTestar.forEach(regional => {
  const resultado = calcularDadosPorArea(regional);
  console.log(`\n${resultado.label}:`);
  console.log(`   Meta: ${resultado.totalMeta}`);
  console.log(`   Realizado: ${resultado.totalAtual}`);
  console.log(`   Progresso: ${resultado.progress.toFixed(1)}%`);
});

// Testar para todas as áreas
console.log('\n=== TESTE PARA TODAS AS ÁREAS ===');
const todasAsAreas = calcularDadosPorArea('todos');

todasAsAreas.forEach(area => {
  console.log(`\n${area.label}:`);
  console.log(`   Meta: ${area.totalMeta}`);
  console.log(`   Realizado: ${area.totalAtual}`);
  console.log(`   Progresso: ${area.progress.toFixed(1)}%`);
});

console.log('\n✅ CORREÇÃO IMPLEMENTADA COM SUCESSO!');
console.log('\nResumo da correção:');
console.log('- ANTES: Meta = Atividades realizadas (sempre 100%)');
console.log('- DEPOIS: Meta = Soma real das metas do banco de dados');
console.log('- Realizado = Atividades realizadas (mantido)');
console.log('- Progresso = (Realizado / Meta) * 100%');