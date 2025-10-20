const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRegisterDirect() {
  console.log('🧪 Testando registro direto via Supabase Admin...\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente não configuradas');
    console.log('SUPABASE_URL:', SUPABASE_URL ? 'Configurada' : 'Não configurada');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Testar criação de usuário via Supabase Admin
  console.log('👤 Criando usuário via Supabase Admin...');
  
  const testUserData = {
    email: `test.user.${Date.now()}@gerandofalcoes.com`,
    password: 'TestPassword123!',
    email_confirm: true,
    user_metadata: {
      nome: 'Erika Miranda',
      role: 'super_admin',
      funcao: 'Coordenador',
      regional: 'R. São Paulo'
    }
  };

  console.log('Dados do usuário:', testUserData);

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser(testUserData);

    if (error) {
      console.error('❌ Erro ao criar usuário no Auth:', error);
      return;
    }

    console.log('✅ Usuário criado no Auth com sucesso!');
    console.log('ID do usuário:', data.user.id);
    console.log('Email:', data.user.email);

    // 2. Testar inserção na tabela usuarios
    console.log('\n📝 Inserindo na tabela usuarios...');
    
    const usuarioData = {
      auth_user_id: data.user.id,
      nome: testUserData.user_metadata.nome,
      email: data.user.email,
      funcao: testUserData.user_metadata.funcao,
      area: testUserData.user_metadata.regional,
      regional: testUserData.user_metadata.regional,
      tipo: 'nacional',
      permissao: testUserData.user_metadata.role,
      role: testUserData.user_metadata.role,
      status: 'ativo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Dados para tabela usuarios:', usuarioData);

    const { data: usuarioResult, error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert(usuarioData)
      .select()
      .single();

    if (usuarioError) {
      console.error('❌ Erro ao inserir na tabela usuarios:', usuarioError);
      console.error('Detalhes do erro:', usuarioError.details);
      console.error('Hint:', usuarioError.hint);
      console.error('Message:', usuarioError.message);
    } else {
      console.log('✅ Usuário inserido na tabela usuarios com sucesso!');
      console.log('ID na tabela usuarios:', usuarioResult.id);
    }

    // 3. Verificar se o usuário foi criado corretamente
    console.log('\n🔍 Verificando usuário criado...');
    
    const { data: verificacao, error: verificacaoError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();

    if (verificacaoError) {
      console.error('❌ Erro ao verificar usuário:', verificacaoError);
    } else {
      console.log('✅ Usuário encontrado na tabela usuarios:');
      console.log('- ID:', verificacao.id);
      console.log('- Nome:', verificacao.nome);
      console.log('- Email:', verificacao.email);
      console.log('- Role:', verificacao.role);
      console.log('- Permissão:', verificacao.permissao);
      console.log('- Regional:', verificacao.regional);
      console.log('- Função:', verificacao.funcao);
    }

    // 4. Limpeza - remover usuário de teste
    console.log('\n🧹 Limpando usuário de teste...');
    
    // Remover da tabela usuarios
    const { error: deleteUsuarioError } = await supabaseAdmin
      .from('usuarios')
      .delete()
      .eq('auth_user_id', data.user.id);

    if (deleteUsuarioError) {
      console.error('❌ Erro ao remover da tabela usuarios:', deleteUsuarioError);
    } else {
      console.log('✅ Usuário removido da tabela usuarios');
    }

    // Remover do Auth
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(data.user.id);

    if (deleteAuthError) {
      console.error('❌ Erro ao remover do Auth:', deleteAuthError);
    } else {
      console.log('✅ Usuário removido do Auth');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  console.log('\n🏁 Teste concluído');
}

testRegisterDirect().catch(console.error);