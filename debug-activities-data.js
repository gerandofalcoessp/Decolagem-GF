const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Funções de normalização e matching do dashboard
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function canonicalizeTokens(str) {
  return normalize(str).split(/\s+/).sort().join(' ');
}

function isStringMatch(haystack, needle) {
  if (!haystack || !needle) return false;
  const normalizedHaystack = normalize(haystack);
  const normalizedNeedle = normalize(needle);
  
  if (normalizedHaystack.includes(normalizedNeedle)) return true;
  
  const haystackTokens = canonicalizeTokens(haystack);
  const needleTokens = canonicalizeTokens(needle);
  
  return haystackTokens.includes(needleTokens) || needleTokens.includes(haystackTokens);
}

function doesActivityMatch(activity, label) {
  const fields = [
    activity.atividade_label,
    activity.titulo,
    activity.tipo,
    activity.categoria
  ].filter(Boolean);
  
  return fields.some(field => isStringMatch(field, label));
}

async function debugActivitiesData() {
  try {
    console.log('🔍 Debugando dados de atividades...\n');
    
    // 1. Verificar dados diretos do Supabase
    console.log('1. Consultando dados diretos do Supabase:');
    const { data: supabaseData, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo');
    
    if (error) {
      console.error('❌ Erro ao consultar Supabase:', error);
      return;
    }
    
    console.log(`✅ Total de atividades ativas no Supabase: ${supabaseData.length}`);
    
    // 2. Filtrar atividades de "Famílias Embarcadas Decolagem"
    const familiasActivities = supabaseData.filter(activity => 
      doesActivityMatch(activity, 'Famílias Embarcadas Decolagem') ||
      doesActivityMatch(activity, 'familias_embarcadas_decolagem')
    );
    
    console.log(`✅ Atividades "Famílias Embarcadas Decolagem" encontradas: ${familiasActivities.length}`);
    
    if (familiasActivities.length > 0) {
      console.log('\n📊 Detalhes das atividades encontradas:');
      familiasActivities.forEach((activity, index) => {
        console.log(`${index + 1}. ID: ${activity.id}`);
        console.log(`   Label: ${activity.atividade_label}`);
        console.log(`   Título: ${activity.titulo}`);
        console.log(`   Quantidade: ${activity.quantidade}`);
        console.log(`   Regional: ${activity.regional}`);
        console.log(`   Data: ${activity.activity_date || activity.created_at}`);
        console.log('');
      });
      
      // 3. Calcular total como o dashboard faria
      const total = familiasActivities.reduce((sum, activity) => {
        const qRaw = activity.quantidade ?? activity.qtd ?? 1;
        const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
        const quantidade = isNaN(numQ) ? 1 : numQ;
        console.log(`   Somando: ${quantidade} (raw: ${qRaw})`);
        return sum + quantidade;
      }, 0);
      
      console.log(`🎯 Total calculado: ${total}`);
    }
    
    // 4. Simular o que o useActivities hook retornaria
    console.log('\n2. Simulando dados do useActivities hook:');
    
    // Verificar se existe tabela atividades também
    const { data: atividadesData, error: atividadesError } = await supabase
      .from('atividades')
      .select('*')
      .eq('status', 'ativo');
    
    if (atividadesError) {
      console.log('⚠️  Tabela "atividades" não encontrada ou erro:', atividadesError.message);
    } else {
      console.log(`✅ Atividades da tabela "atividades": ${atividadesData.length}`);
      
      const familiasAtividades = atividadesData.filter(activity => 
        doesActivityMatch(activity, 'Famílias Embarcadas Decolagem') ||
        doesActivityMatch(activity, 'familias_embarcadas_decolagem')
      );
      
      console.log(`✅ "Famílias Embarcadas" na tabela atividades: ${familiasAtividades.length}`);
    }
    
    // 5. Testar diferentes variações do label
    console.log('\n3. Testando diferentes variações do label:');
    const testLabels = [
      'Famílias Embarcadas Decolagem',
      'familias_embarcadas_decolagem',
      'Familias Embarcadas Decolagem',
      'familias embarcadas decolagem',
      'FAMÍLIAS EMBARCADAS DECOLAGEM'
    ];
    
    testLabels.forEach(label => {
      const matches = supabaseData.filter(activity => doesActivityMatch(activity, label));
      console.log(`   "${label}": ${matches.length} matches`);
    });
    
    console.log('\n✅ Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante debug:', error);
  }
}

debugActivitiesData();