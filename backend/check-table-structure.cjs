const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Verificando estrutura das tabelas...\n');
  
  const tables = ['regional_activities', 'goals', 'members', 'usuarios', 'instituicoes'];
  
  for (const table of tables) {
    console.log(`📋 Estrutura da tabela: ${table}`);
    
    const query = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = '${table}' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
    
    if (error) {
      console.error(`❌ Erro ao consultar ${table}:`, error.message);
      
      // Tentar método alternativo - consulta direta na tabela
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!tableError && tableData) {
          console.log(`  ✅ Tabela ${table} existe (consultada diretamente)`);
          if (tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            columns.forEach(col => {
              console.log(`  - ${col}`);
            });
          } else {
            console.log(`  📝 Tabela vazia, consultando estrutura...`);
          }
        } else {
          console.log(`  ❌ Tabela ${table} não encontrada`);
        }
      } catch (altError) {
        console.log(`  ❌ Erro alternativo:`, altError.message);
      }
    } else if (data && data.length > 0) {
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log(`  ⚠️  Tabela ${table} não encontrada ou sem colunas`);
    }
    console.log('');
  }
}

checkTableStructure().catch(console.error);