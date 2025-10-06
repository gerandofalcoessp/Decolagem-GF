const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCurrentUserData() {
  try {
    console.log('🔍 Verificando dados do usuário na tabela usuarios...');
    
    // Buscar todos os usuários na tabela usuarios
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar usuários:', error);
      return;
    }
    
    console.log('📊 Total de usuários na tabela usuarios:', usuarios.length);
    
    if (usuarios.length > 0) {
      console.log('\n👥 Usuários encontrados:');
      usuarios.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   - funcao: ${user.funcao || 'N/A'}`);
        console.log(`   - permissao: ${user.permissao || 'N/A'}`);
        console.log(`   - role: ${user.role || 'N/A'}`);
        console.log(`   - regional: ${user.regional || 'N/A'}`);
        console.log(`   - ativo: ${user.ativo}`);
        console.log('');
      });
    } else {
      console.log('❌ Nenhum usuário encontrado na tabela usuarios');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkCurrentUserData();