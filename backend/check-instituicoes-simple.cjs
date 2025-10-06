const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkInstituicoesSimple() {
  try {
    console.log('🔍 Verificando estrutura da tabela instituicoes...\n');
    
    // 1. Listar todas as tabelas
    console.log('📋 Listando todas as tabelas do schema public:');
    const { data: allTables, error: allTablesError } = await supabase.rpc('exec_sql', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    });
    
    if (allTablesError) {
      console.error('❌ Erro ao listar tabelas:', allTablesError);
      return;
    }
    
    console.log('Tabelas encontradas:');
    if (allTables && allTables.success) {
      console.log('✅ Query executada com sucesso');
      console.log('Rows affected:', allTables.rows_affected);
    }
    
    // 2. Tentar acessar diretamente a tabela instituicoes
    console.log('\n🔍 Tentando acessar a tabela instituicoes diretamente:');
    const { data: directAccess, error: directError } = await supabase
      .from('instituicoes')
      .select('*')
      .limit(1);
    
    if (directError) {
      console.error('❌ Erro ao acessar tabela diretamente:', directError);
    } else {
      console.log('✅ Acesso direto à tabela funcionou!');
      console.log('Dados encontrados:', directAccess?.length || 0, 'registros');
      
      if (directAccess && directAccess.length > 0) {
        console.log('\n📊 Estrutura baseada no primeiro registro:');
        const firstRecord = directAccess[0];
        Object.keys(firstRecord).forEach(key => {
          console.log(`📌 ${key}: ${typeof firstRecord[key]} (valor: ${firstRecord[key]})`);
        });
        
        // Verificar se tem coluna documentos
        const hasDocumentos = Object.keys(firstRecord).includes('documentos');
        console.log(`\n🔍 Coluna 'documentos' existe: ${hasDocumentos ? '✅ SIM' : '❌ NÃO'}`);
      }
    }
    
    // 3. Tentar usar DESCRIBE ou \d (PostgreSQL)
    console.log('\n🔍 Tentando obter estrutura da tabela via SQL:');
    const { data: tableStructure, error: structureError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_name = 'instituicoes'
        ORDER BY ordinal_position
      `
    });
    
    if (structureError) {
      console.error('❌ Erro ao obter estrutura:', structureError);
    } else {
      console.log('✅ Estrutura obtida via SQL');
      console.log('Response:', tableStructure);
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

checkInstituicoesSimple();