const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testSupabaseConnection() {
  console.log('🔍 Testando conexão com Supabase...\n');

  try {
    // Verificar variáveis de ambiente
    console.log('📋 Verificando variáveis de ambiente:');
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Definida' : '❌ Não definida'}`);
    console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Definida' : '❌ Não definida'}`);
    console.log(`   SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅ Definida' : '❌ Não definida'}`);

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('\n❌ Variáveis de ambiente não configuradas corretamente!');
      return;
    }

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('\n🔗 Testando conexão básica...');
    
    // Teste 1: Verificar se consegue conectar
    const { data: healthCheck, error: healthError } = await supabase
      .from('members')
      .select('count')
      .limit(1);

    if (healthError) {
      console.log('❌ Erro na conexão básica:', healthError.message);
      return;
    }

    console.log('✅ Conexão básica funcionando');

    // Teste 2: Verificar tabela members
    console.log('\n👥 Testando tabela members...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id, nome, email')
      .limit(3);

    if (membersError) {
      console.log('❌ Erro ao acessar tabela members:', membersError.message);
    } else {
      console.log(`✅ Tabela members acessível (${members.length} registros encontrados)`);
    }

    // Teste 3: Verificar tabela goals
    console.log('\n🎯 Testando tabela goals...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, nome, descricao')
      .limit(3);

    if (goalsError) {
      console.log('❌ Erro ao acessar tabela goals:', goalsError.message);
    } else {
      console.log(`✅ Tabela goals acessível (${goals.length} registros encontrados)`);
    }

    // Teste 4: Verificar auth.users (se possível)
    console.log('\n🔐 Testando acesso ao auth...');
    try {
      const supabaseAdmin = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });

      if (authError) {
        console.log('❌ Erro ao acessar auth.users:', authError.message);
      } else {
        console.log(`✅ Auth funcionando (${authUsers.users?.length || 0} usuários encontrados)`);
      }
    } catch (authErr) {
      console.log('❌ Erro no teste de auth:', authErr.message);
    }

    // Teste 5: Verificar RLS (Row Level Security)
    console.log('\n🛡️ Testando RLS...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    if (rlsError && rlsError.message.includes('RLS')) {
      console.log('⚠️ RLS está ativo (isso é normal)');
    } else if (rlsError) {
      console.log('❌ Erro relacionado ao RLS:', rlsError.message);
    } else {
      console.log('✅ Acesso aos dados funcionando');
    }

    console.log('\n🎉 Teste de conexão concluído!');
    console.log('📊 Status geral: Supabase está conectado e funcionando');

  } catch (error) {
    console.error('❌ Erro durante teste de conexão:', error);
  }
}

testSupabaseConnection().catch(console.error);