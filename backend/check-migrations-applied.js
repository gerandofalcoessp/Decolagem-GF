import 'dotenv/config';
import { supabaseAdmin } from './src/services/supabaseClient.js';

async function checkMigrationsApplied() {
  console.log('🔍 Verificando migrações aplicadas...\n');

  try {
    // 1. Verificar se a tabela migrations existe
    console.log('1. Verificando tabela migrations...');
    const { data: migrations, error: migrationsError } = await supabaseAdmin
      .from('migrations')
      .select('*')
      .order('executed_at', { ascending: false });

    if (migrationsError) {
      console.error('❌ Erro ao consultar migrations:', migrationsError.message);
      return;
    }

    console.log('✅ Migrações encontradas:', migrations.length);
    migrations.forEach(migration => {
      console.log(`  - ${migration.filename} (${migration.executed_at})`);
    });

    // 2. Verificar se a migração RLS específica foi aplicada
    const rlsMigration = migrations.find(m => m.filename.includes('fix_members_rls_policy'));
    if (rlsMigration) {
      console.log('\n✅ Migração RLS encontrada:', rlsMigration.filename);
    } else {
      console.log('\n❌ Migração RLS não encontrada!');
    }

    // 3. Tentar executar uma consulta SQL direta para verificar as políticas
    console.log('\n2. Verificando políticas RLS via SQL...');
    
    // Usar uma consulta simples que funciona com supabaseAdmin
    const { data: testData, error: testError } = await supabaseAdmin
      .rpc('exec_sql', { 
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'members'
          ORDER BY policyname;
        `
      });

    if (testError) {
      console.error('❌ Erro ao consultar políticas via RPC:', testError.message);
      
      // Tentar abordagem alternativa - verificar se conseguimos inserir diretamente
      console.log('\n3. Testando inserção direta...');
      const testInsert = {
        name: 'Teste Direto',
        email: `teste-direto-${Date.now()}@example.com`,
        auth_user_id: null
      };

      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('members')
        .insert(testInsert)
        .select('*')
        .single();

      if (insertError) {
        console.error('❌ Erro na inserção direta:', insertError.message);
        console.error('Código:', insertError.code);
        console.error('Detalhes:', insertError.details);
      } else {
        console.log('✅ Inserção direta funcionou:', insertData.name);
        // Limpar
        await supabaseAdmin.from('members').delete().eq('id', insertData.id);
      }
    } else {
      console.log('✅ Políticas RLS encontradas:');
      testData.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

checkMigrationsApplied();