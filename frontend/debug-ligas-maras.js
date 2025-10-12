console.log('=== DEBUG: POR QUE LIGAS MARAS NÃO APARECE ===');
console.log('');

// Simular dados reais baseados no que vimos no código
const atividadesRegionais = [
  { id: 1, regional: 'sp', atividade_label: 'Ligas Maras Formadas', quantidade: 25, status: 'ativo' },
  { id: 2, regional: 'sp', atividade_label: 'Famílias Embarcadas Decolagem', quantidade: 150, status: 'ativo' },
  { id: 3, regional: 'sp', atividade_label: 'Diagnósticos Realizados', quantidade: 80, status: 'ativo' },
];

const metas = [
  // Cenário 1: Meta com título exato
  { id: 1, titulo: 'Ligas Maras Formadas', regional: 'sp', valorMeta: 50, valorAtual: 25 },
  
  // Cenário 2: Meta com título similar mas não exato
  { id: 2, titulo: 'Formação de Ligas Maras', regional: 'sp', valorMeta: 30, valorAtual: 15 },
  
  // Cenário 3: Meta com título diferente
  { id: 3, titulo: 'Liga de Mães Maras', regional: 'sp', valorMeta: 40, valorAtual: 20 },
  
  // Outras metas
  { id: 4, titulo: 'Famílias Embarcadas Decolagem', regional: 'sp', valorMeta: 200, valorAtual: 150 },
  { id: 5, titulo: 'Diagnósticos Realizados', regional: 'sp', valorMeta: 100, valorAtual: 80 },
];

const REGIONAL_LABELS = {
  'sp': 'São Paulo',
  'rio_de_janeiro': 'Rio de Janeiro',
  'nordeste_2': 'Nordeste 2'
};

function debugLigasMaras(filtroRegional = 'sp') {
  console.log(`\n--- SIMULANDO LÓGICA PARA REGIONAL: ${REGIONAL_LABELS[filtroRegional]} ---`);
  
  // 1. Filtrar atividades da regional
  const atividadesDaRegional = atividadesRegionais.filter(atividade => 
    atividade.regional === filtroRegional && atividade.status === 'ativo'
  );
  
  console.log(`\n1. ATIVIDADES DA REGIONAL (${atividadesDaRegional.length}):`);
  atividadesDaRegional.forEach(atividade => {
    console.log(`   - ${atividade.atividade_label}: ${atividade.quantidade}`);
  });
  
  // 2. Agrupar por tipo de atividade
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
  }, {});
  
  console.log(`\n2. ATIVIDADES AGRUPADAS POR TIPO:`);
  Object.entries(atividadesPorTipo).forEach(([tipo, dados]) => {
    console.log(`   - ${tipo}: ${dados.quantidade} (${dados.atividades.length} registros)`);
  });
  
  // 3. Para cada tipo, buscar metas correspondentes
  console.log(`\n3. BUSCA DE METAS PARA CADA ATIVIDADE:`);
  
  const resultados = Object.entries(atividadesPorTipo).map(([label, dados]) => {
    console.log(`\n   Processando: "${label}"`);
    
    // Buscar metas reais para esta atividade e regional
    const metasDaAtividade = metas.filter(meta => {
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
      
      console.log(`     Meta "${meta.titulo}": regional=${meta.regional}, pertenceRegional=${pertenceRegional}`);
      
      // Verificar se a meta corresponde à atividade
      const pertenceAtividade = meta.titulo?.toLowerCase().includes(label.toLowerCase()) ||
                               meta.descricao?.toLowerCase().includes(label.toLowerCase()) ||
                               meta.nome?.toLowerCase().includes(label.toLowerCase());
      
      console.log(`     Meta "${meta.titulo}": pertenceAtividade=${pertenceAtividade} (busca por "${label.toLowerCase()}")`);
      
      const resultado = pertenceRegional && pertenceAtividade;
      console.log(`     Meta "${meta.titulo}": RESULTADO FINAL = ${resultado}`);
      
      return resultado;
    });
    
    console.log(`   Metas encontradas para "${label}": ${metasDaAtividade.length}`);
    metasDaAtividade.forEach(meta => {
      console.log(`     - ${meta.titulo}: Meta ${meta.valorMeta}, Atual ${meta.valorAtual}`);
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
      dadosReais: true
    };
    
    console.log(`   RESULTADO para "${label}":`);
    console.log(`     - totalMeta: ${resultado.totalMeta}`);
    console.log(`     - totalAtual: ${resultado.totalAtual}`);
    console.log(`     - percentualRealizado: ${resultado.percentualRealizado.toFixed(1)}%`);
    console.log(`     - quantidadeMetas: ${resultado.quantidadeMetas}`);
    console.log(`     - Será exibido? ${resultado.totalMeta > 0 ? '✅ SIM' : '❌ NÃO (totalMeta = 0)'}`);
    
    return resultado;
  });
  
  // 4. Aplicar filtro que remove atividades sem metas
  const atividadesFiltradas = resultados.filter(atividade => atividade.totalMeta > 0);
  
  console.log(`\n4. RESULTADO FINAL APÓS FILTRO:`);
  console.log(`   Total de atividades processadas: ${resultados.length}`);
  console.log(`   Atividades que passaram no filtro: ${atividadesFiltradas.length}`);
  
  atividadesFiltradas.forEach(atividade => {
    console.log(`   ✅ ${atividade.label}: ${atividade.totalAtual}/${atividade.totalMeta} (${atividade.percentualRealizado.toFixed(1)}%)`);
  });
  
  const atividadesRemovidasPeloFiltro = resultados.filter(atividade => atividade.totalMeta === 0);
  if (atividadesRemovidasPeloFiltro.length > 0) {
    console.log(`\n   Atividades REMOVIDAS pelo filtro (totalMeta = 0):`);
    atividadesRemovidasPeloFiltro.forEach(atividade => {
      console.log(`   ❌ ${atividade.label}: ${atividade.totalAtual} atividades realizadas, mas 0 metas cadastradas`);
    });
  }
  
  return atividadesFiltradas;
}

// Testar diferentes cenários
console.log('=== CENÁRIO 1: METAS COM TÍTULOS EXATOS ===');
debugLigasMaras('sp');

console.log('\n\n=== CENÁRIO 2: TESTANDO DIFERENTES VARIAÇÕES DE TÍTULO ===');
console.log('Títulos de metas disponíveis:');
metas.forEach((meta, index) => {
  console.log(`  ${index + 1}. "${meta.titulo}"`);
});

console.log('\nTeste de matching para "Ligas Maras Formadas":');
const labelTeste = 'Ligas Maras Formadas';
metas.forEach(meta => {
  const match1 = meta.titulo?.toLowerCase().includes(labelTeste.toLowerCase());
  const match2 = meta.descricao?.toLowerCase().includes(labelTeste.toLowerCase());
  const match3 = meta.nome?.toLowerCase().includes(labelTeste.toLowerCase());
  const matchFinal = match1 || match2 || match3;
  
  console.log(`  "${meta.titulo}": ${matchFinal ? '✅' : '❌'} (titulo: ${match1}, descricao: ${match2}, nome: ${match3})`);
});

console.log('\n=== DIAGNÓSTICO FINAL ===');
console.log('');
console.log('POSSÍVEIS CAUSAS DO PROBLEMA:');
console.log('1. ❌ Não há metas cadastradas no banco com título que contenha "Ligas Maras"');
console.log('2. ❌ O matching de título está muito restritivo (case sensitive ou palavras diferentes)');
console.log('3. ❌ A regional da meta não está sendo reconhecida corretamente');
console.log('4. ❌ O filtro .filter(atividade => atividade.totalMeta > 0) está removendo o card');
console.log('');
console.log('SOLUÇÕES:');
console.log('1. ✅ Verificar se há metas de "Ligas Maras" no banco real');
console.log('2. ✅ Melhorar o matching para ser mais flexível (busca parcial, ignore case)');
console.log('3. ✅ Verificar se a regional está sendo mapeada corretamente');
console.log('4. ✅ Temporariamente mostrar atividades mesmo sem metas (com aviso)');