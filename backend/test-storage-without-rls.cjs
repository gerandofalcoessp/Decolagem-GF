const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Cliente com service role (bypassa RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Cliente normal (sujeito a RLS)
const supabaseUser = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testStorageWithoutRLS() {
  console.log('🧪 Testando upload com service role (sem RLS)...\n');
  
  try {
    // Teste 1: Upload com service role (deve funcionar)
    console.log('1. Testando upload com service role...');
    const testContent = 'Teste de conteúdo para arquivo';
    const fileName = `test-admin-${Date.now()}.txt`;
    
    const { data: adminUpload, error: adminError } = await supabaseAdmin.storage
      .from('documentos')
      .upload(fileName, testContent, {
        contentType: 'text/plain'
      });

    if (adminError) {
      console.error('❌ Erro no upload com service role:', adminError.message);
    } else {
      console.log('✅ Upload com service role funcionou!');
      console.log('📁 Arquivo:', adminUpload.path);
    }

    // Teste 2: Login com usuário normal e tentar upload
    console.log('\n2. Testando upload com usuário normal...');
    
    const { data: authData, error: authError } = await supabaseUser.auth.signInWithPassword({
      email: 'test-rls-1759539127683@test.com',
      password: 'TestRLS123!'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('🎫 Token:', authData.session.access_token.substring(0, 50) + '...');

    // Tentar upload com usuário normal
    const fileName2 = `test-user-${Date.now()}.txt`;
    const { data: userUpload, error: userError } = await supabaseUser.storage
      .from('documentos')
      .upload(fileName2, testContent, {
        contentType: 'text/plain'
      });

    if (userError) {
      console.error('❌ Erro no upload com usuário normal:', userError.message);
      console.error('📊 Detalhes:', userError);
    } else {
      console.log('✅ Upload com usuário normal funcionou!');
      console.log('📁 Arquivo:', userUpload.path);
    }

    // Teste 3: Verificar se o bucket permite uploads públicos
    console.log('\n3. Verificando configurações do bucket...');
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Erro ao listar buckets:', bucketError.message);
    } else {
      const documentosBucket = buckets.find(b => b.name === 'documentos');
      if (documentosBucket) {
        console.log('📋 Configurações do bucket documentos:');
        console.log('  - Público:', documentosBucket.public);
        console.log('  - ID:', documentosBucket.id);
        console.log('  - Criado em:', documentosBucket.created_at);
      }
    }

    // Limpeza: remover arquivos de teste
    console.log('\n4. Limpando arquivos de teste...');
    if (adminUpload) {
      await supabaseAdmin.storage.from('documentos').remove([fileName]);
      console.log('🗑️ Arquivo admin removido');
    }
    if (userUpload) {
      await supabaseAdmin.storage.from('documentos').remove([fileName2]);
      console.log('🗑️ Arquivo user removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

testStorageWithoutRLS();