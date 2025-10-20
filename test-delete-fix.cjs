const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqfqhqvqjqfqhqvqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFocXZxanFmcWhxdnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk4NzE0NywiZXhwIjoyMDUwNTYzMTQ3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testDeleteFix() {
  console.log('🔧 Testando correção da exclusão de usuário...\n');

  try {
    // 1. Login como super admin
    console.log('1. Fazendo login como super admin...');
    const loginResponse = await fetch('http://localhost:4005/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio.almeida@gerandofalcoes.com',
        password: '123456'
      }),
    });

    if (!loginResponse.ok) {
      console.log('❌ Erro no login:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;
    console.log('✅ Login realizado com sucesso');

    // 2. Criar usuário de teste
    console.log('\n2. Criando usuário de teste...');
    const testUserData = {
      email: `test-delete-fix-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nome: 'Usuário Teste Delete Fix',
      role: 'user',
      regional: 'São Paulo'
    };

    const createResponse = await fetch('http://localhost:4005/api/auth/register-public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUserData),
    });

    if (!createResponse.ok) {
      console.log('❌ Erro ao criar usuário de teste:', await createResponse.text());
      return;
    }

    console.log('✅ Usuário de teste criado');

    // Aguardar sincronização
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Buscar o usuário criado
    console.log('\n3. Buscando usuário criado...');
    const { data: createdUser, error: searchError } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id, email')
      .eq('email', testUserData.email)
      .single();

    if (searchError) {
      console.log('❌ Erro ao buscar usuário criado:', searchError);
      return;
    }

    console.log('✅ Usuário encontrado:');
    console.log(`   - ID (tabela): ${createdUser.id}`);
    console.log(`   - auth_user_id: ${createdUser.auth_user_id}`);
    console.log(`   - Email: ${createdUser.email}`);

    // 4. Testar exclusão com auth_user_id (como o frontend faz)
    console.log('\n4. Testando exclusão com auth_user_id...');
    const deleteResponse = await fetch(`http://localhost:4005/api/auth/users/${createdUser.auth_user_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log(`   Status: ${deleteResponse.status}`);
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Usuário excluído com sucesso:', deleteData);
    } else {
      const errorData = await deleteResponse.text();
      console.log('❌ Erro na exclusão:', errorData);
    }

    // 5. Verificar se o usuário foi realmente excluído
    console.log('\n5. Verificando se usuário foi excluído...');
    const { data: checkUser, error: checkError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', testUserData.email)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('✅ Usuário não encontrado (excluído com sucesso)');
    } else if (checkUser) {
      console.log('⚠️ Usuário ainda existe:', checkUser);
      
      // Limpeza manual
      console.log('\n6. Fazendo limpeza manual...');
      const { error: cleanupError } = await supabaseAdmin
        .from('usuarios')
        .delete()
        .eq('email', testUserData.email);
      
      if (cleanupError) {
        console.log('❌ Erro na limpeza:', cleanupError);
      } else {
        console.log('✅ Limpeza manual realizada');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n🏁 Teste concluído!');
}

testDeleteFix();