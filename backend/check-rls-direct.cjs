const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSPoliciesDirect() {
  console.log('🔍 Verificando políticas RLS para storage.objects usando SQL direto...\n');
  
  try {
    // Verificar políticas RLS existentes usando SQL direto
    const sqlQuery = `
      SELECT 
        policyname,
        cmd,
        roles,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects'
      AND policyname LIKE '%documentos%';
    `;

    console.log('📋 Executando consulta SQL...');
    const { data: policies, error } = await supabaseAdmin.rpc('exec_sql', {
      sql: sqlQuery
    });

    if (error) {
      console.error('❌ Erro ao consultar políticas:', error.message);
      
      // Tentar uma abordagem alternativa
      console.log('\n🔄 Tentando abordagem alternativa...');
      await checkWithAlternativeMethod();
      return;
    }

    console.log('✅ Consulta executada com sucesso');
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
      console.log('  Nenhuma política encontrada para documentos');
    }

    // Verificar se RLS está habilitado na tabela storage.objects
    console.log('\n🔒 Verificando se RLS está habilitado...');
    const rlsQuery = `
      SELECT 
        schemaname,
        tablename,
        rowsecurity
      FROM pg_tables 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects';
    `;

    const { data: rlsStatus, error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: rlsQuery
    });

    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError.message);
    } else {
      console.log('RLS Status:', rlsStatus);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function checkWithAlternativeMethod() {
  console.log('🔄 Usando método alternativo para verificar políticas...');
  
  try {
    // Tentar listar todas as políticas
    const listPoliciesQuery = `
      SELECT policyname 
      FROM pg_policies 
      WHERE schemaname = 'storage' 
      AND tablename = 'objects';
    `;

    const { data: allPolicies, error: listError } = await supabaseAdmin.rpc('exec_sql', {
      sql: listPoliciesQuery
    });

    if (listError) {
      console.error('❌ Erro ao listar políticas:', listError.message);
      
      // Tentar criar as políticas novamente
      console.log('\n🔨 Tentando recriar as políticas...');
      await recreatePolicies();
    } else {
      console.log('📋 Todas as políticas na tabela storage.objects:');
      if (allPolicies && allPolicies.length > 0) {
        allPolicies.forEach(policy => {
          console.log(`  - ${policy.policyname}`);
        });
      } else {
        console.log('  Nenhuma política encontrada');
      }
    }
  } catch (error) {
    console.error('❌ Erro no método alternativo:', error.message);
  }
}

async function recreatePolicies() {
  console.log('🔨 Recriando políticas RLS...');
  
  const policies = [
    `DROP POLICY IF EXISTS "documentos_select_policy" ON storage.objects;`,
    `CREATE POLICY "documentos_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');`,
    
    `DROP POLICY IF EXISTS "documentos_insert_policy" ON storage.objects;`,
    `CREATE POLICY "documentos_insert_policy" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');`,
    
    `DROP POLICY IF EXISTS "documentos_update_policy" ON storage.objects;`,
    `CREATE POLICY "documentos_update_policy" ON storage.objects FOR UPDATE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');`,
    
    `DROP POLICY IF EXISTS "documentos_delete_policy" ON storage.objects;`,
    `CREATE POLICY "documentos_delete_policy" ON storage.objects FOR DELETE USING (bucket_id = 'documentos' AND auth.role() = 'authenticated');`
  ];

  for (const sql of policies) {
    try {
      console.log(`🔨 Executando: ${sql.substring(0, 50)}...`);
      const { error } = await supabaseAdmin.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Erro:`, error.message);
      } else {
        console.log(`✅ Sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro geral:`, err.message);
    }
  }
}

checkRLSPoliciesDirect();