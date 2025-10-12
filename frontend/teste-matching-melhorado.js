// Script para testar o matching melhorado
console.log('=== TESTE DO MATCHING MELHORADO ===\n');

// Função para normalizar strings para matching
const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\w\s]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, ' ') // Normaliza espaços
    .trim();
};

// Função para verificar se duas strings fazem match
const isStringMatch = (str1, str2) => {
  if (!str1 || !str2) return false;
  
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  console.log(`    Comparando: "${normalized1}" vs "${normalized2}"`);
  
  // Match exato
  if (normalized1 === normalized2) {
    console.log(`    ✅ Match exato`);
    return true;
  }
  
  // Match bidirecional (uma contém a outra)
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    console.log(`    ✅ Match bidirecional`);
    return true;
  }
  
  // Match por palavras-chave (pelo menos 2 palavras em comum)
  const words1 = normalized1.split(' ').filter(w => w.length > 2);
  const words2 = normalized2.split(' ').filter(w => w.length > 2);
  
  if (words1.length >= 2 && words2.length >= 2) {
    const commonWords = words1.filter(word => words2.includes(word));
    console.log(`    Palavras em comum: [${commonWords.join(', ')}]`);
    if (commonWords.length >= 2) {
      console.log(`    ✅ Match por palavras-chave (${commonWords.length} palavras)`);
      return true;
    }
  }
  
  console.log(`    ❌ Sem match`);
  return false;
};

// Função melhorada para verificar matching de atividade
const isActivityMatch = (meta, activityLabel) => {
  const metaFields = [
    meta.titulo,
    meta.descricao,
    meta.nome,
    meta.atividade_tipo,
    meta.categoria
  ].filter(Boolean);
  
  console.log(`  Testando atividade: "${activityLabel}"`);
  console.log(`  Campos da meta: [${metaFields.join(', ')}]`);
  
  return metaFields.some(field => {
    console.log(`    Campo: "${field}"`);
    return isStringMatch(field, activityLabel);
  });
};

// Dados de teste
const metasTeste = [
  {
    titulo: "Ligas Maras Formadas",
    regional: "sp",
    valorMeta: 50
  },
  {
    titulo: "Liga de Maras",
    regional: "sp", 
    valorMeta: 30
  },
  {
    titulo: "Formação de Ligas Maras",
    regional: "sp",
    valorMeta: 40
  },
  {
    titulo: "Famílias Embarcadas Decolagem",
    regional: "sp",
    valorMeta: 200
  }
];

const atividadesTeste = [
  "Ligas Maras Formadas",
  "Liga Maras",
  "Maras Formadas",
  "Formação Ligas",
  "Famílias Embarcadas Decolagem"
];

console.log('1. TESTANDO MATCHING MELHORADO:\n');

atividadesTeste.forEach((atividade, index) => {
  console.log(`${index + 1}. ATIVIDADE: "${atividade}"`);
  
  const metasEncontradas = metasTeste.filter(meta => {
    console.log(`  Meta: "${meta.titulo}"`);
    const match = isActivityMatch(meta, atividade);
    console.log(`  Resultado: ${match ? '✅ MATCH' : '❌ NO MATCH'}\n`);
    return match;
  });
  
  console.log(`  TOTAL DE METAS ENCONTRADAS: ${metasEncontradas.length}`);
  metasEncontradas.forEach(meta => {
    console.log(`    - "${meta.titulo}" (Meta: ${meta.valorMeta})`);
  });
  console.log('');
});

console.log('2. CASOS ESPECÍFICOS PARA LIGAS MARAS:\n');

const casosLigasMaras = [
  { meta: "Ligas Maras Formadas", atividade: "Ligas Maras Formadas" },
  { meta: "Liga de Maras", atividade: "Ligas Maras Formadas" },
  { meta: "Formação de Ligas Maras", atividade: "Ligas Maras Formadas" },
  { meta: "Ligas Maras", atividade: "Ligas Maras Formadas" },
  { meta: "Maras - Ligas", atividade: "Ligas Maras Formadas" }
];

casosLigasMaras.forEach((caso, index) => {
  console.log(`${index + 1}. Meta: "${caso.meta}" vs Atividade: "${caso.atividade}"`);
  const match = isStringMatch(caso.meta, caso.atividade);
  console.log(`   Resultado: ${match ? '✅ MATCH' : '❌ NO MATCH'}\n`);
});

console.log('=== TESTE CONCLUÍDO ===');