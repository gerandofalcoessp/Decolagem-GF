const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS para storage.objects...\n');
  
  try {
    // Verificar políticas RLS existentes
    const { data: policies, error } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'objects')
      .eq('schemaname', 'storage');

    if (error) {
      console.error('❌ Erro ao consultar políticas:', error.message);
      return;
    }

    console.log('📋 Políticas RLS encontradas:');
    if (policies && policies.length > 0) {
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}`);
        console.log(`    Comando: ${policy.cmd}`);
        console.log(`    Roles: ${policy.roles}`);
        console.log(`    Qual: ${policy.qual}`);
        console.log(`    With Check: ${policy.with_check}`);
        console.log('');
      });
    } else {
      console.log('  Nenhuma política encontrada');
    }

    // Verificar se a função exec_sql existe
    console.log('\n🔧 Verificando função exec_sql...');
    const { data: functions, error: funcError } = await supabaseAdmin.rpc('exec_sql', {
      sql: "SELECT 1 as test"
    });

    if (funcError) {
      console.error('❌ Função exec_sql não existe ou tem erro:', funcError.message);
      
      // Tentar criar as políticas diretamente
      console.log('\n🔨 Tentando criar políticas diretamente...');
      await createPoliciesDirectly();
    } else {
      console.log('✅ Função exec_sql está funcionando');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function createPoliciesDirectly() {
  const policies = [
    {
      name: 'documentos_select_policy',
      sql: `
        DROP POLICY IF EXISTS "documentos_select_policy" ON storage.objects;
        CREATE POLICY "documentos_select_policy" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documentos' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    {
      name: 'documentos_insert_policy', 
      sql: `
        DROP POLICY IF EXISTS "documentos_insert_policy" ON storage.objects;
        CREATE POLICY "documentos_insert_policy" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documentos' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    {
      name: 'documentos_update_policy',
      sql: `
        DROP POLICY IF EXISTS "documentos_update_policy" ON storage.objects;
        CREATE POLICY "documentos_update_policy" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documentos' AND 
          auth.role() = 'authenticated'
        );
      `
    },
    {
      name: 'documentos_delete_policy',
      sql: `
        DROP POLICY IF EXISTS "documentos_delete_policy" ON storage.objects;
        CREATE POLICY "documentos_delete_policy" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documentos' AND 
          auth.role() = 'authenticated'
        );
      `
    }
  ];

  for (const policy of policies) {
    try {
      console.log(`🔨 Criando política ${policy.name}...`);
      
      // Usar uma query SQL direta
      const { error } = await supabaseAdmin
        .from('dummy') // Não importa a tabela, vamos usar rpc
        .select('1')
        .limit(0);

      // Tentar usar uma abordagem diferente
      const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
        sql: policy.sql.trim()
      });

      if (policyError) {
        console.error(`❌ Erro ao criar ${policy.name}:`, policyError.message);
      } else {
        console.log(`✅ Política ${policy.name} criada com sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro geral ao criar ${policy.name}:`, err.message);
    }
  }
}

checkRLSPolicies();