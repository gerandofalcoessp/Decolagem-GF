console.log('=== VERIFICANDO DADOS DE LIGAS MARAS NO BANCO ===');
console.log('');

// Simular dados que deveriam estar no banco
const metasSimuladas = [
  // Metas de diferentes regionais
  { id: 1, titulo: 'Ligas Maras Formadas', regional: 'sp', valorMeta: 100, valorAtual: 80 },
  { id: 2, titulo: 'Famílias Embarcadas Decolagem', regional: 'sp', valorMeta: 500, valorAtual: 350 },
  { id: 3, titulo: 'Diagnósticos Realizados', regional: 'sp', valorMeta: 200, valorAtual: 150 },
  
  { id: 4, titulo: 'Ligas Maras Formadas', regional: 'rio_de_janeiro', valorMeta: 60, valorAtual: 60 },
  { id: 5, titulo: 'Famílias Embarcadas Decolagem', regional: 'rio_de_janeiro', valorMeta: 650, valorAtual: 650 },
  
  { id: 6, titulo: 'Ligas Maras Formadas', regional: 'nordeste_2', valorMeta: 50, valorAtual: 50 },
  { id: 7, titulo: 'Famílias Embarcadas Decolagem', regional: 'nordeste_2', valorMeta: 720, valorAtual: 720 },
  { id: 8, titulo: 'Diagnósticos Realizados', regional: 'nordeste_2', valorMeta: 350, valorAtual: 350 }
];

// Simular atividades regionais
const atividadesRegionais = [
  { id: 1, regional: 'sp', atividade_label: 'Ligas Maras Formadas', quantidade: 80, status: 'ativo' },
  { id: 2, regional: 'sp', atividade_label: 'Famílias Embarcadas Decolagem', quantidade: 350, status: 'ativo' },
  { id: 3, regional: 'sp', atividade_label: 'Diagnósticos Realizados', quantidade: 150, status: 'ativo' },
  
  { id: 4, regional: 'rio_de_janeiro', atividade_label: 'Ligas Maras Formadas', quantidade: 60, status: 'ativo' },
  { id: 5, regional: 'rio_de_janeiro', atividade_label: 'Famílias Embarcadas Decolagem', quantidade: 650, status: 'ativo' },
  
  { id: 6, regional: 'nordeste_2', atividade_label: 'Ligas Maras Formadas', quantidade: 50, status: 'ativo' },
  { id: 7, regional: 'nordeste_2', atividade_label: 'Famílias Embarcadas Decolagem', quantidade: 720, status: 'ativo' },
  { id: 8, regional: 'nordeste_2', atividade_label: 'Diagnósticos Realizados', quantidade: 350, status: 'ativo' }
];

const REGIONAL_LABELS = {
  'sp': 'São Paulo',
  'rio_de_janeiro': 'Rio de Janeiro',
  'nordeste_2': 'Nordeste 2'
};

function verificarLigasMaras(filtroRegional) {
  console.log(`\n--- VERIFICANDO LIGAS MARAS PARA: ${REGIONAL_LABELS[filtroRegional] || filtroRegional} ---`);
  
  // 1. Verificar se há atividades de Ligas Maras
  const atividadesLigasMaras = atividadesRegionais.filter(atividade => 
    atividade.regional === filtroRegional && 
    atividade.status === 'ativo' &&
    (atividade.atividade_label || '').toLowerCase().includes('ligas maras')
  );
  
  console.log(`Atividades de Ligas Maras encontradas: ${atividadesLigasMaras.length}`);
  atividadesLigasMaras.forEach(atividade => {
    console.log(`  - ${atividade.atividade_label}: ${atividade.quantidade}`);
  });
  
  // 2. Verificar se há metas de Ligas Maras
  const metasLigasMaras = metasSimuladas.filter(meta => {
    const pertenceRegional = meta.regional === filtroRegional;
    const pertenceAtividade = meta.titulo?.toLowerCase().includes('ligas maras');
    return pertenceRegional && pertenceAtividade;
  });
  
  console.log(`Metas de Ligas Maras encontradas: ${metasLigasMaras.length}`);
  metasLigasMaras.forEach(meta => {
    console.log(`  - ${meta.titulo}: Meta ${meta.valorMeta}, Atual ${meta.valorAtual}`);
  });
  
  // 3. Simular o que acontece na lógica atual
  if (atividadesLigasMaras.length > 0) {
    const totalAtividades = atividadesLigasMaras.reduce((sum, ativ) => sum + parseInt(ativ.quantidade), 0);
    const totalMetas = metasLigasMaras.reduce((sum, meta) => sum + (meta.valorMeta || 0), 0);
    
    console.log(`\nResultado da lógica atual:`);
    console.log(`  - Total de atividades realizadas: ${totalAtividades}`);
    console.log(`  - Total de metas no banco: ${totalMetas}`);
    console.log(`  - Card será exibido? ${totalMetas > 0 ? '✅ SIM' : '❌ NÃO (totalMeta = 0)'}`);
    
    if (totalMetas > 0) {
      const progresso = Math.min((totalAtividades / totalMetas) * 100, 100);
      console.log(`  - Progresso: ${progresso.toFixed(1)}%`);
    }
  } else {
    console.log(`\n❌ Nenhuma atividade de Ligas Maras encontrada para esta regional`);
  }
}

// Testar para diferentes regionais
verificarLigasMaras('sp');
verificarLigasMaras('rio_de_janeiro');
verificarLigasMaras('nordeste_2');

console.log('\n=== DIAGNÓSTICO ===');
console.log('');
console.log('POSSÍVEIS CAUSAS DO PROBLEMA:');
console.log('1. ❌ Não há metas de "Ligas Maras Formadas" cadastradas no banco para a regional selecionada');
console.log('2. ❌ O nome da atividade não está sendo encontrado corretamente (case sensitive ou diferenças de texto)');
console.log('3. ❌ A regional não está sendo filtrada corretamente');
console.log('4. ❌ O filtro .filter(atividade => atividade.totalMeta > 0) está removendo o card');
console.log('');
console.log('SOLUÇÕES POSSÍVEIS:');
console.log('1. ✅ Verificar se há metas cadastradas no banco real');
console.log('2. ✅ Melhorar a lógica de matching entre atividades e metas');
console.log('3. ✅ Remover ou ajustar o filtro que exige totalMeta > 0');
console.log('4. ✅ Mostrar atividades mesmo sem metas (com aviso)');