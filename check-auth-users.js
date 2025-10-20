require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthUsers() {
  console.log('🔍 Verificando usuários no sistema de autenticação...\n');

  try {
    // 1. Listar usuários de autenticação
    console.log('1. Listando usuários de autenticação...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao listar usuários de autenticação:', authError);
      return;
    }

    console.log('👥 Total de usuários de autenticação:', authUsers.users.length);

    if (authUsers.users.length > 0) {
      console.log('\n📋 Usuários de autenticação:');
      authUsers.users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`);
        console.log(`   Último login: ${user.last_sign_in_at || 'Nunca'}`);
        console.log(`   Criado em: ${user.created_at}`);
        console.log(`   Metadata:`, user.user_metadata);
        console.log('');
      });
    }

    // 2. Tentar login com usuários conhecidos
    console.log('2. Testando login com usuários conhecidos...');
    
    const testCredentials = [
      { email: 'coord.regional.sp@gerandofalcoes.com', password: 'Teste123!' },
      { email: 'erika.miranda@gerandofalcoes.com', password: 'Teste123!' },
      { email: 'admin@gerandofalcoes.com', password: 'admin123' },
      { email: 'teste@decolagem.com', password: 'Teste123!' }
    ];

    for (const cred of testCredentials) {
      console.log(`\n🔑 Testando login: ${cred.email}`);
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });

      if (loginError) {
        console.log(`   ❌ Erro: ${loginError.message}`);
      } else {
        console.log(`   ✅ Login bem-sucedido!`);
        console.log(`   👤 Usuário: ${loginData.user.email}`);
        console.log(`   🎫 Token presente: ${!!loginData.session?.access_token}`);
        
        // Fazer logout imediatamente
        await supabase.auth.signOut();
      }
    }

    // 3. Verificar se há usuários na tabela members sem auth correspondente
    console.log('\n3. Verificando correspondência entre members e auth...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, name, nome, email, auth_user_id');

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }

    console.log('👥 Total de members:', members.length);

    const authUserIds = authUsers.users.map(u => u.id);
    const membersWithoutAuth = members.filter(m => m.auth_user_id && !authUserIds.includes(m.auth_user_id));
    const membersWithAuth = members.filter(m => m.auth_user_id && authUserIds.includes(m.auth_user_id));

    console.log('✅ Members com auth válido:', membersWithAuth.length);
    console.log('❌ Members com auth inválido:', membersWithoutAuth.length);

    if (membersWithAuth.length > 0) {
      console.log('\n📋 Members com auth válido:');
      membersWithAuth.forEach((member, index) => {
        const authUser = authUsers.users.find(u => u.id === member.auth_user_id);
        console.log(`${index + 1}. ${member.name || member.nome} (${member.email})`);
        console.log(`   Auth User ID: ${member.auth_user_id}`);
        console.log(`   Auth Email: ${authUser?.email}`);
        console.log('');
      });
    }

    if (membersWithoutAuth.length > 0) {
      console.log('\n⚠️ Members com auth inválido:');
      membersWithoutAuth.forEach((member, index) => {
        console.log(`${index + 1}. ${member.name || member.nome} (${member.email})`);
        console.log(`   Auth User ID inválido: ${member.auth_user_id}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
checkAuthUsers();