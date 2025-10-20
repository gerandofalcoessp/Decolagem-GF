const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Token válido obtido do frontend ou Postman (substitua por um token real)
const VALID_SUPER_ADMIN_TOKEN = 'COLE_AQUI_UM_TOKEN_VALIDO_DE_SUPER_ADMIN';

async function testApiWithValidToken() {
  console.log('🧪 Testando API com token válido...\n');

  if (VALID_SUPER_ADMIN_TOKEN === 'COLE_AQUI_UM_TOKEN_VALIDO_DE_SUPER_ADMIN') {
    console.log('⚠️ Por favor, substitua VALID_SUPER_ADMIN_TOKEN por um token real');
    console.log('💡 Você pode obter um token fazendo login no frontend e copiando do localStorage');
    console.log('💡 Ou usando o Postman para fazer login e copiar o token da resposta');
    return;
  }

  // Usar service key para operações administrativas
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  // 1. Criar usuário de teste diretamente no Auth
  console.log('📝 Criando usuário de teste...');
  
  const testEmail = `test.api.token.${Date.now()}@test.com`;
  
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

  // 4. Testar exclusão via API usando token válido
  console.log('\n🗑️ Tentando excluir via API com token válido...');
  
  const deleteResponse = await fetch(`http://localhost:4005/api/auth/users/${userData.id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${VALID_SUPER_ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const deleteResult = await deleteResponse.json();
  
  console.log('Status da resposta:', deleteResponse.status);
  console.log('Resultado:', deleteResult);
  
  if (deleteResponse.ok) {
    console.log('✅ Usuário excluído com sucesso via API!');
  } else {
    console.error('❌ Erro ao excluir via API');
    
    // Limpeza manual
    console.log('\n🧹 Fazendo limpeza manual...');
    await supabaseAdmin.from('usuarios').delete().eq('auth_user_id', authUser.user.id);
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
  }

  // 5. Verificação final
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

testApiWithValidToken().catch(console.error);