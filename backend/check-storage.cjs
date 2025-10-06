const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkStorage() {
  try {
    console.log('🔍 Verificando buckets do Supabase Storage...');
    
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Erro ao listar buckets:', error);
      return;
    }
    
    console.log('✅ Buckets encontrados:');
    buckets.forEach(bucket => {
      console.log('  -', bucket.name, '(público:', bucket.public, ')');
    });
    
    if (buckets.length === 0) {
      console.log('⚠️ Nenhum bucket encontrado. É necessário criar um bucket para documentos.');
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkStorage();