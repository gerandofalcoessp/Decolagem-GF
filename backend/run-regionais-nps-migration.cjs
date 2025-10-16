const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  try {
    console.log('🚀 Iniciando migração para adicionar coluna regionais_nps...');
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./database/migrations/20250124_add_regionais_nps_column.sql', 'utf8');
    
    console.log('📄 Script SQL carregado, executando migração...');
    
    // Executar o script SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlScript
    });
    
    if (error) {
      console.error('❌ Erro na migração:', error);
      return;
    }
    
    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Resultado:', data);
    
    // Verificar se a coluna foi criada
    console.log('\n🔍 Verificando se a coluna regionais_nps foi criada...');
    
    const { data: columnCheck, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'regional_activities')
      .eq('column_name', 'regionais_nps')
      .eq('table_schema', 'public');
    
    if (columnError) {
      console.error('❌ Erro ao verificar coluna:', columnError);
    } else {
      console.log('📋 Resultado da verificação:', columnCheck);
      if (columnCheck && columnCheck.length > 0) {
        console.log('✅ Coluna regionais_nps criada com sucesso!');
        console.log('📋 Detalhes da coluna:', columnCheck[0]);
      } else {
        console.log('⚠️ Coluna regionais_nps não encontrada');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

executeMigration();