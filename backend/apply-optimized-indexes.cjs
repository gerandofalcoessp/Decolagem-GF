const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carrega variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Configuração do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyOptimizedIndexes() {
  console.log('🚀 Iniciando aplicação dos índices otimizados...\n');

  try {
    // Lê o arquivo SQL com os índices
    const sqlFilePath = path.join(__dirname, 'create-optimized-indexes.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Divide o SQL em comandos individuais
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd && !cmd.startsWith('--') && !cmd.startsWith('COMMENT') && !cmd.startsWith('ANALYZE'));

    console.log(`📋 Encontrados ${sqlCommands.length} comandos de criação de índices\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // Extrai o nome do índice do comando
      const indexNameMatch = command.match(/CREATE INDEX IF NOT EXISTS (\w+)/);
      const indexName = indexNameMatch ? indexNameMatch[1] : `índice ${i + 1}`;

      try {
        console.log(`⏳ Criando ${indexName}...`);
        
        // Executa o comando SQL diretamente usando o cliente Supabase
        const { error } = await supabase
          .from('_temp_sql_execution')
          .select('*')
          .limit(0); // Apenas para testar a conexão
        
        if (error && !error.message.includes('relation "_temp_sql_execution" does not exist')) {
          throw error;
        }

        // Usa uma abordagem alternativa para executar SQL
        const { data, error: sqlError } = await supabase.rpc('sql', { 
          query: command 
        });

        if (sqlError) {
          // Tenta uma abordagem mais direta
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'apikey': SUPABASE_SERVICE_ROLE_KEY
            },
            body: JSON.stringify({ query: command })
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          console.log(`✅ ${indexName} criado com sucesso`);
          successCount++;
        } else {
          console.log(`✅ ${indexName} criado com sucesso`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Erro inesperado ao criar ${indexName}:`, err.message);
        errorCount++;
      }

      // Pequena pausa entre comandos para não sobrecarregar o banco
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Resumo da aplicação dos índices:');
    console.log(`✅ Criados com sucesso: ${successCount}`);
    console.log(`⚠️  Já existiam: ${skipCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📋 Total processados: ${successCount + skipCount + errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Todos os índices foram aplicados com sucesso!');
      
      // Executa ANALYZE nas tabelas principais para atualizar as estatísticas
      console.log('\n🔍 Atualizando estatísticas das tabelas...');
      const mainTables = ['regional_activities', 'instituicoes', 'goals', 'usuarios', 'members'];
      
      for (const table of mainTables) {
        try {
          await supabase.rpc('exec_sql', { 
            sql_query: `ANALYZE ${table}` 
          });
          console.log(`✅ Estatísticas atualizadas para ${table}`);
        } catch (err) {
          console.log(`⚠️  Não foi possível atualizar estatísticas para ${table}: ${err.message}`);
        }
      }
    } else {
      console.log('\n⚠️  Alguns índices não puderam ser criados. Verifique os erros acima.');
    }

  } catch (error) {
    console.error('❌ Erro geral na aplicação dos índices:', error);
    process.exit(1);
  }
}

// Executa o script
applyOptimizedIndexes()
  .then(() => {
    console.log('\n✨ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });