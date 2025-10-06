const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('👤 Criando usuário de teste para RLS...\n');
  
  try {
    const testEmail = `test-rls-${Date.now()}@test.com`;
    const testPassword = 'TestRLS123!';
    
    console.log('📧 Email:', testEmail);
    console.log('🔑 Senha:', testPassword);
    
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      user_metadata: {
        role: 'user'
      },
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário:', authError.message);
      return;
    }

    console.log('✅ Usuário criado no Auth:', authData.user.id);

    // Criar entrada na tabela usuarios
    const { data: usuarioData, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome: 'Usuário Teste RLS',
        email: testEmail,
        role: 'user',
        funcao: 'Teste',
        area: 'Teste',
        regional: 'Teste',
        tipo: 'teste',
        status: 'ativo'
      })
      .select()
      .single();

    if (usuarioError) {
      console.error('❌ Erro ao criar entrada na tabela usuarios:', usuarioError.message);
    } else {
      console.log('✅ Entrada criada na tabela usuarios');
    }

    console.log('\n🎉 Usuário de teste criado com sucesso!');
    console.log('📧 Email:', testEmail);
    console.log('🔑 Senha:', testPassword);
    console.log('🆔 ID:', authData.user.id);
    
    return {
      email: testEmail,
      password: testPassword,
      id: authData.user.id
    };
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createTestUser();