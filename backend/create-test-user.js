const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function createTestUser() {
  try {
    // Criar usuário no Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'teste.exclusao@example.com',
      password: 'TesteExclusao123!',
      email_confirm: true,
      user_metadata: {
        nome: 'Usuário Teste Exclusão',
        role: 'coordenador'
      }
    });
    if (authError) {
      console.error('Erro ao criar no Auth:', authError);
      return;
    }
    console.log('Usuário criado no Auth:', authUser.user.id);
    // Criar entrada na tabela usuarios
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .insert({
        auth_user_id: authUser.user.id,
        email: 'teste.exclusao@example.com',
        nome: 'Usuário Teste Exclusão',
        regional: 'São Paulo',
        funcao: 'Teste',
        tipo: 'coordenador',
        permissao: 'coordenador',
        status: 'ativo'
      })
      .select()
      .single();
    if (usuarioError) {
      console.error('Erro ao criar na tabela usuarios:', usuarioError);
      return;
    }
    console.log('Usuário criado na tabela usuarios:', usuario);
    console.log('ID da tabela usuarios:', usuario.id);
    console.log('auth_user_id:', usuario.auth_user_id);
  } catch (error) {
    console.error('Erro geral:', error);
  }
}
createTestUser();
