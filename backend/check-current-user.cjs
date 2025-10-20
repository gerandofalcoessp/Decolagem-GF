const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentUser() {
  try {
    console.log('🔍 Verificando usuário atual logado...\n');
    
    // Simular uma requisição com token (pegar do localStorage do frontend)
    // Vamos buscar o usuário que tem email flavioalmeidaf3@gmail.com que parece ser o de teste
    const testEmail = 'flavioalmeidaf3@gmail.com';
    
    console.log(`🔍 Buscando usuário com email: ${testEmail}`);
    
    // Buscar na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (usuarioError) {
      console.error('❌ Erro ao buscar usuário na tabela usuarios:', usuarioError);
      
      // Tentar buscar no Supabase Auth
      console.log('🔍 Tentando buscar no Supabase Auth...');
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('❌ Erro ao buscar usuários no Auth:', authError);
        return;
      }
      
      const authUser = authUsers.users.find(u => u.email === testEmail);
      if (authUser) {
        console.log('✅ Usuário encontrado no Supabase Auth:');
        console.log(`   ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log(`   Role (metadata): ${authUser.user_metadata?.role || 'N/A'}`);
        console.log(`   Nome (metadata): ${authUser.user_metadata?.nome || 'N/A'}`);
      } else {
        console.log('❌ Usuário não encontrado no Supabase Auth');
      }
      return;
    }
    
    console.log('✅ Usuário encontrado na tabela usuarios:');
    console.log('='.repeat(50));
    console.log(`ID: ${usuario.id}`);
    console.log(`Nome: ${usuario.nome}`);
    console.log(`Email: ${usuario.email}`);
    console.log(`Role/Permissão: ${usuario.role || usuario.permissao || 'N/A'}`);
    console.log(`Auth User ID: ${usuario.auth_user_id || 'N/A'}`);
    console.log(`Status: ${usuario.status || 'N/A'}`);
    console.log(`Regional: ${usuario.regional || 'N/A'}`);
    console.log(`Função: ${usuario.funcao || 'N/A'}`);
    
    // Verificar se tem permissão para criar atividades regionais
    const hasPermission = usuario.role === 'super_admin' || 
                         usuario.permissao === 'super_admin' ||
                         usuario.role === 'equipe_interna' || 
                         usuario.permissao === 'equipe_interna';
    
    console.log(`\n🔐 Tem permissão para criar atividades regionais: ${hasPermission ? '✅ SIM' : '❌ NÃO'}`);
    
    if (!hasPermission) {
      console.log('\n💡 SOLUÇÃO: O usuário precisa ter role "super_admin" ou "equipe_interna"');
      console.log('   Atualmente o usuário tem role:', usuario.role || usuario.permissao || 'user');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkCurrentUser();