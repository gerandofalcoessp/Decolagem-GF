const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testWithRealUser() {
  console.log('🧪 Testando com usuário real...\n');
  
  try {
    // Usar um dos usuários reais que existem
    const testEmail = 'leo.martins@gerandofalcoes.com';
    
    console.log(`🔍 Buscando dados do usuário ${testEmail}...`);
    
    // Buscar usuário no Supabase Auth
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError);
      return;
    }

    const user = users.users.find(u => u.email === testEmail);
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado no Auth:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- user_metadata:', user.user_metadata);

    // Buscar dados na tabela members
    console.log('\n🔍 Buscando dados na tabela members...');
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (memberError) {
      console.log('❌ Erro ao buscar membro:', memberError);
      console.log('⚠️ Usuário pode não ter registro na tabela members');
    } else {
      console.log('✅ Dados na tabela members:');
      console.log('- ID:', memberData.id);
      console.log('- auth_user_id:', memberData.auth_user_id);
      console.log('- name:', memberData.name);
      console.log('- email:', memberData.email);
      console.log('- funcao:', memberData.funcao);
      console.log('- area:', memberData.area);
    }

    // Simular como o endpoint /auth/users retorna os dados
    console.log('\n🔍 Simulando endpoint /auth/users...');
    
    // Mapear os usuários como faz o AuthService.listUsers
    const mappedUser = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      role: user.user_metadata?.role || null,
      nome: user.user_metadata?.nome || null,
      regional: user.user_metadata?.regional || null,
      tipo: user.user_metadata?.tipo || null,
      funcao: user.user_metadata?.funcao || null,
      email_confirmed_at: user.email_confirmed_at,
      phone_confirmed_at: user.phone_confirmed_at,
      banned_until: user.banned_until,
    };

    console.log('📄 Como seria retornado pelo endpoint:');
    console.log(JSON.stringify(mappedUser, null, 2));

    // Verificar se há discrepância entre Auth e Members
    if (memberData) {
      console.log('\n🔍 Comparando dados Auth vs Members:');
      console.log('- Nome Auth:', user.user_metadata?.nome, '| Nome Members:', memberData.name);
      console.log('- Funcao Auth:', user.user_metadata?.funcao, '| Funcao Members:', memberData.funcao);
      console.log('- Regional Auth:', user.user_metadata?.regional, '| Area Members:', memberData.area);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testWithRealUser();