const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInstituicoesStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela instituicoes...\n');
    
    // 1. Verificar se a tabela existe usando uma query direta
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'instituicoes');
    
    if (tableError) {
      console.error('❌ Erro ao verificar existência da tabela:', tableError);
      // Tentar método alternativo
      console.log('Tentando método alternativo...');
      
      const { data: allTables, error: allTablesError } = await supabase
        .rpc('exec_sql', {
          sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        });
      
      if (allTablesError) {
        console.error('❌ Erro no método alternativo:', allTablesError);
        return;
      }
      
      console.log('📋 Tabelas encontradas:', allTables);
      return;
    }
    
    const tableExists = tableData && tableData.length > 0;
    console.log('📋 Tabela instituicoes existe:', tableExists);
    
    if (!tableExists) {
      console.log('❌ Tabela instituicoes não existe!');
      return;
    }
    
    // 2. Verificar estrutura das colunas usando query direta
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, character_maximum_length')
      .eq('table_schema', 'public')
      .eq('table_name', 'instituicoes')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return;
    }
    
    console.log('\n📊 Estrutura atual da tabela instituicoes:');
    console.log('=' .repeat(80));
    columns.forEach(col => {
      console.log(`📌 ${col.column_name}`);
      console.log(`   Tipo: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`);
      console.log(`   Nullable: ${col.is_nullable}`);
      console.log(`   Default: ${col.column_default || 'NULL'}`);
      console.log('');
    });
    
    // 3. Verificar especificamente a coluna 'documentos'
    const hasDocumentos = columns.some(col => col.column_name === 'documentos');
    console.log(`🔍 Coluna 'documentos' existe: ${hasDocumentos ? '✅ SIM' : '❌ NÃO'}`);
    
    // 4. Verificar dados existentes
    const { count, error: countError } = await supabase
      .from('instituicoes')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📊 Total de registros na tabela: ${count}`);
    }
    
    // 5. Mostrar alguns registros de exemplo (se existirem)
    if (count && count > 0) {
      const { data: sampleData, error: sampleError } = await supabase
        .from('instituicoes')
        .select('*')
        .limit(3);
      
      if (!sampleError && sampleData.length > 0) {
        console.log('\n📋 Exemplo de registros existentes:');
        console.log('=' .repeat(80));
        sampleData.forEach((row, index) => {
          console.log(`Registro ${index + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
          });
          console.log('');
        });
      }
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

checkInstituicoesStructure();