const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUsuarios() {
  console.log('🔍 Verificando estrutura da tabela usuarios...');
  
  // Verificar estrutura da tabela
  const { data: columns, error: colError } = await supabase
    .from('usuarios')
    .select('*')
    .limit(1);
    
  if (colError) {
    console.error('❌ Erro ao consultar usuarios:', colError);
    return;
  }
  
  console.log('📋 Estrutura da tabela usuarios (primeiro registro):');
  if (columns && columns.length > 0) {
    console.log('Colunas disponíveis:', Object.keys(columns[0]));
    console.log('Primeiro registro:', columns[0]);
  }
  
  // Buscar o usuário específico
  const targetId = 'eddf1178-9567-45a8-af78-b3e8375f733e';
  console.log(`\n🔍 Buscando usuário ${targetId}...`);
  
  const { data: byAuthId, error: authError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', targetId);
    
  console.log('Por auth_user_id:', byAuthId);
  
  const { data: byId, error: idError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', targetId);
    
  console.log('Por id:', byId);
  
  // Listar todos os usuários para debug
  console.log('\n📋 Todos os usuários na tabela:');
  const { data: allUsers, error: allError } = await supabase
    .from('usuarios')
    .select('id, auth_user_id, nome, email')
    .limit(10);
    
  if (allUsers) {
    allUsers.forEach(user => {
      console.log(`- ID: ${user.id}, Auth ID: ${user.auth_user_id}, Nome: ${user.nome}, Email: ${user.email}`);
    });
  }
}

checkUsuarios().catch(console.error);