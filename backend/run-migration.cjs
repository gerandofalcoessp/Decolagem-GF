const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeMigration() {
  try {
    console.log('🚀 Iniciando migração para separar tabelas...');
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./migrations/20250124_separate_activities_tables.sql', 'utf8');
    
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
    
    // Verificar as novas tabelas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const { data: regionalCount, error: regionalError } = await supabase
      .from('regional_activities')
      .select('*', { count: 'exact', head: true });
      
    const { data: calendarCount, error: calendarError } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true });
    
    if (!regionalError && !calendarError) {
      console.log('📈 Atividades regionais migradas:', regionalCount?.length || 0);
      console.log('📅 Eventos de calendário migrados:', calendarCount?.length || 0);
    }
    
    // Verificar backup
    const { data: backupCount, error: backupError } = await supabase
      .from('activities_backup')
      .select('*', { count: 'exact', head: true });
      
    if (!backupError) {
      console.log('💾 Backup criado com:', backupCount?.length || 0, 'registros');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

executeMigration();