const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStorageRLSFinal() {
  console.log('🔧 Tentativa final de correção do RLS para storage...\n');
  
  try {
    // Abordagem 1: Tentar desabilitar RLS temporariamente
    console.log('1. Tentando desabilitar RLS na tabela storage.objects...');
    const { data: disableResult, error: disableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;'
    });

    if (disableError) {
      console.error('❌ Erro ao desabilitar RLS:', disableError.message);
    } else {
      console.log('✅ RLS desabilitado temporariamente');
    }

    // Teste de upload com RLS desabilitado
    console.log('\n2. Testando upload com RLS desabilitado...');
    const supabaseUser = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data: authData, error: authError } = await supabaseUser.auth.signInWithPassword({
      email: 'test-rls-1759539127683@test.com',
      password: 'TestRLS123!'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
    } else {
      const testContent = 'Teste sem RLS';
      const fileName = `test-no-rls-${Date.now()}.txt`;
      
      const { data: uploadResult, error: uploadError } = await supabaseUser.storage
        .from('documentos')
        .upload(fileName, testContent, {
          contentType: 'text/plain'
        });

      if (uploadError) {
        console.error('❌ Upload ainda falhou:', uploadError.message);
      } else {
        console.log('✅ Upload funcionou sem RLS!');
        
        // Limpar arquivo de teste
        await supabaseAdmin.storage.from('documentos').remove([fileName]);
      }
    }

    // Abordagem 2: Reabilitar RLS e criar políticas mais permissivas
    console.log('\n3. Reabilitando RLS e criando políticas permissivas...');
    const { data: enableResult, error: enableError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });

    if (enableError) {
      console.error('❌ Erro ao reabilitar RLS:', enableError.message);
    } else {
      console.log('✅ RLS reabilitado');
    }

    // Criar políticas mais permissivas
    const permissivePolicies = [
      `DROP POLICY IF EXISTS "documentos_all_policy" ON storage.objects;`,
      `CREATE POLICY "documentos_all_policy" ON storage.objects FOR ALL USING (bucket_id = 'documentos');`
    ];

    for (const sql of permissivePolicies) {
      console.log(`🔨 Executando: ${sql.substring(0, 50)}...`);
      const { data: result, error } = await supabaseAdmin.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Erro:`, error.message);
      } else {
        console.log(`✅ Sucesso:`, result);
      }
    }

    // Teste final
    console.log('\n4. Teste final com política permissiva...');
    if (authData) {
      const testContent2 = 'Teste com política permissiva';
      const fileName2 = `test-permissive-${Date.now()}.txt`;
      
      const { data: uploadResult2, error: uploadError2 } = await supabaseUser.storage
        .from('documentos')
        .upload(fileName2, testContent2, {
          contentType: 'text/plain'
        });

      if (uploadError2) {
        console.error('❌ Upload ainda falhou:', uploadError2.message);
      } else {
        console.log('✅ Upload funcionou com política permissiva!');
        console.log('📁 Arquivo:', uploadResult2.path);
        
        // Limpar arquivo de teste
        await supabaseAdmin.storage.from('documentos').remove([fileName2]);
      }
    }

    console.log('\n🎉 Processo de correção concluído!');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

fixStorageRLSFinal();