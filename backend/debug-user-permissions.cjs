const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserPermissions() {
  console.log('🔍 Verificando dados do usuário lemaestro@gerandofalcoes.com...\n');

  try {
    // 1. Verificar dados na tabela usuarios
    console.log('1. Verificando tabela usuarios:');
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'lemaestro@gerandofalcoes.com');

    if (usuariosError) {
      console.error('❌ Erro ao consultar tabela usuarios:', usuariosError);
    } else {
      console.log('✅ Dados na tabela usuarios:');
      console.log(JSON.stringify(usuariosData, null, 2));
    }

    // 2. Verificar dados na tabela auth.users
    console.log('\n2. Verificando tabela auth.users:');
    const { data: authData, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at, updated_at, email_confirmed_at')
      .eq('email', 'lemaestro@gerandofalcoes.com');

    if (authError) {
      console.error('❌ Erro ao consultar tabela auth.users:', authError);
    } else {
      console.log('✅ Dados na tabela auth.users:');
      console.log(JSON.stringify(authData, null, 2));
    }

    // 3. Verificar se há sincronização entre as tabelas
    console.log('\n3. Análise de sincronização:');
    if (usuariosData && usuariosData.length > 0 && authData && authData.length > 0) {
      const usuario = usuariosData[0];
      const authUser = authData[0];
      
      console.log(`📧 Email: ${usuario.email}`);
      console.log(`🔑 Permissão: ${usuario.permissao}`);
      console.log(`👤 Tipo: ${usuario.tipo}`);
      console.log(`🏢 Função: ${usuario.funcao}`);
      console.log(`🌍 Regional: ${usuario.regional}`);
      console.log(`🆔 Auth User ID: ${authUser.id}`);
      console.log(`🆔 Usuario Auth User ID: ${usuario.auth_user_id}`);
      
      if (usuario.auth_user_id === authUser.id) {
        console.log('✅ IDs sincronizados corretamente');
      } else {
        console.log('❌ IDs não sincronizados!');
      }
      
      if (usuario.permissao === 'super_admin') {
        console.log('✅ Permissão definida como super_admin');
      } else {
        console.log(`❌ Permissão incorreta: ${usuario.permissao} (deveria ser super_admin)`);
      }
    } else {
      console.log('❌ Usuário não encontrado em uma ou ambas as tabelas');
    }

    // 4. Verificar todos os usuários com permissão super_admin
    console.log('\n4. Todos os usuários com permissão super_admin:');
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('permissao', 'super_admin');

    if (superAdminsError) {
      console.error('❌ Erro ao consultar super admins:', superAdminsError);
    } else {
      console.log('✅ Super admins encontrados:');
      console.log(JSON.stringify(superAdmins, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugUserPermissions();