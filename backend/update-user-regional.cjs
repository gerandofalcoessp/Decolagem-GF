const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateUserRegional() {
  try {
    console.log('🔧 Atualizando usuário teste com regional via SQL...');
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: "UPDATE members SET regional = 'sul' WHERE email = 'teste.regional@decolagem.com';"
    });
    
    if (error) {
      console.error('❌ Erro SQL:', error);
      return;
    }
    
    console.log('✅ Update SQL executado com sucesso');
    
    // Verificar se foi atualizado
    console.log('🔍 Verificando atualização...');
    
    const { data: checkData, error: checkError } = await supabase.rpc('exec_sql', {
      sql: "SELECT * FROM members WHERE email = 'teste.regional@decolagem.com';"
    });
    
    if (checkError) {
      console.error('❌ Erro ao verificar:', checkError);
      return;
    }
    
    console.log('📋 Dados atualizados:', JSON.stringify(checkData, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

updateUserRegional();