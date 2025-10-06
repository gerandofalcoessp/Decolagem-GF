const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 Testando conectividade com Supabase...');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Definido' : 'Não definido');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Definido' : 'Não definido');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  console.log('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testDatabase() {
  try {
    console.log('🔄 Testando conexão básica...');
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);
    
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
      return;
    }
    
    console.log('✅ Conexão com banco estabelecida');
    
    // Testar tabelas principais
    const tables = ['usuarios', 'members', 'goals'];
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
          
        if (error) {
          console.log(`❌ Erro na tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: ${count || 0} registros`);
        }
      } catch (err) {
        console.log(`❌ Erro ao acessar tabela ${table}: ${err.message}`);
      }
    }
    
    // Testar estrutura das tabelas
    console.log('\n🔍 Verificando estrutura das tabelas...');
    
    // Verificar goals
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .limit(1);
        
      if (goalsError) {
        console.log('❌ Erro ao verificar estrutura de goals:', goalsError.message);
      } else {
        console.log('✅ Estrutura de goals:', goalsData.length > 0 ? Object.keys(goalsData[0]) : 'Tabela vazia');
      }
    } catch (err) {
      console.log('❌ Erro na verificação de goals:', err.message);
    }
    
    // Verificar members
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('members')
        .select('*')
        .limit(1);
        
      if (membersError) {
        console.log('❌ Erro ao verificar estrutura de members:', membersError.message);
      } else {
        console.log('✅ Estrutura de members:', membersData.length > 0 ? Object.keys(membersData[0]) : 'Tabela vazia');
      }
    } catch (err) {
      console.log('❌ Erro na verificação de members:', err.message);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

testDatabase();