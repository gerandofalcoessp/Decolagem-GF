const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUserData() {
  try {
    console.log('🔍 Verificando usuários no sistema...');
    
    const { data: users, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('📊 Total de usuários encontrados:', users.length);
    
    if (users.length > 0) {
      console.log('\n👥 Usuários encontrados:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Nome: ${user.nome || 'N/A'}`);
        console.log(`   - Regional: ${user.regional || 'N/A'}`);
        console.log(`   - Função: ${user.funcao || 'N/A'}`);
        console.log(`   - Permissão: ${user.permissao || 'N/A'}`);
        console.log(`   - Ativo: ${user.ativo}`);
        console.log('');
      });
      
      // Verificar especificamente usuários da regional Nordeste 2
      const nordesteUsers = users.filter(u => u.regional === 'nordeste_2' || u.regional === 'Nordeste 2');
      console.log('🔍 Usuários da regional Nordeste 2:', nordesteUsers.length);
      nordesteUsers.forEach(user => {
        console.log(`   - ${user.email} (regional: ${user.regional})`);
      });
      
    } else {
      console.log('❌ Nenhum usuário encontrado na tabela usuarios');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkUserData();