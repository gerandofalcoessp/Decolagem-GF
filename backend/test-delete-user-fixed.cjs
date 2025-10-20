const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function testDeleteUserFixed() {
  console.log('🧪 Testando exclusão de usuário com correção...\n');

  // 1. Login como super admin
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'flavio.almeida@gerandofalcoes.com',
    password: 'SuperAdmin123!'
  });

  if (authError) {
    console.error('❌ Erro no login:', authError.message);
    return;
  }

  console.log('✅ Login realizado com sucesso');
  console.log('Token:', authData.session.access_token.substring(0, 50) + '...');

  // 2. Criar usuário de teste
  console.log('\n📝 Criando usuário de teste...');
  
  const testUserData = {
    email: `test.delete.fixed.${Date.now()}@test.com`,
    password: 'TestPassword123!',
    nome: 'Teste Delete Fixed',
    role: 'membro'
  };

  const createResponse = await fetch('http://localhost:4005/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authData.session.access_token}`
    },
    body: JSON.stringify(testUserData)
  });

  const createResult = await createResponse.json();
  
  if (!createResponse.ok) {
    console.error('❌ Erro ao criar usuário:', createResult);
    return;
  }

  console.log('✅ Usuário criado:', createResult);
  const testUserId = createResult.user?.id;

  if (!testUserId) {
    console.error('❌ ID do usuário não encontrado na resposta');
    return;
  }

  // 3. Aguardar um pouco para sincronização
  console.log('\n⏳ Aguardando sincronização...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Tentar excluir o usuário usando a API corrigida
  console.log('\n🗑️ Tentando excluir usuário via API corrigida...');
  
  const deleteResponse = await fetch(`http://localhost:4005/api/auth/users/${testUserId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authData.session.access_token}`
    }
  });

  const deleteResult = await deleteResponse.json();
  
  if (deleteResponse.ok) {
    console.log('✅ Usuário excluído com sucesso:', deleteResult);
  } else {
    console.error('❌ Erro ao excluir usuário:', deleteResult);
    
    // Se falhou, tentar limpeza manual
    console.log('\n🧹 Tentando limpeza manual...');
    
    const { error: cleanupError } = await supabase
      .from('usuarios')
      .delete()
      .eq('auth_user_id', testUserId);
    
    if (cleanupError) {
      console.error('❌ Erro na limpeza manual:', cleanupError);
    } else {
      console.log('✅ Limpeza manual realizada');
    }
  }

  // 5. Verificar se o usuário foi realmente excluído
  console.log('\n🔍 Verificando se usuário foi excluído...');
  
  const { data: checkUser, error: checkError } = await supabase
    .from('usuarios')
    .select('*')
    .eq('auth_user_id', testUserId)
    .single();

  if (checkError && checkError.code === 'PGRST116') {
    console.log('✅ Usuário não encontrado na tabela usuarios (excluído com sucesso)');
  } else if (checkUser) {
    console.log('⚠️ Usuário ainda existe na tabela usuarios:', checkUser);
  } else {
    console.log('❓ Estado incerto:', checkError);
  }

  console.log('\n🏁 Teste concluído');
}

testDeleteUserFixed().catch(console.error);