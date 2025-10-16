// Simple debug using our known working data
console.log('🔍 DEBUG SIMPLE DATA CHECK - FAMÍLIAS EMBARCADAS DECOLAGEM');
console.log('═══════════════════════════════════════════════════════════════\n');

// Use the data we know exists from our previous successful query
const sampleActivitiesData = [
  {
    id: 1,
    titulo: "Famílias Embarcadas Decolagem - Regional Norte",
    atividade_label: "Famílias Embarcadas Decolagem",
    quantidade: 500,
    regional: "Norte",
    status: "ativo",
    tipo: "decolagem"
  },
  {
    id: 2,
    titulo: "Famílias Embarcadas Decolagem - Regional Sul",
    atividade_label: "Famílias Embarcadas Decolagem",
    quantidade: 800,
    regional: "Sul",
    status: "ativo",
    tipo: "decolagem"
  },
  {
    id: 3,
    titulo: "Outras Atividades",
    atividade_label: "Outras Atividades",
    quantidade: 100,
    regional: "Centro",
    status: "ativo",
    tipo: "outros"
  }
];

console.log('1. Dados de teste simulando o que vem da API:');
console.log(`   ${sampleActivitiesData.length} registros`);
sampleActivitiesData.forEach((item, i) => {
  console.log(`   ${i + 1}. ID: ${item.id}, Label: "${item.atividade_label}", Qtd: ${item.quantidade}`);
});

// Simulate dashboard processing
console.log('\n2. Simulando processamento do dashboard...');

// Convert to activitiesArray (like dashboard does)
const activitiesArray = Array.isArray(sampleActivitiesData) ? sampleActivitiesData : [];
console.log(`   activitiesArray length: ${activitiesArray.length}`);

// Implement the exact dashboard logic
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
  console.log(`\n   Testando labels: ${JSON.stringify(labels)}`);
  
  return activitiesArray.reduce((acc, a) => {
    const match = labels.some(l => doesActivityMatch(a, l));
    console.log(`   Atividade ID ${a.id}: "${a.atividade_label}" -> match: ${match}`);
    
    if (!match) return acc;
    
    if (options.todayOnly) {
      // Buscar a melhor data disponível na atividade
      const activityDate = a.activity_date || a.data_inicio || a.created_at || a.data || a.date;
      if (!isSameDay(activityDate)) return acc;
    }
    
    // Quantidade pode vir como string ou número e com diferentes nomes de campo
    const qRaw = a.quantidade ?? a.qtd ?? 1;
    const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
    const finalQ = isNaN(numQ) ? 1 : numQ;
    
    console.log(`   -> Adicionando quantidade: ${finalQ}`);
    return acc + finalQ;
  }, 0);
};

// Test with the exact labels from dashboard
console.log('\n3. Testando sumActivitiesByLabels...');
const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
const result = sumActivitiesByLabels(testLabels);

console.log(`\n🧮 Resultado final: ${result}`);

// Test individual string matching
console.log('\n4. Debug detalhado do string matching...');
const targetLabel = 'Famílias Embarcadas Decolagem';
const targetTokens = canonicalizeTokens(targetLabel);
console.log(`   Target label: "${targetLabel}"`);
console.log(`   Target tokens: ${JSON.stringify(targetTokens)}`);

sampleActivitiesData.forEach(activity => {
  console.log(`\n   Testando atividade: "${activity.atividade_label}"`);
  const activityTokens = canonicalizeTokens(activity.atividade_label);
  console.log(`   Activity tokens: ${JSON.stringify(activityTokens)}`);
  
  const matches = isStringMatch(activity.atividade_label, targetLabel);
  console.log(`   Match result: ${matches}`);
  
  // Debug the matching process
  const ta = canonicalizeTokens(activity.atividade_label);
  const tb = canonicalizeTokens(targetLabel);
  const setA = new Set(ta);
  const inter = tb.filter(x => setA.has(x));
  const requireProgramToken = tb.includes('decolagem') || tb.includes('maras');
  const hasProgramToken = inter.includes('decolagem') || inter.includes('maras');
  const requiredOverlap = Math.min(tb.length, 2);
  
  console.log(`   Intersection: ${JSON.stringify(inter)}`);
  console.log(`   Requires program token: ${requireProgramToken}`);
  console.log(`   Has program token: ${hasProgramToken}`);
  console.log(`   Required overlap: ${requiredOverlap}`);
  console.log(`   Actual overlap: ${inter.length}`);
});

console.log('\n✅ Debug concluído!');