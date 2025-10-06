const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestUser() {
  console.log('🔧 Criando usuário de teste...\n');
  
  try {
    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'teste@decolagem.com',
      password: 'Teste123!',
      email_confirm: true,
      user_metadata: {
        nome: 'Usuário Teste',
        role: 'super_admin'
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError);
      return;
    }

    console.log('✅ Usuário criado no Auth:', authData.user.email);

    // Criar entrada na tabela usuarios
    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        auth_user_id: authData.user.id,
        nome: 'Usuário Teste',
        email: 'teste@decolagem.com',
        funcao: 'Administrador',
        area: 'Nacional',
        regional: 'Nacional',
        tipo: 'nacional',
        permissao: 'super_admin',
        role: 'super_admin',
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (usuarioError) {
      console.error('❌ Erro ao criar entrada na tabela usuarios:', usuarioError);
    } else {
      console.log('✅ Entrada criada na tabela usuarios');
    }

    // Criar entrada na tabela members para compatibilidade
    const { error: memberError } = await supabaseAdmin
      .from('members')
      .insert({
        auth_user_id: authData.user.id,
        name: 'Usuário Teste',
        email: 'teste@decolagem.com',
        role: 'super_admin',
        funcao: 'Administrador',
        area: 'Nacional',
        regional: 'Nacional',
        tipo: 'nacional',
        status: 'ativo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (memberError) {
      console.error('❌ Erro ao criar entrada na tabela members:', memberError);
    } else {
      console.log('✅ Entrada criada na tabela members');
    }

    console.log('\n🎉 Usuário de teste criado com sucesso!');
    console.log('📧 Email: teste@decolagem.com');
    console.log('🔑 Senha: Teste123!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUser();