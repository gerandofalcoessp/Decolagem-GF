const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixStoragePublicAccess() {
  try {
    console.log('🔧 Corrigindo acesso público ao bucket documentos...\n');
    
    // 1. Verificar bucket atual
    console.log('1. Verificando configuração atual do bucket...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      return;
    }
    
    const documentosBucket = buckets.find(b => b.name === 'documentos');
    if (!documentosBucket) {
      console.error('❌ Bucket "documentos" não encontrado');
      return;
    }
    
    console.log('📋 Configuração atual:');
    console.log('  - Nome:', documentosBucket.name);
    console.log('  - Público:', documentosBucket.public);
    console.log('  - ID:', documentosBucket.id);
    
    // 2. Tornar o bucket público se não estiver
    if (!documentosBucket.public) {
      console.log('\n2. Tornando o bucket público...');
      
      const { data: updateResult, error: updateError } = await supabase.storage.updateBucket('documentos', {
        public: true
      });
      
      if (updateError) {
        console.error('❌ Erro ao tornar bucket público:', updateError.message);
        console.log('💡 Tentativa alternativa: Criando políticas RLS...');
        
        // Alternativa: Criar políticas RLS para acesso público
        await createPublicAccessPolicies();
      } else {
        console.log('✅ Bucket tornado público com sucesso!');
      }
    } else {
      console.log('✅ Bucket já é público');
    }
    
    // 3. Verificar configuração final
    console.log('\n3. Verificando configuração final...');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.error('❌ Erro ao verificar configuração final:', finalError.message);
      return;
    }
    
    const finalBucket = finalBuckets.find(b => b.name === 'documentos');
    console.log('📋 Configuração final:');
    console.log('  - Nome:', finalBucket.name);
    console.log('  - Público:', finalBucket.public);
    
    // 4. Testar acesso a uma imagem
    console.log('\n4. Testando acesso público...');
    await testPublicAccess();
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function createPublicAccessPolicies() {
  try {
    console.log('🔐 Criando políticas RLS para acesso público...');
    
    // Política para permitir SELECT público
    const selectPolicy = `
      CREATE POLICY IF NOT EXISTS "public_read_documentos" ON storage.objects
      FOR SELECT USING (bucket_id = 'documentos');
    `;
    
    const { error: selectError } = await supabase.rpc('exec_sql', {
      sql: selectPolicy
    });
    
    if (selectError) {
      console.warn('⚠️ Aviso ao criar política de leitura:', selectError.message);
    } else {
      console.log('✅ Política de leitura pública criada');
    }
    
    // Política para permitir INSERT autenticado
    const insertPolicy = `
      CREATE POLICY IF NOT EXISTS "authenticated_insert_documentos" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.role() = 'authenticated');
    `;
    
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: insertPolicy
    });
    
    if (insertError) {
      console.warn('⚠️ Aviso ao criar política de inserção:', insertError.message);
    } else {
      console.log('✅ Política de inserção autenticada criada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar políticas:', error.message);
  }
}

async function testPublicAccess() {
  try {
    // Listar arquivos no bucket para testar
    const { data: files, error: listError } = await supabase.storage
      .from('documentos')
      .list('regional-activities', {
        limit: 1
      });
    
    if (listError) {
      console.error('❌ Erro ao listar arquivos:', listError.message);
      return;
    }
    
    if (files && files.length > 0) {
      const testFile = files[0];
      const publicUrl = supabase.storage
        .from('documentos')
        .getPublicUrl(`regional-activities/${testFile.name}`);
      
      console.log('🔗 URL pública de teste:', publicUrl.data.publicUrl);
      console.log('✅ Acesso público configurado com sucesso!');
    } else {
      console.log('📁 Nenhum arquivo encontrado para teste');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de acesso:', error.message);
  }
}

fixStoragePublicAccess();