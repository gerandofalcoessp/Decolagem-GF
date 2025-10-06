const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLSPolicies() {
  try {
    console.log('🔧 Aplicando correção nas políticas RLS para calendar_events...');
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./fix-calendar-events-rls.sql', 'utf8');
    
    console.log('📄 Script SQL:');
    console.log(sqlScript);
    
    // Executar o script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Erro ao executar script SQL:', error);
      
      // Tentar executar comando por comando
      console.log('🔄 Tentando executar comandos individualmente...');
      
      const commands = sqlScript.split(';').filter(cmd => cmd.trim());
      
      for (const command of commands) {
        if (command.trim()) {
          console.log(`Executando: ${command.trim().substring(0, 50)}...`);
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql: command.trim() });
          if (cmdError) {
            console.error(`❌ Erro no comando: ${cmdError.message}`);
          } else {
            console.log('✅ Comando executado com sucesso');
          }
        }
      }
    } else {
      console.log('✅ Script executado com sucesso!');
    }
    
    console.log('🎉 Correção das políticas RLS concluída!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('\n📋 Para executar manualmente:');
    console.log('1. Abra o Supabase SQL Editor');
    console.log('2. Cole o conteúdo do arquivo fix-calendar-events-rls.sql');
    console.log('3. Execute o script');
  }
}

fixRLSPolicies();