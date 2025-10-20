const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreateUserFixed() {
  console.log('🧪 Testando criação de usuário após correção...\n');
  
  try {
    // 1. Testar via API do backend
    console.log('1️⃣ Testando criação via API do backend...');
    
    const testUserData = {
      email: `test-create-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      nome: 'Usuário Teste Criação',
      role: 'user',
      tipo: 'Regional',
      regional: 'São Paulo',
      funcao: 'Analista'
    };
    
    // Fazer requisição para o endpoint de registro
    const response = await fetch('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Usar um token de super admin válido (você precisa substituir por um token real)
        'Authorization': 'Bearer YOUR_SUPER_ADMIN_TOKEN_HERE'
      },
      body: JSON.stringify(testUserData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Erro na API:', result);
      
      // Se falhar por falta de token, testar diretamente via Supabase Admin
      console.log('\n2️⃣ Testando criação direta via Supabase Admin...');
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: testUserData.email,
        password: testUserData.password,
        email_confirm: true,
        user_metadata: {
          nome: testUserData.nome,
          role: testUserData.role,
          tipo: testUserData.tipo,
          regional: testUserData.regional,
          funcao: testUserData.funcao
        }
      });
      
      if (authError) {
        console.error('❌ Erro ao criar usuário via Supabase Admin:', authError);
        return;
      }
      
      console.log('✅ Usuário criado no Auth:', authData.user.id);
      
      // Aguardar trigger processar
      console.log('⏳ Aguardando trigger processar...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se foi criado na tabela usuarios
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('auth_user_id', authData.user.id)
        .single();
      
      if (usuarioError) {
        console.error('❌ Usuário não foi criado na tabela usuarios:', usuarioError);
      } else {
        console.log('✅ Usuário criado na tabela usuarios:', usuarioData);
        console.log('🎉 Criação funcionando corretamente!');
      }
      
      // Limpar usuário de teste
      console.log('\n🧹 Limpando usuário de teste...');
      await supabase.from('usuarios').delete().eq('auth_user_id', authData.user.id);
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.log('✅ Usuário de teste removido');
      
    } else {
      console.log('✅ Usuário criado via API:', result);
      console.log('🎉 API funcionando corretamente!');
    }
    
  } catch (error) {
    console.error('💥 Erro durante teste:', error);
  }
}

testCreateUserFixed();