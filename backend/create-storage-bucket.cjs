const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createDocumentsBucket() {
  try {
    console.log('🔧 Criando bucket para documentos...');
    
    // Criar bucket para documentos
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('documentos', {
      public: false, // Privado para segurança
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Bucket "documentos" já existe!');
      } else {
        console.error('❌ Erro ao criar bucket:', bucketError);
        return;
      }
    } else {
      console.log('✅ Bucket "documentos" criado com sucesso!', bucket);
    }
    
    // Verificar se o bucket foi criado
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError);
      return;
    }
    
    console.log('📋 Buckets disponíveis:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (público: ${bucket.public})`);
    });
    
    // Configurar políticas RLS para o bucket
    console.log('\n🔐 Configurando políticas de acesso...');
    
    const policies = [
      {
        name: 'documentos_select_policy',
        sql: `
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
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects; ${policy.sql}`
        });
        
        if (policyError) {
          console.warn(`⚠️ Aviso ao criar política ${policy.name}:`, policyError.message);
        } else {
          console.log(`✅ Política ${policy.name} criada/atualizada`);
        }
      } catch (err) {
        console.warn(`⚠️ Erro ao criar política ${policy.name}:`, err.message);
      }
    }
    
    console.log('\n🎉 Configuração do Storage concluída!');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

createDocumentsBucket();