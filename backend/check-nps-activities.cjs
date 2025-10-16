const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkNPSActivities() {
  console.log('🔍 Verificando atividades NPS no banco...');
  
  const { data, error } = await supabase
    .from('regional_activities')
    .select('*')
    .eq('type', 'NPS')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Erro:', error);
    return;
  }
  
  console.log('📊 Total de atividades NPS encontradas:', data.length);
  
  data.forEach((activity, index) => {
    console.log(`\n📋 Atividade ${index + 1}:`);
    console.log('  ID:', activity.id);
    console.log('  Título:', activity.title);
    console.log('  Regional:', activity.regional);
    console.log('  Tipo:', activity.type);
    console.log('  Data criação:', activity.created_at);
    console.log('  Responsável ID:', activity.responsavel_id);
  });
}

checkNPSActivities().catch(console.error);