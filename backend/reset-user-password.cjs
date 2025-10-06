const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function resetUserPassword() {
  console.log('🔐 Verificando e redefinindo senha do usuário lemaestro@gerandofalcoes.com...\n');

  try {
    // Primeiro, verificar se o usuário existe no auth.users
    console.log('1. Verificando usuário no auth.users...');
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Erro ao listar usuários:', listError.message);
      return;
    }

    const targetUser = users.users.find(user => user.email === 'lemaestro@gerandofalcoes.com');
    
    if (!targetUser) {
      console.error('❌ Usuário lemaestro@gerandofalcoes.com não encontrado no auth.users');
      return;
    }

    console.log('✅ Usuário encontrado no auth.users:');
    console.log('🆔 ID:', targetUser.id);
    console.log('📧 Email:', targetUser.email);
    console.log('✉️ Email confirmado:', targetUser.email_confirmed_at ? 'Sim' : 'Não');
    console.log('📝 User Metadata:', JSON.stringify(targetUser.user_metadata, null, 2));

    // Verificar dados na tabela usuarios
    console.log('\n2. Verificando dados na tabela usuarios...');
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', targetUser.id)
      .single();

    if (usuarioError) {
      console.error('❌ Erro ao buscar dados na tabela usuarios:', usuarioError.message);
    } else {
      console.log('✅ Dados na tabela usuarios:');
      console.log('👤 Nome:', usuarioData.nome);
      console.log('📧 Email:', usuarioData.email);
      console.log('🔑 Permissão:', usuarioData.permissao);
      console.log('🔑 Role (legacy):', usuarioData.role);
      console.log('📍 Regional:', usuarioData.regional);
      console.log('📋 Status:', usuarioData.status);
    }

    // Redefinir senha
    console.log('\n3. Redefinindo senha...');
    const newPassword = 'SuperAdmin2024!';
    
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { 
        password: newPassword,
        email_confirm: true // Confirmar email se não estiver confirmado
      }
    );

    if (updateError) {
      console.error('❌ Erro ao redefinir senha:', updateError.message);
      return;
    }

    console.log('✅ Senha redefinida com sucesso!');
    console.log('🔑 Nova senha:', newPassword);

    // Testar login com a nova senha
    console.log('\n4. Testando login com a nova senha...');
    const supabaseClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: 'lemaestro@gerandofalcoes.com',
      password: newPassword
    });

    if (loginError) {
      console.error('❌ Erro no teste de login:', loginError.message);
    } else {
      console.log('✅ Teste de login realizado com sucesso!');
      console.log('📧 Email logado:', loginData.user.email);
      console.log('🔑 Permissão no metadata:', loginData.user.user_metadata?.role);
      
      // Fazer logout
      await supabaseClient.auth.signOut();
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

resetUserPassword();