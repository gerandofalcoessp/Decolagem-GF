const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSuperAdmin() {
  console.log('🔍 Verificando super admin no Supabase Auth...\n');
  
  try {
    // 1. Listar todos os usuários do Auth
    console.log('1. 📋 Listando usuários do Supabase Auth...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message);
      return;
    }

    console.log(`✅ Total de usuários encontrados: ${authUsers.users.length}`);
    
    // Procurar por usuários com email relacionado ao super admin
    const adminUsers = authUsers.users.filter(user => 
      user.email?.includes('admin') || 
      user.email?.includes('superadmin') ||
      user.user_metadata?.role === 'super_admin'
    );

    console.log('\n📋 Usuários admin encontrados:');
    adminUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
      console.log(`   Metadata:`, user.user_metadata);
      console.log('');
    });

    // 2. Tentar login com diferentes credenciais
    console.log('2. 🔑 Testando credenciais de login...\n');
    
    const credentials = [
      { email: 'superadmin@decolagem.com', password: 'SuperAdmin2024!' },
      { email: 'superadmin@decolagem.com', password: 'SuperAdmin123!' },
      { email: 'admin@decolagem.com', password: 'SuperAdmin2024!' },
      { email: 'admin@decolagem.com', password: 'admin123' }
    ];

    for (const cred of credentials) {
      console.log(`Testando: ${cred.email} / ${cred.password}`);
      
      try {
        const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
          email: cred.email,
          password: cred.password
        });

        if (loginError) {
          console.log(`❌ Falhou: ${loginError.message}`);
        } else {
          console.log(`✅ SUCESSO! Login realizado com sucesso`);
          console.log(`   Token: ${loginData.session?.access_token ? 'Obtido' : 'Não obtido'}`);
          console.log(`   Usuário: ${loginData.user?.email}`);
          console.log(`   Metadata: ${JSON.stringify(loginData.user?.user_metadata)}`);
          
          // Fazer logout para próximo teste
          await supabaseAdmin.auth.signOut();
          break;
        }
      } catch (err) {
        console.log(`❌ Erro: ${err.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

checkSuperAdmin();