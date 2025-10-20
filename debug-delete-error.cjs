const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://ixqjqfqhqvqjqfqhqvqj.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxZnFocXZxanFmcWhxdnFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk4NzE0NywiZXhwIjoyMDUwNTYzMTQ3fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function debugDeleteError() {
  console.log('🔍 Debugando erro "Usuário não encontrado na base de dados"...\n');

  try {
    // 1. Fazer login como super admin
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

    // 2. Listar usuários para ver a estrutura
    console.log('\n2. Listando usuários existentes...');
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id, email, nome')
      .order('created_at', { ascending: false })
      .limit(5);

    if (usuariosError) {
      console.log('❌ Erro ao listar usuários:', usuariosError);
      return;
    }

    console.log(`✅ Encontrados ${usuarios.length} usuários:`);
    usuarios.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email || user.nome}`);
      console.log(`      - ID (tabela): ${user.id}`);
      console.log(`      - auth_user_id: ${user.auth_user_id}`);
    });

    if (usuarios.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    // 3. Criar um usuário de teste para exclusão
    console.log('\n3. Criando usuário de teste...');
    const testUserData = {
      email: `test-delete-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nome: 'Usuário Teste Delete',
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

    const createData = await createResponse.json();
    console.log('✅ Usuário de teste criado:', createData);

    // Aguardar sincronização
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Buscar o usuário criado na tabela usuarios
    console.log('\n4. Buscando usuário criado na tabela usuarios...');
    const { data: createdUser, error: searchError } = await supabaseAdmin
      .from('usuarios')
      .select('id, auth_user_id, email')
      .eq('email', testUserData.email)
      .single();

    if (searchError) {
      console.log('❌ Erro ao buscar usuário criado:', searchError);
      return;
    }

    console.log('✅ Usuário encontrado na tabela usuarios:');
    console.log(`   - ID (tabela): ${createdUser.id}`);
    console.log(`   - auth_user_id: ${createdUser.auth_user_id}`);
    console.log(`   - Email: ${createdUser.email}`);

    // 5. Testar exclusão com ID da tabela (como o frontend faz)
    console.log('\n5. Testando exclusão com ID da tabela (simulando frontend)...');
    const deleteResponse = await fetch(`http://localhost:4005/api/auth/users/${createdUser.id}`, {
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
      
      // 6. Testar exclusão com auth_user_id
      console.log('\n6. Testando exclusão com auth_user_id...');
      const deleteResponse2 = await fetch(`http://localhost:4005/api/auth/users/${createdUser.auth_user_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log(`   Status: ${deleteResponse2.status}`);
      
      if (deleteResponse2.ok) {
        const deleteData2 = await deleteResponse2.json();
        console.log('✅ Usuário excluído com auth_user_id:', deleteData2);
      } else {
        const errorData2 = await deleteResponse2.text();
        console.log('❌ Erro na exclusão com auth_user_id:', errorData2);
      }
    }

    // 7. Verificar se o usuário ainda existe
    console.log('\n7. Verificando se usuário ainda existe...');
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
      console.log('\n8. Fazendo limpeza manual...');
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

  console.log('\n🏁 Debug concluído!');
}

debugDeleteError();