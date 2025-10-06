const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Criar cliente com service role para testes administrativos
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Criar cliente normal para testes de usuário
const supabaseUser = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testStorageRLS() {
  try {
    console.log('🔍 Testando políticas RLS do Storage...\n');
    
    // Login como admin
    console.log('🔐 Fazendo login como usuário de teste...');
    const { data: authData, error: authError } = await supabaseUser.auth.signInWithPassword({
      email: 'test-rls-1759539127683@test.com',
      password: 'TestRLS123!'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', authData.user.email);
    console.log('🎫 Token:', authData.session.access_token.substring(0, 50) + '...');
    console.log('🔑 Role:', authData.user.role);
    
    // 2. Verificar se o usuário está autenticado
    const { data: userData, error: userError } = await supabaseUser.auth.getUser();
    if (userError) {
      console.error('❌ Erro ao obter usuário:', userError.message);
      return;
    }
    
    console.log('✅ Usuário autenticado:', userData.user.email);
    
    // 3. Testar acesso ao bucket documentos
    console.log('\n2. Testando acesso ao bucket documentos...');
    
    // Listar buckets
    const { data: buckets, error: bucketsError } = await supabaseUser.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError.message);
    } else {
      console.log('✅ Buckets acessíveis:', buckets.map(b => b.name));
    }
    
    // 4. Testar upload de um arquivo pequeno
    console.log('\n3. Testando upload de arquivo...');
    const testFile = Buffer.from('Teste de conteúdo do arquivo');
    const testPath = `test/test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseUser.storage
      .from('documentos')
      .upload(testPath, testFile, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError.message);
      console.error('❌ Detalhes do erro:', uploadError);
    } else {
      console.log('✅ Upload realizado com sucesso!');
      console.log('📁 Caminho:', uploadData.path);
      
      // 5. Testar download do arquivo
      console.log('\n4. Testando download do arquivo...');
      const { data: downloadData, error: downloadError } = await supabaseUser.storage
        .from('documentos')
        .download(testPath);
      
      if (downloadError) {
        console.error('❌ Erro no download:', downloadError.message);
      } else {
        console.log('✅ Download realizado com sucesso!');
        console.log('📊 Tamanho do arquivo:', downloadData.size);
      }
      
      // 6. Limpar arquivo de teste
      console.log('\n5. Limpando arquivo de teste...');
      const { error: deleteError } = await supabaseUser.storage
        .from('documentos')
        .remove([testPath]);
      
      if (deleteError) {
        console.error('❌ Erro ao deletar:', deleteError.message);
      } else {
        console.log('✅ Arquivo de teste removido!');
      }
    }
    
    // 7. Verificar políticas RLS existentes
    console.log('\n6. Verificando políticas RLS existentes...');
    const { data: policies, error: policiesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
        ORDER BY policyname;
      `
    });
    
    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError.message);
    } else {
      console.log('📋 Políticas RLS encontradas:');
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive})`);
          console.log(`    Condição: ${policy.qual || 'N/A'}`);
          console.log(`    Check: ${policy.with_check || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('  Nenhuma política encontrada');
      }
    }
    
    console.log('\n🎉 Teste concluído!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testStorageRLS();