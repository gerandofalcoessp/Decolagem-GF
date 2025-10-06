const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDocuments() {
  try {
    console.log('🔍 Verificando estrutura dos documentos...');
    
    const { data, error } = await supabase
      .from('instituicoes')
      .select('id, nome, documentos')
      .not('documentos', 'is', null)
      .limit(5);
    
    if (error) {
      console.error('❌ Erro:', error);
      return;
    }
    
    console.log('📊 Instituições com documentos:');
    data.forEach(inst => {
      console.log(`\n🏢 ${inst.nome} (${inst.id})`);
      console.log('📄 Documentos:', JSON.stringify(inst.documentos, null, 2));
    });
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkDocuments();