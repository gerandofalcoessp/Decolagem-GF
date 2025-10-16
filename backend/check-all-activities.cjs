const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkAllActivities() {
  console.log('🔍 Verificando todas as atividades no banco...');
  
  const { data, error } = await supabase
    .from('regional_activities')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log('📊 Total de atividades encontradas:', data.length);
  
  // Agrupar por tipo
  const byType = {};
  data.forEach(activity => {
    const type = activity.type || 'sem_tipo';
    if (!byType[type]) byType[type] = [];
    byType[type].push(activity);
  });
  
  console.log('\n📋 Atividades por tipo:');
  Object.keys(byType).forEach(type => {
    console.log(`  ${type}: ${byType[type].length} atividades`);
  });
  
  // Mostrar as últimas 5 atividades
  console.log('\n🕒 Últimas 5 atividades:');
  data.slice(0, 5).forEach((activity, index) => {
    console.log(`\n${index + 1}. ${activity.title || 'Sem título'}`);
    console.log(`   Tipo: ${activity.type || 'N/A'}`);
    console.log(`   Regional: ${activity.regional || 'N/A'}`);
    console.log(`   Data: ${activity.created_at}`);
    console.log(`   ID: ${activity.id}`);
  });
}

checkAllActivities().catch(console.error);