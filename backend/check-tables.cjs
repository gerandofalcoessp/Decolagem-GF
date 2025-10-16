const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('🔍 Verificando tabelas disponíveis...');
  
  // Tentar diferentes tabelas de usuários
  const possibleUserTables = ['members', 'users', 'usuarios', 'user_profiles'];
  
  for (const tableName of possibleUserTables) {
    console.log(`\n📋 Verificando tabela: ${tableName}`);
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Erro na tabela ${tableName}:`, error.message);
      } else {
        console.log(`✅ Tabela ${tableName} encontrada!`);
        console.log(`   Registros encontrados: ${data ? data.length : 0}`);
        if (data && data.length > 0) {
          console.log('   Colunas disponíveis:', Object.keys(data[0]));
          console.log('   Primeiro registro:', data[0]);
        }
      }
    } catch (err) {
      console.log(`❌ Erro ao acessar ${tableName}:`, err.message);
    }
  }
  
  // Verificar também a tabela regional_activities para entender sua estrutura
  console.log('\n📋 Verificando estrutura da tabela regional_activities...');
  try {
    const { data, error } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Erro na tabela regional_activities:', error.message);
    } else {
      console.log('✅ Tabela regional_activities encontrada!');
      if (data && data.length > 0) {
        console.log('   Colunas disponíveis:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log('❌ Erro ao acessar regional_activities:', err.message);
  }
}

checkTables().catch(console.error);