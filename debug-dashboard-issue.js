const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funções do dashboard para testar
function normalize(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeTokens(str) {
  const normalized = normalize(str);
  return normalized.split(' ').sort().join(' ');
}

function isStringMatch(str1, str2) {
  if (!str1 || !str2) return false;
  
  const canon1 = canonicalizeTokens(str1);
  const canon2 = canonicalizeTokens(str2);
  
  return canon1.includes(canon2) || canon2.includes(canon1);
}

function doesActivityMatch(activity, label) {
  const fieldsToCheck = [
    activity.atividade_label,
    activity.titulo,
    activity.tipo,
    activity.categoria
  ];
  
  return fieldsToCheck.some(field => isStringMatch(field, label));
}

async function investigateDashboardIssue() {
  try {
    console.log('🔍 Investigando problema do dashboard...\n');

    // 1. Buscar dados da tabela regional_activities
    console.log('📊 1. Buscando dados da tabela regional_activities...');
    const { data: regionalData, error: regionalError } = await supabase
      .from('regional_activities')
      .select('*')
      .ilike('title', '%famílias embarcadas decolagem%');

    if (regionalError) {
      console.error('❌ Erro ao buscar regional_activities:', regionalError);
    } else {
      console.log(`✅ Encontradas ${regionalData.length} atividades na tabela regional_activities`);
      
      if (regionalData.length > 0) {
        console.log('\n📋 Detalhes das atividades encontradas:');
        regionalData.forEach((activity, index) => {
          console.log(`\n${index + 1}. ID: ${activity.id}`);
          console.log(`   Title: ${activity.title}`);
          console.log(`   Type: ${activity.type}`);
          console.log(`   Quantidade: ${activity.quantidade}`);
          console.log(`   Regional: ${activity.regional}`);
          console.log(`   Status: ${activity.status}`);
          console.log(`   Data: ${activity.activity_date}`);
        });

        const totalRegional = regionalData.reduce((sum, activity) => {
          const quantidade = parseInt(activity.quantidade) || 0;
          return sum + quantidade;
        }, 0);
        console.log(`\n✅ Total regional_activities: ${totalRegional}`);
      }
    }

    // 2. Buscar dados da tabela atividades (se existir)
    console.log('\n📊 2. Buscando dados da tabela atividades...');
    const { data: atividadesData, error: atividadesError } = await supabase
      .from('atividades')
      .select('*')
      .or('atividade_label.ilike.%famílias embarcadas decolagem%,titulo.ilike.%famílias embarcadas decolagem%,tipo.ilike.%famílias embarcadas decolagem%');

    if (atividadesError) {
      console.log('ℹ️ Tabela atividades não encontrada ou erro:', atividadesError.message);
    } else {
      console.log(`✅ Encontradas ${atividadesData.length} atividades na tabela atividades`);
      
      if (atividadesData.length > 0) {
        console.log('\n📋 Detalhes das atividades encontradas:');
        atividadesData.forEach((activity, index) => {
          console.log(`\n${index + 1}. ID: ${activity.id}`);
          console.log(`   Atividade Label: ${activity.atividade_label}`);
          console.log(`   Título: ${activity.titulo}`);
          console.log(`   Tipo: ${activity.tipo}`);
          console.log(`   Quantidade: ${activity.quantidade || activity.qtd}`);
          console.log(`   Data: ${activity.data_atividade || activity.created_at}`);
        });

        const totalAtividades = atividadesData.reduce((sum, activity) => {
          const quantidade = parseInt(activity.quantidade || activity.qtd) || 1;
          return sum + quantidade;
        }, 0);
        console.log(`\n✅ Total atividades: ${totalAtividades}`);
      }
    }

    // 3. Testar a lógica de matching do dashboard
    console.log('\n🧪 3. Testando lógica de matching do dashboard...');
    
    const testLabels = ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem'];
    
    // Testar com dados da regional_activities
    if (regionalData && regionalData.length > 0) {
      console.log('\n🔍 Testando matching com dados regional_activities:');
      regionalData.forEach((activity, index) => {
        const testActivity = {
          atividade_label: activity.title,
          titulo: activity.title,
          tipo: activity.type,
          categoria: activity.type
        };
        
        testLabels.forEach(label => {
          const matches = doesActivityMatch(testActivity, label);
          console.log(`   Atividade ${index + 1} vs "${label}": ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
        });
      });
    }

    // Testar com dados da tabela atividades
    if (atividadesData && atividadesData.length > 0) {
      console.log('\n🔍 Testando matching com dados atividades:');
      atividadesData.forEach((activity, index) => {
        testLabels.forEach(label => {
          const matches = doesActivityMatch(activity, label);
          console.log(`   Atividade ${index + 1} vs "${label}": ${matches ? '✅ MATCH' : '❌ NO MATCH'}`);
        });
      });
    }

    console.log('\n🎯 Conclusão da investigação:');
    console.log('- Verifique se o useActivities hook está buscando da tabela correta');
    console.log('- Verifique se há filtros de data que estão excluindo as atividades');
    console.log('- Verifique se há filtros de regional que estão limitando os dados');

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
  }
}

investigateDashboardIssue();