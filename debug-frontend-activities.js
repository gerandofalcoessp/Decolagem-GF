const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Funções do dashboard
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

function sumActivitiesByLabels(activitiesArray, labels) {
  return activitiesArray.reduce((acc, a) => {
    const match = labels.some(l => doesActivityMatch(a, l));
    if (!match) return acc;
    
    const qRaw = a.quantidade ?? a.qtd ?? 1;
    const numQ = typeof qRaw === 'number' ? qRaw : parseFloat(String(qRaw));
    return acc + (isNaN(numQ) ? 1 : numQ);
  }, 0);
}

async function debugFrontendActivities() {
  try {
    console.log('🔍 Debugando dados que chegam no frontend...\n');

    // 1. Simular o que o useActivities faz - buscar de /api/atividades
    console.log('📊 1. Testando endpoint /api/atividades...');
    try {
      const atividadesResponse = await fetch('http://localhost:3001/api/atividades');
      if (atividadesResponse.ok) {
        const atividadesData = await atividadesResponse.json();
        console.log(`✅ Endpoint /api/atividades retornou ${atividadesData.length} atividades`);
        
        const familiasAtividades = atividadesData.filter(activity => 
          doesActivityMatch(activity, 'Famílias Embarcadas Decolagem')
        );
        
        console.log(`👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas Decolagem" em /api/atividades: ${familiasAtividades.length}`);
        
        if (familiasAtividades.length > 0) {
          const total = sumActivitiesByLabels(atividadesData, ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem']);
          console.log(`✅ Total calculado: ${total}`);
        }
      } else {
        console.log(`❌ Endpoint /api/atividades falhou: ${atividadesResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar /api/atividades: ${error.message}`);
    }

    // 2. Simular o que o useActivities faz - buscar de /api/regional-activities
    console.log('\n📊 2. Testando endpoint /api/regional-activities...');
    try {
      const regionalResponse = await fetch('http://localhost:3001/api/regional-activities');
      if (regionalResponse.ok) {
        const regionalData = await regionalResponse.json();
        console.log(`✅ Endpoint /api/regional-activities retornou ${regionalData.length} atividades`);
        
        const familiasRegionais = regionalData.filter(activity => 
          doesActivityMatch(activity, 'Famílias Embarcadas Decolagem')
        );
        
        console.log(`👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas Decolagem" em /api/regional-activities: ${familiasRegionais.length}`);
        
        if (familiasRegionais.length > 0) {
          console.log('\n📋 Detalhes das atividades encontradas:');
          familiasRegionais.forEach((activity, index) => {
            console.log(`\n${index + 1}. ID: ${activity.id}`);
            console.log(`   Título: ${activity.titulo}`);
            console.log(`   Tipo: ${activity.tipo}`);
            console.log(`   Quantidade: ${activity.quantidade}`);
            console.log(`   Regional: ${activity.regional}`);
            console.log(`   Status: ${activity.status}`);
            console.log(`   Data: ${activity.data_inicio}`);
          });

          const total = sumActivitiesByLabels(regionalData, ['Famílias Embarcadas Decolagem', 'familias_embarcadas_decolagem']);
          console.log(`\n✅ Total calculado: ${total}`);
        }
      } else {
        console.log(`❌ Endpoint /api/regional-activities falhou: ${regionalResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao acessar /api/regional-activities: ${error.message}`);
    }

    // 3. Verificar dados diretamente no Supabase (como o backend faz)
    console.log('\n📊 3. Verificando dados direto no Supabase...');
    const { data: supabaseData, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo');

    if (error) {
      console.error('❌ Erro ao buscar do Supabase:', error);
    } else {
      console.log(`✅ Supabase retornou ${supabaseData.length} atividades ativas`);
      
      const familiasSupabase = supabaseData.filter(activity => {
        // Mapear campos do Supabase para formato do frontend
        const mappedActivity = {
          atividade_label: activity.title,
          titulo: activity.title,
          tipo: activity.type,
          categoria: activity.type
        };
        return doesActivityMatch(mappedActivity, 'Famílias Embarcadas Decolagem');
      });
      
      console.log(`👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas Decolagem" no Supabase: ${familiasSupabase.length}`);
      
      if (familiasSupabase.length > 0) {
        const totalSupabase = familiasSupabase.reduce((sum, activity) => {
          const quantidade = parseInt(activity.quantidade) || 1;
          return sum + quantidade;
        }, 0);
        console.log(`✅ Total no Supabase: ${totalSupabase}`);
      }
    }

    console.log('\n🎯 Conclusão:');
    console.log('- Se os endpoints retornarem 0 atividades, o problema está no backend');
    console.log('- Se o Supabase tem dados mas os endpoints não, há problema na API');
    console.log('- Se todos têm dados mas o dashboard mostra 0, há problema no frontend');

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugFrontendActivities();