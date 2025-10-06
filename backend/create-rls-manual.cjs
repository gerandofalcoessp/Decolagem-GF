const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createRLSPoliciesManual() {
  console.log('🔨 Criando políticas RLS manualmente...\n');
  
  try {
    // Primeiro, vamos verificar se a função exec_sql funciona
    console.log('🧪 Testando função exec_sql...');
    const { data: testResult, error: testError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'SELECT 1 as test_value;'
    });

    if (testError) {
      console.error('❌ Função exec_sql não funciona:', testError.message);
      return;
    }

    console.log('✅ Função exec_sql está funcionando:', testResult);

    // Agora vamos criar as políticas uma por uma
    const policies = [
      {
        name: 'documentos_select_policy',
        sql: `CREATE POLICY "documentos_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');`
      },
      {
        name: 'documentos_insert_policy',
        sql: `CREATE POLICY "documentos_insert_policy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');`
      },
      {
        name: 'documentos_update_policy',
        sql: `CREATE POLICY "documentos_update_policy" ON storage.objects FOR UPDATE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');`
      },
      {
        name: 'documentos_delete_policy',
        sql: `CREATE POLICY "documentos_delete_policy" ON storage.objects FOR DELETE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');`
      }
    ];

    for (const policy of policies) {
      console.log(`\n🔨 Criando política: ${policy.name}`);
      
      // Primeiro, remover a política se existir
      console.log('  🗑️ Removendo política existente...');
      const { error: dropError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`
      });

      if (dropError) {
        console.warn('  ⚠️ Aviso ao remover política:', dropError.message);
      } else {
        console.log('  ✅ Política removida (se existia)');
      }

      // Agora criar a nova política
      console.log('  🔨 Criando nova política...');
      const { data: createResult, error: createError } = await supabaseAdmin.rpc('exec_sql', {
        sql: policy.sql
      });

      if (createError) {
        console.error(`  ❌ Erro ao criar política ${policy.name}:`, createError.message);
      } else {
        console.log(`  ✅ Política ${policy.name} criada com sucesso!`);
        console.log('  📊 Resultado:', createResult);
      }
    }

    // Verificar se as políticas foram criadas
    console.log('\n🔍 Verificando políticas criadas...');
    const { data: checkResult, error: checkError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname LIKE '%documentos%';
      `
    });

    if (checkError) {
      console.error('❌ Erro ao verificar políticas:', checkError.message);
    } else {
      console.log('📋 Políticas encontradas:', checkResult);
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

createRLSPoliciesManual();