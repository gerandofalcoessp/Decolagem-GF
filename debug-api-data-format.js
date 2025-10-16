// Debug script para verificar o formato exato dos dados da API
// e como eles devem ser processados pelo dashboard

console.log('🔍 Debug: Formato de dados da API vs Dashboard');
console.log('════════════════════════════════════════════════════════');

// Simular dados como retornados pela API /api/atividades
const apiResponse = {
  data: [
    {
      id: 1,
      titulo: "Atividade Famílias Embarcadas",
      descricao: "Descrição da atividade",
      activity_date: "2024-01-15",
      tipo: "Decolagem",
      atividade_label: "Famílias Embarcadas Decolagem",
      quantidade: 1500,
      regional: "SP",
      status: "completed",
      created_at: "2024-01-15T10:00:00Z",
      responsavel: { nome: "João Silva" }
    },
    {
      id: 2,
      titulo: "Mais Famílias Embarcadas",
      descricao: "Outra atividade",
      activity_date: "2024-01-16",
      tipo: "Decolagem",
      atividade_label: "Famílias Embarcadas Decolagem",
      quantidade: 2020,
      regional: "RJ",
      status: "completed",
      created_at: "2024-01-16T14:30:00Z",
      responsavel: { nome: "Maria Santos" }
    },
    {
      id: 3,
      titulo: "Outras Atividades",
      descricao: "Atividade diferente",
      activity_date: "2024-01-17",
      tipo: "Outro",
      atividade_label: "Outras Atividades",
      quantidade: 100,
      regional: "MG",
      status: "completed",
      created_at: "2024-01-17T09:15:00Z",
      responsavel: { nome: "Pedro Costa" }
    }
  ]
};

console.log('1. Dados simulados da API:');
console.log(`   ${apiResponse.data.length} registros`);
apiResponse.data.forEach((item, index) => {
  console.log(`   ${index + 1}. ID: ${item.id}, Label: "${item.atividade_label}", Qtd: ${item.quantidade}`);
});

// Simular o processamento do dashboard
console.log('\n2. Simulando processamento do dashboard...');

// Como o dashboard processa os dados (baseado no DashboardPage.tsx)
const activities = apiResponse.data; // useActivities retorna { data: [...] }
const activitiesArray = Array.isArray(activities) ? activities : [];

console.log(`   activitiesArray length: ${activitiesArray.length}`);

// Funções do dashboard (copiadas do DashboardPage.tsx)
const normalize = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const canonicalizeTokens = (str) => {
  const normalized = normalize(str);
  return normalized.split(' ').map(token => {
    if (token === 'familias') return 'familia';
    if (token === 'embarcadas') return 'embarcada';
    if (token === 'diagnosticos') return 'diagnostico';
    if (token === 'realizados') return 'realizado';
    if (token === 'formadas') return 'formada';
    if (token === 'ongs') return 'ong';
    return token;
  }).filter(Boolean);
};

const isStringMatch = (activityStr, targetLabel) => {
  const activityTokens = canonicalizeTokens(activityStr);
  const targetTokens = canonicalizeTokens(targetLabel);
  
  const programTokens = ['decolagem', 'maras'];
  const requiresProgramToken = targetTokens.some(t => programTokens.includes(t));
  const hasProgramToken = activityTokens.some(t => programTokens.includes(t));
  
  if (requiresProgramToken && !hasProgramToken) return false;
  
  const intersection = activityTokens.filter(t => targetTokens.includes(t));
  const requiredOverlap = Math.max(2, Math.floor(targetTokens.length * 0.6));
  
  return intersection.length >= requiredOverlap;
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
      // Lógica de data omitida para simplicidade
      return acc;
    }
    
    const qRaw = a.quantidade ?? a.qtd ?? 1;
    const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
    return acc + (isNaN(numQ) ? 1 : numQ);
  }, 0);
};

console.log('\n3. Testando sumActivitiesByLabels...');

const testLabels = ["Famílias Embarcadas Decolagem", "familias_embarcadas_decolagem"];
console.log(`\n   Testando labels: ${JSON.stringify(testLabels)}`);

activitiesArray.forEach(activity => {
  const match = testLabels.some(l => doesActivityMatch(activity, l));
  console.log(`   Atividade ID ${activity.id}: "${activity.atividade_label}" -> match: ${match}`);
  if (match) {
    console.log(`   -> Adicionando quantidade: ${activity.quantidade}`);
  }
});

const resultado = sumActivitiesByLabels(testLabels);
console.log(`\n🧮 Resultado final: ${resultado}`);

console.log('\n4. Verificando campos disponíveis...');
console.log('   Campos que doesActivityMatch verifica:');
activitiesArray.forEach(activity => {
  console.log(`   Atividade ${activity.id}:`);
  console.log(`     - atividade_label: "${activity.atividade_label}"`);
  console.log(`     - titulo: "${activity.titulo}"`);
  console.log(`     - tipo: "${activity.tipo}"`);
  console.log(`     - categoria: ${activity.categoria || 'undefined'}`);
});

console.log('\n✅ Debug concluído!');