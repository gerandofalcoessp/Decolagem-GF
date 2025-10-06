const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('🔍 Verificando variáveis de ambiente...');
console.log('SUPABASE_URL:', supabaseUrl ? 'Definido' : 'Não definido');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Definido' : 'Não definido');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Definido' : 'Não definido');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

async function runMigration() {
  try {
    console.log('🔍 Executando migração das colunas faltantes...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Ler o arquivo SQL
    const sqlScript = fs.readFileSync('./add-missing-regional-activities-columns.sql', 'utf8');
    
    console.log('📄 Executando script SQL...');
    
    // Executar o script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar executar comando por comando
      console.log('🔄 Tentando executar comandos individualmente...');
      
      const commands = [
        'ALTER TABLE regional_activities ADD COLUMN IF NOT EXISTS programa VARCHAR(100);',
        'ALTER TABLE regional_activities ADD COLUMN IF NOT EXISTS estados JSONB DEFAULT \'[]\'::jsonb;',
        'ALTER TABLE regional_activities ADD COLUMN IF NOT EXISTS instituicao_id UUID;',
        'ALTER TABLE regional_activities ADD COLUMN IF NOT EXISTS quantidade INTEGER;',
        'ALTER TABLE regional_activities ADD COLUMN IF NOT EXISTS atividade_label VARCHAR(255);',
        'ALTER TABLE regional_activities ADD COLUMN IF NOT EXISTS atividade_custom_label VARCHAR(255);'
      ];
      
      for (const cmd of commands) {
        console.log(`Executando: ${cmd}`);
        const { error: cmdError } = await supabase.rpc('exec_sql', { sql: cmd });
        if (cmdError) {
          console.error(`❌ Erro no comando: ${cmdError.message}`);
        } else {
          console.log('✅ Comando executado com sucesso');
        }
      }
    } else {
      console.log('✅ Script executado com sucesso');
    }
    
    // Verificar se as colunas foram adicionadas
    console.log('🔍 Verificando colunas da tabela regional_activities...');
    const { data: columns, error: colError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'regional_activities')
      .eq('table_schema', 'public');
    
    if (colError) {
      console.error('❌ Erro ao verificar colunas:', colError);
    } else {
      console.log('📋 Colunas da tabela regional_activities:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

runMigration();