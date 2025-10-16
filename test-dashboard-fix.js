// Test script para verificar se o fix do dashboard está funcionando
// Simula o comportamento corrigido do dashboard

console.log('🧪 Testando o fix do dashboard...');
console.log('════════════════════════════════════════════════════════');

// Simular dados como retornados pela API useActivities
const apiResponseFromUseActivities = {
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

console.log('1. Dados simulados do useActivities:');
console.log(`   Estrutura: { data: [...] } com ${apiResponseFromUseActivities.data.length} registros`);

// Simular o processamento ANTES do fix (comportamento antigo - INCORRETO)
console.log('\n2. Comportamento ANTES do fix (incorreto):');
const activities_old = apiResponseFromUseActivities; // useActivities retorna { data: [...] }
const activitiesArray_old = Array.isArray(activities_old) ? activities_old : [];
console.log(`   activitiesArray_old length: ${activitiesArray_old.length} (INCORRETO - deveria ser 3)`);

// Simular o processamento DEPOIS do fix (comportamento novo - CORRETO)
console.log('\n3. Comportamento DEPOIS do fix (correto):');
const activities_new = apiResponseFromUseActivities; // useActivities retorna { data: [...] }
const activitiesArray_new = Array.isArray(activities_new) 
  ? activities_new
  : Array.isArray(activities_new?.data) 
    ? activities_new.data
    : [];
console.log(`   activitiesArray_new length: ${activitiesArray_new.length} (CORRETO)`);

// Funções do dashboard (copiadas do DashboardPage.tsx)
const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
const canonicalizeTokens = (s) => {
  const na = normalize(s).replace(/[^a-z0-9]+/g, ' ');
  const rawTokens = na.split(/\s+/).filter(Boolean);
  return rawTokens.map(token => {
    if (token === 'familias') return 'familia';
    if (token === 'embarcadas') return 'embarcada';
    if (token === 'diagnosticos') return 'diagnostico';
    if (token === 'realizados') return 'realizado';
    if (token === 'formadas') return 'formada';
    if (token === 'ongs') return 'ong';
    return token;
  });
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

const sumActivitiesByLabels = (activitiesArray, labels, options = {}) => {
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

console.log('\n4. Testando sumActivitiesByLabels...');

const testLabels = ["Famílias Embarcadas Decolagem", "familias_embarcadas_decolagem"];

// Teste com dados ANTES do fix (incorreto)
const resultado_old = sumActivitiesByLabels(activitiesArray_old, testLabels);
console.log(`   Resultado ANTES do fix: ${resultado_old} (INCORRETO)`);

// Teste com dados DEPOIS do fix (correto)
const resultado_new = sumActivitiesByLabels(activitiesArray_new, testLabels);
console.log(`   Resultado DEPOIS do fix: ${resultado_new} (CORRETO)`);

console.log('\n5. Verificação detalhada:');
activitiesArray_new.forEach(activity => {
  const match = testLabels.some(l => doesActivityMatch(activity, l));
  console.log(`   Atividade ID ${activity.id}: "${activity.atividade_label}" -> match: ${match}`);
  if (match) {
    console.log(`     -> Quantidade: ${activity.quantidade}`);
  }
});

console.log(`\n🎯 Resultado final esperado: ${resultado_new}`);
console.log(resultado_new === 3520 ? '✅ Fix funcionou corretamente!' : '❌ Fix precisa de ajustes');
console.log('\n✅ Teste concluído!');