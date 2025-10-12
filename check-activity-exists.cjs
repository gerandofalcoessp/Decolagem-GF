const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActivityExists() {
  const activityId = '53f5180a-e52b-4abd-baf9-927e6b405e28';
  
  console.log(`🔍 Verificando se a atividade ${activityId} ainda existe no banco...`);
  
  try {
    // Verificar na tabela regional_activities
    const { data, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('id', activityId);
    
    if (error) {
      console.error('❌ Erro ao consultar banco:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('❌ PROBLEMA: Atividade ainda existe no banco!');
      console.log('📄 Dados da atividade:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('✅ Atividade foi removida do banco corretamente');
    }
    
    // Verificar também na tabela activities (caso exista)
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activityId);
    
    if (!activitiesError && activitiesData && activitiesData.length > 0) {
      console.log('❌ PROBLEMA: Atividade ainda existe na tabela activities!');
      console.log('📄 Dados da atividade (activities):', JSON.stringify(activitiesData[0], null, 2));
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkActivityExists();