import 'dotenv/config';
import { supabaseAdmin } from './src/services/supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function applyRLSMigration() {
  console.log('🚀 Aplicando migração RLS manualmente...\n');

  try {
    // 1. Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'migrations', '20250120_fix_members_rls_policy.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migração carregada:', migrationPath);

    // 2. Aplicar a migração usando exec_sql
    console.log('\n🔧 Executando migração...');
    const { data, error } = await supabaseAdmin
      .rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Erro ao aplicar migração:', error.message);
      console.error('Código:', error.code);
      console.error('Detalhes:', error.details);
      return;
    }

    console.log('✅ Migração aplicada com sucesso!');

    // 3. Verificar se as políticas foram criadas
    console.log('\n🔍 Verificando políticas criadas...');
    const checkPoliciesSQL = `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd
      FROM pg_policies 
      WHERE tablename = 'members'
      ORDER BY policyname;
    `;

    const { data: policiesData, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', { sql: checkPoliciesSQL });

    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas RLS encontradas:', policiesData?.length || 0);
      if (policiesData && policiesData.length > 0) {
        policiesData.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    }

    // 4. Registrar a migração na tabela migrations
    console.log('\n📝 Registrando migração...');
    const migrationId = '20250120_fix_members_rls_policy';
    const migrationName = 'Fix Members RLS Policy';

    const insertMigrationSQL = `
      INSERT INTO migrations (id, name, executed_at) 
      VALUES ('${migrationId}', '${migrationName}', NOW())
      ON CONFLICT (id) DO NOTHING;
    `;

    const { data: insertData, error: insertError } = await supabaseAdmin
      .rpc('exec_sql', { sql: insertMigrationSQL });

    if (insertError) {
      console.error('❌ Erro ao registrar migração:', insertError.message);
    } else {
      console.log('✅ Migração registrada na tabela migrations');
    }

    // 5. Teste final - tentar inserir um membro
    console.log('\n🧪 Testando inserção de membro...');
    const testMember = {
      name: 'Teste RLS',
      email: `teste-rls-${Date.now()}@example.com`,
      auth_user_id: null
    };

    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('members')
      .insert(testMember)
      .select('*')
      .single();

    if (memberError) {
      console.error('❌ Erro ao testar inserção:', memberError.message);
    } else {
      console.log('✅ Teste de inserção funcionou:', memberData.name);
      
      // Limpar teste
      await supabaseAdmin.from('members').delete().eq('id', memberData.id);
      console.log('🧹 Membro de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('Stack:', error.stack);
  }
}

applyRLSMigration();