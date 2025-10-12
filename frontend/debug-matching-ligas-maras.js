console.log('=== DEBUG: MATCHING DE METAS PARA LIGAS MARAS ===\n');

// Simular dados reais baseados no que vemos no app
const metasSimuladas = [
  {
    id: 1,
    titulo: 'Ligas Maras Formadas',
    regional: 'sp',
    valorMeta: 50,
    valor_meta: 50,
    status: 'ativo'
  },
  {
    id: 2,
    titulo: 'Liga Maras Formadas',
    regional: 'São Paulo',
    valorMeta: 30,
    valor_meta: 30,
    status: 'ativo'
  },
  {
    id: 3,
    titulo: 'Formação de Ligas Maras',
    regional: 'sp',
    valorMeta: 25,
    valor_meta: 25,
    status: 'ativo'
  },
  {
    id: 4,
    titulo: 'Famílias Embarcadas Decolagem',
    regional: 'sp',
    valorMeta: 200,
    valor_meta: 200,
    status: 'ativo'
  }
];

const atividadesSimuladas = [
  {
    id: 1,
    atividade_label: 'Ligas Maras Formadas',
    regional: 'sp',
    quantidade: 25,
    status: 'ativo'
  },
  {
    id: 2,
    atividade_label: 'Famílias Embarcadas Decolagem',
    regional: 'sp',
    quantidade: 150,
    status: 'ativo'
  }
];

const REGIONAL_LABELS = {
  'sp': 'São Paulo',
  'rj': 'Rio de Janeiro',
  'nordeste1': 'Nordeste 1',
  'nordeste2': 'Nordeste 2',
  'centro_oeste': 'Centro-Oeste'
};

function debugMatching(filtroRegional = 'sp') {
  console.log(`--- TESTANDO MATCHING PARA REGIONAL: ${filtroRegional} ---\n`);
  
  // 1. Filtrar atividades da regional
  const atividadesDaRegional = atividadesSimuladas.filter(atividade => 
    atividade.regional === filtroRegional && atividade.status === 'ativo'
  );
  
  console.log('1. ATIVIDADES DA REGIONAL:');
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
  
  console.log('\n2. ATIVIDADES AGRUPADAS:');
  Object.entries(atividadesPorTipo).forEach(([tipo, dados]) => {
    console.log(`   - ${tipo}: ${dados.quantidade} (${dados.atividades.length} registros)`);
  });
  
  // 3. Para cada atividade, buscar metas correspondentes
  console.log('\n3. MATCHING DE METAS:');
  
  const resultados = Object.entries(atividadesPorTipo).map(([label, dados]) => {
    console.log(`\n   Processando atividade: "${label}"`);
    
    // Lógica atual de matching
    const metasDaAtividade = metasSimuladas.filter(meta => {
      console.log(`     Testando meta: "${meta.titulo}" (regional: "${meta.regional}")`);
      
      // Verificar se a meta corresponde à regional
      const pertenceRegional = meta.regional && (
        meta.regional.includes(',') 
          ? meta.regional.split(',').map(area => area.trim()).some(area => {
              const areaLimpa = area.toLowerCase().replace(/\s+/g, '_');
              const match1 = areaLimpa === filtroRegional;
              const match2 = area.toLowerCase() === REGIONAL_LABELS[filtroRegional]?.toLowerCase();
              console.log(`       Regional check: "${area}" -> areaLimpa="${areaLimpa}", match1=${match1}, match2=${match2}`);
              return match1 || match2;
            })
          : (() => {
              const areaLimpa = meta.regional.toLowerCase().replace(/\s+/g, '_');
              const match1 = areaLimpa === filtroRegional;
              const match2 = meta.regional.toLowerCase() === REGIONAL_LABELS[filtroRegional]?.toLowerCase();
              console.log(`       Regional check: "${meta.regional}" -> areaLimpa="${areaLimpa}", match1=${match1}, match2=${match2}`);
              return match1 || match2;
            })()
      );
      
      // Verificar se a meta corresponde à atividade
      const match1 = meta.titulo?.toLowerCase().includes(label.toLowerCase());
      const match2 = meta.descricao?.toLowerCase().includes(label.toLowerCase());
      const match3 = meta.nome?.toLowerCase().includes(label.toLowerCase());
      
      console.log(`       Atividade check: titulo="${meta.titulo?.toLowerCase()}" includes "${label.toLowerCase()}" = ${match1}`);
      console.log(`       Atividade check: descricao="${meta.descricao?.toLowerCase()}" includes "${label.toLowerCase()}" = ${match2}`);
      console.log(`       Atividade check: nome="${meta.nome?.toLowerCase()}" includes "${label.toLowerCase()}" = ${match3}`);
      
      const pertenceAtividade = match1 || match2 || match3;
      
      const finalMatch = pertenceRegional && pertenceAtividade;
      console.log(`       RESULTADO: pertenceRegional=${pertenceRegional} && pertenceAtividade=${pertenceAtividade} = ${finalMatch}`);
      
      return finalMatch;
    });
    
    console.log(`     METAS ENCONTRADAS: ${metasDaAtividade.length}`);
    metasDaAtividade.forEach((meta, index) => {
      console.log(`       ${index + 1}. "${meta.titulo}" - Meta: ${meta.valorMeta || meta.valor_meta}`);
    });
    
    const totalMetasReais = metasDaAtividade.reduce((sum, meta) => sum + (meta.valorMeta || meta.valor_meta || 0), 0);
    const totalAtual = dados.quantidade;
    const percentualRealizado = totalMetasReais > 0 ? Math.min((totalAtual / totalMetasReais) * 100, 100) : 0;
    
    const resultado = {
      label,
      totalMeta: totalMetasReais,
      totalAtual: totalAtual,
      percentualRealizado,
      quantidadeMetas: metasDaAtividade.length,
      semMetas: totalMetasReais === 0
    };
    
    console.log(`     RESULTADO FINAL:`);
    console.log(`       - totalMeta: ${resultado.totalMeta}`);
    console.log(`       - totalAtual: ${resultado.totalAtual}`);
    console.log(`       - percentualRealizado: ${resultado.percentualRealizado.toFixed(1)}%`);
    console.log(`       - semMetas: ${resultado.semMetas}`);
    
    return resultado;
  });
  
  console.log('\n4. RESUMO FINAL:');
  resultados.forEach((resultado, index) => {
    const status = resultado.semMetas ? '❌ SEM METAS' : `✅ ${resultado.percentualRealizado.toFixed(1)}%`;
    console.log(`   ${index + 1}. ${resultado.label}: ${resultado.totalAtual}/${resultado.totalMeta} ${status}`);
  });
  
  return resultados;
}

// Testar diferentes cenários
console.log('=== CENÁRIO 1: DADOS SIMULADOS ATUAIS ===');
const resultado1 = debugMatching('sp');

console.log('\n=== CENÁRIO 2: TESTANDO VARIAÇÕES DE NOME ===');

// Testar com diferentes nomes de metas
const metasVariadas = [
  { titulo: 'Ligas Maras Formadas', regional: 'sp', valorMeta: 50 },
  { titulo: 'Liga Maras Formadas', regional: 'sp', valorMeta: 30 },
  { titulo: 'Formação de Ligas Maras', regional: 'sp', valorMeta: 25 },
  { titulo: 'Ligas de Maras', regional: 'sp', valorMeta: 20 },
  { titulo: 'Maras - Ligas Formadas', regional: 'sp', valorMeta: 15 }
];

const labelAtividade = 'Ligas Maras Formadas';

console.log(`\nTestando matching para atividade: "${labelAtividade}"`);

metasVariadas.forEach((meta, index) => {
  const match = meta.titulo?.toLowerCase().includes(labelAtividade.toLowerCase());
  console.log(`${index + 1}. "${meta.titulo}" -> Match: ${match ? '✅' : '❌'}`);
});

console.log('\n=== POSSÍVEIS PROBLEMAS IDENTIFICADOS ===');
console.log('1. ❓ Matching muito restritivo - só funciona se o título da meta contém exatamente o nome da atividade');
console.log('2. ❓ Problemas de case sensitivity ou caracteres especiais');
console.log('3. ❓ Diferenças entre nomes no banco vs. interface');
console.log('4. ❓ Problemas de matching regional (sp vs São Paulo)');
console.log('5. ❓ Metas podem estar com status inativo ou em regional diferente');

console.log('\n=== SOLUÇÕES SUGERIDAS ===');
console.log('1. ✅ Implementar matching bidirecional (meta.titulo includes atividade E atividade includes meta.titulo)');
console.log('2. ✅ Normalizar strings (remover acentos, espaços extras, etc.)');
console.log('3. ✅ Adicionar logs detalhados no frontend para debug');
console.log('4. ✅ Verificar dados reais no banco de dados');
console.log('5. ✅ Implementar matching por palavras-chave além do matching exato');