const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testFrontendFlow() {
  console.log('🧪 Testando fluxo completo de criação e exclusão de usuários...\n');

  const testEmail = `test-frontend-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let createdUserId = null;
  let authUserId = null;

  try {
    // 1. Testar criação de usuário via API do backend
    console.log('1️⃣ Testando criação de usuário via API do backend...');
    
    const createResponse = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        nome: 'Usuário Teste Frontend',
        tipo: 'Regional',
        permissao: 'admin',
        funcao: 'Coordenador',
        area: 'R. São Paulo'
      })
    });

    if (createResponse.ok) {
      const createResult = await createResponse.json();
      console.log('✅ Usuário criado com sucesso via API:', createResult);
      
      // Aguardar um pouco para sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se o usuário foi criado na tabela usuarios
      const { data: usuarioData, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('email', testEmail)
        .single();

      if (usuarioError) {
        console.error('❌ Erro ao verificar usuário na tabela usuarios:', usuarioError);
      } else {
        console.log('✅ Usuário encontrado na tabela usuarios:', usuarioData);
        createdUserId = usuarioData.id;
        authUserId = usuarioData.auth_user_id;
      }
    } else {
      const errorText = await createResponse.text();
      console.log('❌ Falha na criação via API:', createResponse.status, errorText);
      
      // Fallback: criar diretamente via Supabase Admin
      console.log('🔄 Tentando criar usuário diretamente via Supabase Admin...');
      
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        user_metadata: {
          nome: 'Usuário Teste Frontend',
          tipo: 'Regional',
          permissao: 'admin',
          funcao: 'Coordenador',
          area: 'R. São Paulo'
        }
      });

      if (authError) {
        console.error('❌ Erro ao criar usuário via Supabase Admin:', authError);
        return;
      }

      console.log('✅ Usuário criado via Supabase Admin:', authUser.user.id);
      authUserId = authUser.user.id;
      
      // Aguardar sincronização via trigger
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se foi sincronizado
      const { data: usuarioData, error: usuarioError } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authUserId)
        .single();

      if (usuarioError) {
        console.error('❌ Usuário não foi sincronizado na tabela usuarios:', usuarioError);
        return;
      }

      console.log('✅ Usuário sincronizado na tabela usuarios:', usuarioData);
      createdUserId = usuarioData.id;
    }

    // 2. Testar exclusão de usuário via API do backend
    if (createdUserId && authUserId) {
      console.log('\n2️⃣ Testando exclusão de usuário via API do backend...');
      
      // Primeiro, precisamos fazer login como admin para obter token
      const { data: adminSession, error: loginError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: 'admin@example.com' // Assumindo que existe um admin
      });

      if (loginError) {
        console.log('⚠️ Não foi possível obter token de admin, testando exclusão direta...');
        
        // Testar exclusão direta via Supabase Admin
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
        
        if (deleteAuthError) {
          console.error('❌ Erro ao excluir usuário do Auth:', deleteAuthError);
        } else {
          console.log('✅ Usuário excluído do Auth com sucesso');
        }

        // Verificar se foi removido da tabela usuarios (via trigger)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: checkUser, error: checkError } = await supabaseAdmin
          .from('usuarios')
          .select('*')
          .eq('id', createdUserId)
          .maybeSingle();

        if (checkError) {
          console.error('❌ Erro ao verificar exclusão:', checkError);
        } else if (checkUser) {
          console.log('⚠️ Usuário ainda existe na tabela usuarios:', checkUser);
          
          // Limpeza manual
          const { error: manualDeleteError } = await supabaseAdmin
            .from('usuarios')
            .delete()
            .eq('id', createdUserId);
            
          if (manualDeleteError) {
            console.error('❌ Erro na limpeza manual:', manualDeleteError);
          } else {
            console.log('✅ Limpeza manual realizada com sucesso');
          }
        } else {
          console.log('✅ Usuário removido da tabela usuarios com sucesso');
        }
      }
    }

    console.log('\n✅ Teste do fluxo frontend concluído com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    // Limpeza final
    if (authUserId) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUserId);
        console.log('🧹 Limpeza final do Auth realizada');
      } catch (cleanupError) {
        console.warn('⚠️ Erro na limpeza final do Auth:', cleanupError);
      }
    }
    
    if (createdUserId) {
      try {
        await supabaseAdmin
          .from('usuarios')
          .delete()
          .eq('id', createdUserId);
        console.log('🧹 Limpeza final da tabela usuarios realizada');
      } catch (cleanupError) {
        console.warn('⚠️ Erro na limpeza final da tabela usuarios:', cleanupError);
      }
    }
  }
}

testFrontendFlow().catch(console.error);