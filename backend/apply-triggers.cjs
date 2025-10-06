const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyTriggers() {
  try {
    console.log('📋 Aplicando triggers de sincronização...');
    
    const sql = fs.readFileSync('./database/triggers/sync_usuarios_with_auth.sql', 'utf8');
    
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ Erro ao aplicar triggers:', error);
      return;
    }
    
    console.log('✅ Triggers aplicados com sucesso!');
    console.log('📊 Resultado:', data);
    
    // Testar se as funções foram criadas
    const { data: functions, error: funcError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT proname FROM pg_proc WHERE proname LIKE 'sync_user_%' OR proname = 'manual_sync_usuarios_with_auth';"
      });
    
    if (funcError) {
      console.error('❌ Erro ao verificar funções:', funcError);
    } else {
      console.log('🔍 Funções criadas:', functions);
    }
    
    // Testar se os triggers foram criados
    const { data: triggers, error: trigError } = await supabase
      .rpc('exec_sql', { 
        sql: "SELECT tgname FROM pg_trigger WHERE tgname LIKE '%sync_usuarios%';"
      });
    
    if (trigError) {
      console.error('❌ Erro ao verificar triggers:', trigError);
    } else {
      console.log('🎯 Triggers criados:', triggers);
    }
    
    console.log('\n🎉 Aplicação de triggers concluída!');
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

applyTriggers();