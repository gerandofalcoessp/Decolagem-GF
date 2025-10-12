// Teste da normalização singular/plural

// Função para normalizar strings para matching
const normalizeString = (str) => {
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
const isStringMatch = (str1, str2) => {
  if (!str1 || !str2) return false;
  
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  console.log(`  Comparando: "${str1}" -> "${normalized1}"`);
  console.log(`             "${str2}" -> "${normalized2}"`);
  
  // Match exato
  if (normalized1 === normalized2) {
    console.log(`  ✅ Match exato!`);
    return true;
  }
  
  // Match bidirecional (uma contém a outra)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    console.log(`  ✅ Match bidirecional!`);
    return true;
  }
  
  // Match por palavras-chave (pelo menos 2 palavras em comum)
  const words1 = normalized1.split(' ').filter(w => w.length > 2);
  const words2 = normalized2.split(' ').filter(w => w.length > 2);
  
  if (words1.length >= 2 && words2.length >= 2) {
    const commonWords = words1.filter(word => words2.includes(word));
    if (commonWords.length >= 2) {
      console.log(`  ✅ Match por palavras-chave: [${commonWords.join(', ')}]`);
      return true;
    }
  }
  
  console.log(`  ❌ Sem match`);
  return false;
};

console.log('=== TESTE DE NORMALIZAÇÃO SINGULAR/PLURAL ===\n');

// Casos de teste específicos para Liga vs Ligas
const testCases = [
  {
    meta: 'Liga Maras Formadas',
    atividade: 'Ligas Maras Formadas',
    esperado: true
  },
  {
    meta: 'Ligas Maras Formadas',
    atividade: 'Liga Maras Formadas',
    esperado: true
  },
  {
    meta: 'Liga Mara Formadas',
    atividade: 'Ligas Maras Formadas',
    esperado: true
  },
  {
    meta: 'Famílias Embarcadas Decolagem',
    atividade: 'Família Embarcada Decolagem',
    esperado: true
  },
  {
    meta: 'Pessoa Atendida',
    atividade: 'Pessoas Atendidas',
    esperado: true
  },
  {
    meta: 'Atividade Realizada',
    atividade: 'Atividades Realizadas',
    esperado: true
  },
  {
    meta: 'Liga Maras Formadas',
    atividade: 'Famílias Embarcadas',
    esperado: false
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. TESTE: "${testCase.meta}" vs "${testCase.atividade}"`);
  console.log(`   Esperado: ${testCase.esperado ? '✅ Match' : '❌ Sem match'}`);
  
  const resultado = isStringMatch(testCase.meta, testCase.atividade);
  const sucesso = resultado === testCase.esperado;
  
  console.log(`   Resultado: ${resultado ? '✅ Match' : '❌ Sem match'}`);
  console.log(`   Status: ${sucesso ? '🎯 PASSOU' : '💥 FALHOU'}`);
});

console.log('\n=== RESUMO DOS TESTES ===');
const sucessos = testCases.filter((testCase, index) => {
  const resultado = isStringMatch(testCase.meta, testCase.atividade);
  return resultado === testCase.esperado;
}).length;

console.log(`✅ Testes que passaram: ${sucessos}/${testCases.length}`);
console.log(`❌ Testes que falharam: ${testCases.length - sucessos}/${testCases.length}`);

if (sucessos === testCases.length) {
  console.log('\n🎉 TODOS OS TESTES PASSARAM! A normalização está funcionando corretamente.');
} else {
  console.log('\n⚠️  Alguns testes falharam. Verifique a lógica de normalização.');
}