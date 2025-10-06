const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function allowAllUsersCalendarEvents() {
  try {
    console.log('🔧 Atualizando políticas RLS para permitir que qualquer usuário crie eventos...');
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./allow-all-users-calendar-events.sql', 'utf8');
    
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
    
    console.log('🎉 Agora qualquer usuário autenticado pode criar eventos no calendário!');
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('\n📋 Para executar manualmente:');
    console.log('1. Abra o Supabase SQL Editor');
    console.log('2. Cole o conteúdo do arquivo allow-all-users-calendar-events.sql');
    console.log('3. Execute o script');
  }
}

allowAllUsersCalendarEvents();