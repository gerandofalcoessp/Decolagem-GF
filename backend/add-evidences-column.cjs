const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addEvidencesColumn() {
  try {
    console.log('🚀 Adicionando coluna evidences à tabela regional_activities...');
    
    // Adicionar coluna evidences como JSONB para armazenar array de evidências
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE regional_activities 
        ADD COLUMN IF NOT EXISTS evidences JSONB DEFAULT '[]'::jsonb;
        
        -- Adicionar comentário para documentar a estrutura esperada
        COMMENT ON COLUMN regional_activities.evidences IS 'Array de objetos com estrutura: [{"url": "data:image/jpeg;base64,...", "name": "filename.jpg"}]';
      `
    });
    
    if (error) {
      console.error('❌ Erro ao adicionar coluna:', error);
      return;
    }
    
    console.log('✅ Coluna evidences adicionada com sucesso!');
    
    // Verificar se a coluna foi criada
    const { data: columns, error: checkError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'regional_activities' 
        AND column_name = 'evidences';
      `
    });
    
    if (!checkError && columns && columns.length > 0) {
      console.log('📊 Coluna criada:', columns[0]);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addEvidencesColumn();