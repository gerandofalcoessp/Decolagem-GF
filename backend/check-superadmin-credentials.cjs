const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSuperAdminCredentials() {
  console.log('🔍 Verificando credenciais do super admin...\n');
  
  try {
    // 1. Verificar se o usuário existe na tabela usuarios
    console.log('1. 📋 Verificando usuário na tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', 'superadmin@decolagem.com');

    if (usuariosError) {
      console.error('❌ Erro ao buscar na tabela usuarios:', usuariosError.message);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('❌ Usuário não encontrado na tabela usuarios');
    } else {
      console.log('✅ Usuário encontrado na tabela usuarios:');
      console.log('   Email:', usuarios[0].email);
      console.log('   Nome:', usuarios[0].nome);
      console.log('   Role:', usuarios[0].role);
      console.log('   Status:', usuarios[0].status);
      console.log('   ID:', usuarios[0].id);
    }

    // 2. Verificar se o usuário existe no Supabase Auth
    console.log('\n2. 🔐 Verificando usuário no Supabase Auth...');
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao listar usuários do Auth:', authError.message);
      return;
    }

    const superAdminAuth = authUsers.users.find(user => user.email === 'superadmin@decolagem.com');
    
    if (!superAdminAuth) {
      console.log('❌ Usuário não encontrado no Supabase Auth');
    } else {
      console.log('✅ Usuário encontrado no Supabase Auth:');
      console.log('   Email:', superAdminAuth.email);
      console.log('   ID:', superAdminAuth.id);
      console.log('   Email confirmado:', superAdminAuth.email_confirmed_at ? 'Sim' : 'Não');
      console.log('   Criado em:', new Date(superAdminAuth.created_at).toLocaleString('pt-BR'));
      console.log('   Metadata:', JSON.stringify(superAdminAuth.user_metadata, null, 2));
    }

    // 3. Tentar fazer login com as credenciais
    console.log('\n3. 🔑 Testando login com credenciais...');
    
    const credentials = [
      { email: 'superadmin@decolagem.com', password: 'SuperAdmin2024!' },
      { email: 'superadmin@decolagem.com', password: 'SuperAdmin123!' },
      { email: 'superadmin@decolagem.com', password: 'Admin@123' },
      { email: 'admin@decolagem.com', password: 'SuperAdmin2024!' }
    ];

    for (const cred of credentials) {
      console.log(`   Testando: ${cred.email} / ${cred.password}`);
      
      const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });

      if (loginError) {
        console.log(`   ❌ Falhou: ${loginError.message}`);
      } else {
        console.log(`   ✅ Sucesso! Token obtido: ${loginData.session?.access_token ? 'Sim' : 'Não'}`);
        console.log(`   👤 Usuário: ${loginData.user?.email}`);
        
        // Fazer logout para próximo teste
        await supabaseAdmin.auth.signOut();
        break;
      }
    }

    // 4. Verificar se existe na tabela members
    console.log('\n4. 👥 Verificando usuário na tabela members...');
    const { data: members, error: membersError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('email', 'superadmin@decolagem.com');

    if (membersError) {
      console.error('❌ Erro ao buscar na tabela members:', membersError.message);
    } else if (!members || members.length === 0) {
      console.log('❌ Usuário não encontrado na tabela members');
    } else {
      console.log('✅ Usuário encontrado na tabela members:');
      console.log('   Email:', members[0].email);
      console.log('   Nome:', members[0].name);
      console.log('   ID:', members[0].id);
      console.log('   Auth User ID:', members[0].auth_user_id);
    }

  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

checkSuperAdminCredentials();