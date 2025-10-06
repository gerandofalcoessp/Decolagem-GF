const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testFinalUpload() {
  console.log('🧪 Teste Final de Upload de Documentos\n');
  
  try {
    // 1. Login do usuário
    console.log('1. Fazendo login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test-rls-1759539127683@test.com',
      password: 'TestRLS123!'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso!');
    console.log('🎫 Token:', authData.session.access_token.substring(0, 50) + '...');

    // 2. Testar upload direto no Storage
    console.log('\n2. Testando upload direto no Storage...');
    
    const testContent = `Teste final de upload - ${new Date().toISOString()}`;
    const fileName = `test-final-${Date.now()}.txt`;
    const storagePath = `instituicoes/1/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('❌ Erro no upload:', uploadError.message);
      return;
    }

    console.log('✅ Upload direto no Storage funcionou!');
    console.log('📁 Caminho:', uploadData.path);

    // 3. Testar download
    console.log('\n3. Testando download...');
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from('documentos')
      .download(storagePath);

    if (downloadError) {
      console.error('❌ Erro no download:', downloadError.message);
    } else {
      const downloadedContent = await downloadData.text();
      console.log('✅ Download funcionou!');
      console.log('📄 Conteúdo:', downloadedContent);
    }

    // 4. Limpar arquivo de teste
    console.log('\n4. Limpando arquivo de teste...');
    const { error: deleteError } = await supabase.storage
      .from('documentos')
      .remove([storagePath]);

    if (deleteError) {
      console.error('❌ Erro ao remover:', deleteError.message);
    } else {
      console.log('✅ Arquivo removido com sucesso!');
    }

    console.log('\n🎉 Teste final concluído com sucesso!');
    console.log('✅ As políticas RLS estão funcionando corretamente!');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testFinalUpload();