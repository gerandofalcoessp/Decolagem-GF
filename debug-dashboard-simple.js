// Script para testar a lógica de cálculo do dashboard sem depender de conexões externas

console.log('🔍 Debug da lógica de cálculo do Dashboard - Famílias Embarcadas');
console.log('='.repeat(60));

// 1. Simular dados que o dashboard receberia (baseado nos dados reais que vimos)
console.log('\n1. Simulando dados que o dashboard receberia...');

const activitiesArray = [
  {
    id: 1,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 500,
    regional: 'sp',
    status: 'ativo'
  },
  {
    id: 2,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 300,
    regional: 'rj',
    status: 'ativo'
  },
  {
    id: 3,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 450,
    regional: 'mg',
    status: 'ativo'
  },
  {
    id: 4,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 200,
    regional: 'ba',
    status: 'ativo'
  },
  {
    id: 5,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 350,
    regional: 'pe',
    status: 'ativo'
  },
  {
    id: 6,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 280,
    regional: 'ce',
    status: 'ativo'
  },
  {
    id: 7,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 420,
    regional: 'pr',
    status: 'ativo'
  },
  {
    id: 8,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 380,
    regional: 'rs',
    status: 'ativo'
  },
  {
    id: 9,
    atividade_label: 'Famílias Embarcadas Decolagem',
    titulo: 'Famílias Embarcadas Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 690,
    regional: 'sc',
    status: 'ativo'
  },
  // Adicionar algumas atividades que NÃO devem fazer match
  {
    id: 10,
    atividade_label: 'Diagnósticos Realizados',
    titulo: 'Diagnósticos Realizados',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 100,
    regional: 'sp',
    status: 'ativo'
  },
  {
    id: 11,
    atividade_label: 'ONGs Decolagem',
    titulo: 'ONGs Decolagem',
    tipo: 'decolagem',
    categoria: null,
    quantidade: 50,
    regional: 'rj',
    status: 'ativo'
  }
];

console.log(`✅ Dados simulados: ${activitiesArray.length} atividades`);
console.log(`   - ${activitiesArray.filter(a => a.atividade_label === 'Famílias Embarcadas Decolagem').length} com label "Famílias Embarcadas Decolagem"`);

// 2. Implementar as funções exatas do dashboard
console.log('\n2. Implementando funções do dashboard...');

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

const canonicalizeTokens = (s) => {
  const na = normalize(s).replace(/[^a-z0-9]+/g, ' ');
  const rawTokens = na.split(/\s+/).filter(Boolean);
  return rawTokens.map(t => {
    let tok = t;
    // singularizar básico
    if (tok.endsWith('s')) tok = tok.slice(0, -1);
    // mapeamentos de sinônimos comuns
    const map = {
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
};

const isStringMatch = (a, b) => {
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
};

const doesActivityMatch = (activity, label) => {
  const fields = [
    activity.atividade_label,
    activity.titulo,
    activity.tipo,
    activity.categoria
  ].filter(Boolean);
  return fields.some(f => isStringMatch(f, label));
};

const sumActivitiesByLabels = (labels, options = {}) => {
  return activitiesArray.reduce((acc, a) => {
    const match = labels.some(l => doesActivityMatch(a, l));
    if (!match) return acc;
    if (options.todayOnly) {
      // Buscar a melhor data disponível na atividade
      const activityDate = a.activity_date || a.data_inicio || a.created_at || a.data || a.date;
      if (!isSameDay(activityDate)) return acc;
    }
    // Quantidade pode vir como string ou número e com diferentes nomes de campo
    const qRaw = a.quantidade ?? a.qtd ?? 1;
    const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
    return acc + (isNaN(numQ) ? 1 : numQ);
  }, 0);
};

// 3. Testar o cálculo exato do dashboard
console.log('\n3. Testando cálculo exato do dashboard...');
const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
console.log(`Labels de teste: ${JSON.stringify(testLabels)}`);

// Debug detalhado de cada atividade
console.log('\n4. Debug detalhado de cada atividade:');
let matchingActivities = [];
let totalSum = 0;

activitiesArray.forEach((activity, index) => {
  const match = testLabels.some(l => doesActivityMatch(activity, l));
  
  console.log(`  Atividade ${index + 1} (ID: ${activity.id}):`);
  console.log(`    Label: "${activity.atividade_label}"`);
  console.log(`    Match: ${match ? '✅ SIM' : '❌ NÃO'}`);
  
  if (match) {
    const qRaw = activity.quantidade ?? activity.qtd ?? 1;
    const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
    const quantidade = isNaN(numQ) ? 1 : numQ;
    
    matchingActivities.push({
      index: index + 1,
      id: activity.id,
      atividade_label: activity.atividade_label,
      quantidade: quantidade,
      regional: activity.regional
    });
    
    totalSum += quantidade;
    
    console.log(`    ✅ Adicionando quantidade: ${quantidade}`);
    console.log(`    Regional: ${activity.regional}`);
  }
  console.log('');
});

// 5. Resultado final usando a função do dashboard
const familiasEmbarcadasRealizado = sumActivitiesByLabels(testLabels);

console.log('\n5. Resultado final:');
console.log(`🧮 Soma manual: ${totalSum}`);
console.log(`🧮 sumActivitiesByLabels: ${familiasEmbarcadasRealizado}`);
console.log(`📊 Total de atividades que fazem match: ${matchingActivities.length}`);

// 6. Verificar se há diferença entre os cálculos
if (totalSum === familiasEmbarcadasRealizado) {
  console.log('✅ Cálculos consistentes!');
} else {
  console.log('❌ Diferença entre cálculos!');
}

// 7. Testar diferentes cenários
console.log('\n6. Testando diferentes cenários:');

// Cenário 1: Array vazio
console.log('\n   Cenário 1: Array vazio');
const emptyResult = [].reduce((acc, a) => {
  const match = testLabels.some(l => doesActivityMatch(a, l));
  if (!match) return acc;
  const qRaw = a.quantidade ?? a.qtd ?? 1;
  const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
  return acc + (isNaN(numQ) ? 1 : numQ);
}, 0);
console.log(`   Resultado com array vazio: ${emptyResult}`);

// Cenário 2: Dados com estrutura diferente (como pode vir da API)
console.log('\n   Cenário 2: Dados com estrutura { data: [...] }');
const apiLikeData = { data: activitiesArray };
const processedArray = Array.isArray(apiLikeData) 
  ? apiLikeData 
  : Array.isArray(apiLikeData?.data) 
    ? apiLikeData.data
    : [];
console.log(`   Array processado tem ${processedArray.length} itens`);

// Cenário 3: Verificar se o problema pode estar no matching
console.log('\n   Cenário 3: Debug do string matching');
const targetLabel = 'Famílias Embarcadas Decolagem';
const targetTokens = canonicalizeTokens(targetLabel);
console.log(`   Target label: "${targetLabel}"`);
console.log(`   Target tokens: ${JSON.stringify(targetTokens)}`);

const testActivity = activitiesArray[0];
const activityTokens = canonicalizeTokens(testActivity.atividade_label);
console.log(`   Activity label: "${testActivity.atividade_label}"`);
console.log(`   Activity tokens: ${JSON.stringify(activityTokens)}`);
console.log(`   Match result: ${isStringMatch(testActivity.atividade_label, targetLabel)}`);

console.log('\n✅ Debug concluído!');
console.log('\n📋 Resumo:');
console.log(`   - Total esperado: ${totalSum}`);
console.log(`   - Função dashboard: ${familiasEmbarcadasRealizado}`);
console.log(`   - Status: ${totalSum === familiasEmbarcadasRealizado ? 'CORRETO' : 'INCORRETO'}`);