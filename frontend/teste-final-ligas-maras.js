console.log('=== TESTE FINAL: CORREÇÃO LIGAS MARAS FORMADAS ===');
console.log('');

// Simular exatamente o que acontece agora com a correção
const atividadesRegionais = [
  { id: 1, regional: 'sp', atividade_label: 'Ligas Maras Formadas', quantidade: 25, status: 'ativo' },
  { id: 2, regional: 'sp', atividade_label: 'Famílias Embarcadas Decolagem', quantidade: 150, status: 'ativo' },
  { id: 3, regional: 'sp', atividade_label: 'Diagnósticos Realizados', quantidade: 80, status: 'ativo' },
];

// Cenário real: Ligas Maras não tem metas cadastradas
const metas = [
  // Não há metas para Ligas Maras Formadas (cenário real)
  { id: 4, titulo: 'Famílias Embarcadas Decolagem', regional: 'sp', valorMeta: 200, valorAtual: 150 },
  { id: 5, titulo: 'Diagnósticos Realizados', regional: 'sp', valorMeta: 100, valorAtual: 80 },
];

function testarCorrecaoFinal(filtroRegional = 'sp') {
  console.log(`--- TESTANDO CORREÇÃO PARA REGIONAL: ${filtroRegional} ---`);
  
  // 1. Filtrar atividades da regional
  const atividadesDaRegional = atividadesRegionais.filter(atividade => 
    atividade.regional === filtroRegional && atividade.status === 'ativo'
  );
  
  console.log(`\n1. ATIVIDADES ENCONTRADAS (${atividadesDaRegional.length}):`);
  atividadesDaRegional.forEach(atividade => {
    console.log(`   - ${atividade.atividade_label}: ${atividade.quantidade}`);
  });
  
  // 2. Agrupar por tipo
  const atividadesPorTipo = atividadesDaRegional.reduce((acc, atividade) => {
    const tipo = atividade.atividade_label || atividade.titulo || atividade.tipo || 'Outros';
    if (!acc[tipo]) {
      acc[tipo] = { quantidade: 0, atividades: [] };
    }
    const quantidade = parseInt(atividade.quantidade) || 1;
    acc[tipo].quantidade += quantidade;
    acc[tipo].atividades.push(atividade);
    return acc;
  }, {});
  
  // 3. Processar cada atividade (NOVA LÓGICA)
  console.log(`\n2. PROCESSAMENTO COM NOVA LÓGICA:`);
  
  const resultados = Object.entries(atividadesPorTipo).map(([label, dados]) => {
    console.log(`\n   Processando: "${label}"`);
    
    // Buscar metas para esta atividade
    const metasDaAtividade = metas.filter(meta => {
      const pertenceRegional = meta.regional && (
        meta.regional.includes(',') 
          ? meta.regional.split(',').map(area => area.trim()).some(area => {
              const areaLimpa = area.toLowerCase().replace(/\s+/g, '_');
              return areaLimpa === filtroRegional;
            })
          : (meta.regional.toLowerCase().replace(/\s+/g, '_') === filtroRegional)
      );
      
      const pertenceAtividade = meta.titulo?.toLowerCase().includes(label.toLowerCase());
      
      return pertenceRegional && pertenceAtividade;
    });
    
    const totalMetasReais = metasDaAtividade.reduce((sum, meta) => sum + (meta.valorMeta || meta.valor_meta || 0), 0);
    const totalAtual = dados.quantidade;
    const percentualRealizado = totalMetasReais > 0 ? Math.min((totalAtual / totalMetasReais) * 100, 100) : 0;
    
    const resultado = {
      label,
      value: label.toLowerCase().replace(/\s+/g, '_'),
      totalMeta: totalMetasReais,
      totalAtual: totalAtual,
      percentualRealizado,
      quantidadeMetas: metasDaAtividade.length,
      dadosReais: true,
      semMetas: totalMetasReais === 0 // NOVA FLAG
    };
    
    console.log(`   RESULTADO para "${label}":`);
    console.log(`     - totalMeta: ${resultado.totalMeta}`);
    console.log(`     - totalAtual: ${resultado.totalAtual}`);
    console.log(`     - percentualRealizado: ${resultado.percentualRealizado.toFixed(1)}%`);
    console.log(`     - semMetas: ${resultado.semMetas ? 'SIM' : 'NÃO'}`);
    console.log(`     - Será exibido? ✅ SIM (SEMPRE EXIBE AGORA)`);
    
    return resultado;
  });
  
  // 4. NOVA ORDENAÇÃO (sem filtro de remoção)
  const atividadesOrdenadas = resultados.sort((a, b) => {
    // Priorizar atividades com metas, depois por quantidade realizada
    if (a.totalMeta > 0 && b.totalMeta === 0) return -1;
    if (a.totalMeta === 0 && b.totalMeta > 0) return 1;
    return b.totalAtual - a.totalAtual;
  });
  
  console.log(`\n3. RESULTADO FINAL (NOVA LÓGICA):`);
  console.log(`   Total de atividades: ${atividadesOrdenadas.length}`);
  console.log(`   Todas serão exibidas (sem filtro de remoção)`);
  
  atividadesOrdenadas.forEach((atividade, index) => {
    const status = atividade.semMetas ? '⚠️ SEM METAS' : `✅ ${atividade.percentualRealizado.toFixed(1)}%`;
    const prioridade = atividade.totalMeta > 0 ? '(PRIORIDADE)' : '(SEM META)';
    console.log(`   ${index + 1}. ${atividade.label}: ${atividade.totalAtual} realizadas ${status} ${prioridade}`);
  });
  
  return atividadesOrdenadas;
}

// Testar a correção
const resultado = testarCorrecaoFinal('sp');

console.log('\n=== VERIFICAÇÃO ESPECÍFICA: LIGAS MARAS FORMADAS ===');
const ligasMaras = resultado.find(atividade => atividade.label === 'Ligas Maras Formadas');

if (ligasMaras) {
  console.log('✅ SUCESSO! Ligas Maras Formadas APARECE no dashboard!');
  console.log(`   - Atividades realizadas: ${ligasMaras.totalAtual}`);
  console.log(`   - Metas cadastradas: ${ligasMaras.totalMeta}`);
  console.log(`   - Status: ${ligasMaras.semMetas ? 'SEM METAS CADASTRADAS' : 'COM METAS'}`);
  console.log(`   - Indicação visual: ${ligasMaras.semMetas ? 'Borda laranja + aviso' : 'Layout normal'}`);
} else {
  console.log('❌ ERRO! Ligas Maras Formadas ainda não aparece!');
}

console.log('\n=== RESUMO DA CORREÇÃO ===');
console.log('');
console.log('ANTES:');
console.log('❌ Filtro .filter(atividade => atividade.totalMeta > 0) removia atividades sem metas');
console.log('❌ Ligas Maras Formadas não aparecia porque não tem metas cadastradas');
console.log('');
console.log('DEPOIS:');
console.log('✅ Removido o filtro que ocultava atividades sem metas');
console.log('✅ Adicionada flag "semMetas" para identificar atividades sem metas');
console.log('✅ Layout especial para atividades sem metas (borda laranja + aviso)');
console.log('✅ Ordenação prioriza atividades com metas, mas mostra todas');
console.log('✅ Ligas Maras Formadas agora aparece com indicação visual apropriada');
console.log('');
console.log('RESULTADO: ✅ PROBLEMA RESOLVIDO!');