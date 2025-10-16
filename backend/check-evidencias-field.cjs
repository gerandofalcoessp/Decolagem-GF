const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvidenciasField() {
  try {
    console.log('🔍 Verificando campo evidencias...');
    
    const { data: activities, error } = await supabase
      .from('regional_activities')
      .select('id, title, evidences')
      .limit(5);

    if (error) {
      console.error('❌ Erro:', error);
      return;
    }

    console.log('📊 Atividades encontradas:', activities.length);
    
    activities.forEach((activity, index) => {
      console.log(`\n--- Atividade ${index + 1} ---`);
      console.log(`ID: ${activity.id}`);
      console.log(`Título: ${activity.title}`);
      console.log(`evidences: ${JSON.stringify(activity.evidences)} (tipo: ${typeof activity.evidences})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkEvidenciasField();