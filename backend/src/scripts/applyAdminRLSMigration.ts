import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient.js';
import fs from 'fs';
import path from 'path';

async function applyAdminRLSMigration() {
  console.log('🚀 Aplicando migração RLS para super admins...\n');

  try {
    // 1. Ler o arquivo de migração
    const migrationPath = path.join(process.cwd(), 'migrations', '20250120_fix_admin_members_rls_policy.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Arquivo de migração não encontrado:', migrationPath);
      return;
    }

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
        policiesData.forEach((policy: any) => {
          console.log(`  - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    }

    // 4. Verificar se a função is_super_admin foi criada
    console.log('\n🔍 Verificando função is_super_admin...');
    const checkFunctionSQL = `
      SELECT proname, prosrc 
      FROM pg_proc 
      WHERE proname = 'is_super_admin';
    `;

    const { data: functionData, error: functionError } = await supabaseAdmin
      .rpc('exec_sql', { sql: checkFunctionSQL });

    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError.message);
    } else {
      if (functionData && functionData.length > 0) {
        console.log('✅ Função is_super_admin criada com sucesso');
      } else {
        console.log('❌ Função is_super_admin não encontrada');
      }
    }

    // 5. Testar a função is_super_admin
    console.log('\n🧪 Testando função is_super_admin...');
    const testFunctionSQL = `SELECT is_super_admin() as is_admin;`;
    
    const { data: testData, error: testError } = await supabaseAdmin
      .rpc('exec_sql', { sql: testFunctionSQL });

    if (testError) {
      console.error('❌ Erro ao testar função:', testError.message);
    } else {
      console.log('✅ Função testada:', testData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
applyAdminRLSMigration();

export default applyAdminRLSMigration;