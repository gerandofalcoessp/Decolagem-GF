import 'dotenv/config';
import { supabaseAdmin } from './src/services/supabaseClient.js';

async function testExecSQL() {
  console.log('🧪 Testando função exec_sql do Supabase...\n');

  try {
    // 1. Teste simples - SELECT 1
    console.log('1. Testando SELECT simples...');
    const { data: selectData, error: selectError } = await supabaseAdmin
      .rpc('exec_sql', { sql: 'SELECT 1 as test_value;' });

    if (selectError) {
      console.error('❌ Erro no SELECT:', selectError.message);
      console.error('Código:', selectError.code);
      console.error('Detalhes:', selectError.details);
      return;
    }

    console.log('✅ SELECT funcionou:', selectData);

    // 2. Teste de criação de tabela
    console.log('\n2. Testando criação da tabela migrations...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { data: createData, error: createError } = await supabaseAdmin
      .rpc('exec_sql', { sql: createTableSQL });

    if (createError) {
      console.error('❌ Erro ao criar tabela:', createError.message);
      console.error('Código:', createError.code);
      console.error('Detalhes:', createError.details);
      return;
    }

    console.log('✅ Tabela migrations criada/verificada');

    // 3. Teste de consulta na tabela migrations
    console.log('\n3. Testando consulta na tabela migrations...');
    const { data: migrationsData, error: migrationsError } = await supabaseAdmin
      .from('migrations')
      .select('*');

    if (migrationsError) {
      console.error('❌ Erro ao consultar migrations:', migrationsError.message);
    } else {
      console.log('✅ Consulta migrations funcionou:', migrationsData.length, 'registros');
    }

    // 4. Verificar se a migração RLS foi aplicada
    console.log('\n4. Verificando políticas RLS...');
    const checkPoliciesSQL = `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd
      FROM pg_policies 
      WHERE tablename = 'members'
      ORDER BY policyname;
    `;

    const { data: policiesData, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { sql: checkPoliciesSQL });

    if (policiesError) {
      console.error('❌ Erro ao consultar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS encontradas:', policiesData?.length || 0);
      if (policiesData && policiesData.length > 0) {
        policiesData.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

testExecSQL();