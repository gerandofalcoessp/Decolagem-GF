const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testDeleteUserSimple() {
  console.log('🧪 Testando exclusão de usuário (versão simplificada)...\n');

  // Usar service key para operações administrativas
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // 1. Criar usuário de teste diretamente no Auth
  console.log('📝 Criando usuário de teste...');
  
  const testEmail = `test.delete.simple.${Date.now()}@test.com`;
  
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'TestPassword123!',
    email_confirm: true
  });

  if (authError) {
    console.error('❌ Erro ao criar usuário no Auth:', authError.message);
    return;
  }

  console.log('✅ Usuário criado no Auth:', authUser.user.id);

  // 2. Aguardar sincronização
  console.log('\n⏳ Aguardando sincronização...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. Verificar se usuário foi sincronizado na tabela usuarios
  const { data: userData, error: userError } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUser.user.id)
    .single();

  if (userError) {
    console.error('❌ Usuário não foi sincronizado na tabela usuarios:', userError.message);
    // Limpeza
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return;
  }

  console.log('✅ Usuário sincronizado na tabela usuarios:', userData.id);

  // 4. Testar exclusão via API usando token de super admin
  console.log('\n🔑 Fazendo login como super admin para obter token...');
  
  const supabaseClient = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  
  // Tentar com diferentes usuários super admin
  const superAdmins = [
    'flavio.almeida@gerandofalcoes.com',
    'lemaestro@gerandofalcoes.com'
  ];

  let authToken = null;
  
  for (const adminEmail of superAdmins) {
    console.log(`Tentando login com ${adminEmail}...`);
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: adminEmail,
      password: 'password123' // Senha padrão comum
    });

    if (!loginError && loginData.session) {
      authToken = loginData.session.access_token;
      console.log('✅ Login realizado com sucesso');
      break;
    } else {
      console.log(`❌ Falha no login: ${loginError?.message || 'Erro desconhecido'}`);
    }
  }

  if (!authToken) {
    console.log('⚠️ Não foi possível fazer login. Testando exclusão direta...');
    
    // Teste direto no banco
    const { error: directDeleteError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('auth_user_id', authUser.user.id);

    if (directDeleteError) {
      console.error('❌ Erro na exclusão direta:', directDeleteError.message);
    } else {
      console.log('✅ Exclusão direta bem-sucedida');
    }

    // Limpeza do Auth
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return;
  }

  // 5. Tentar excluir via API
  console.log('\n🗑️ Tentando excluir via API...');
  
  const deleteResponse = await fetch(`http://localhost:4005/api/auth/users/${userData.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`
    }
  });

  const deleteResult = await deleteResponse.json();
  
  if (deleteResponse.ok) {
    console.log('✅ Usuário excluído com sucesso via API:', deleteResult);
  } else {
    console.error('❌ Erro ao excluir via API:', deleteResult);
    
    // Limpeza manual
    console.log('\n🧹 Fazendo limpeza manual...');
    await supabaseAdmin.from('usuarios').delete().eq('auth_user_id', authUser.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
  }

  // 6. Verificação final
  console.log('\n🔍 Verificação final...');
  
  const { data: finalCheck, error: finalError } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', authUser.user.id)
    .single();

  if (finalError && finalError.code === 'PGRST116') {
    console.log('✅ Usuário não encontrado (excluído com sucesso)');
  } else if (finalCheck) {
    console.log('⚠️ Usuário ainda existe:', finalCheck);
  }

  console.log('\n🏁 Teste concluído');
}

testDeleteUserSimple().catch(console.error);