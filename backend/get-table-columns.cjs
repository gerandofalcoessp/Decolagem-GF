const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getTableColumns() {
  try {
    console.log('🔍 Obtendo colunas da tabela instituicoes...\n');
    
    // Método 1: Inserir um registro vazio para ver quais campos são obrigatórios
    console.log('📋 Método 1: Tentando inserir registro vazio para identificar campos obrigatórios...');
    const { data: insertTest, error: insertError } = await supabase
      .from('instituicoes')
      .insert({})
      .select();
    
    if (insertError) {
      console.log('❌ Erro esperado ao inserir vazio:', insertError.message);
      console.log('Detalhes:', insertError.details);
    } else {
      console.log('✅ Inserção vazia funcionou (inesperado):', insertTest);
    }
    
    // Método 2: Tentar inserir com um campo mínimo
    console.log('\n📋 Método 2: Tentando inserir com campo nome...');
    const { data: insertWithName, error: nameError } = await supabase
      .from('instituicoes')
      .insert({ nome: 'TESTE_TEMPORARIO' })
      .select();
    
    if (nameError) {
      console.log('❌ Erro ao inserir com nome:', nameError.message);
      console.log('Detalhes:', nameError.details);
    } else {
      console.log('✅ Inserção com nome funcionou:', insertWithName);
      
      if (insertWithName && insertWithName.length > 0) {
        console.log('\n📊 Colunas identificadas no registro inserido:');
        const record = insertWithName[0];
        Object.keys(record).forEach(key => {
          console.log(`📌 ${key}: ${record[key]} (tipo: ${typeof record[key]})`);
        });
        
        // Verificar se tem coluna documentos
        const hasDocumentos = Object.keys(record).includes('documentos');
        console.log(`\n🔍 Coluna 'documentos' existe: ${hasDocumentos ? '✅ SIM' : '❌ NÃO'}`);
        
        // Limpar o registro de teste
        if (record.id) {
          const { error: deleteError } = await supabase
            .from('instituicoes')
            .delete()
            .eq('id', record.id);
          
          if (deleteError) {
            console.log('⚠️ Erro ao deletar registro de teste:', deleteError.message);
          } else {
            console.log('🗑️ Registro de teste removido com sucesso');
          }
        }
      }
    }
    
    // Método 3: Usar PSQL meta-command via exec_sql
    console.log('\n📋 Método 3: Usando query SQL para obter colunas...');
    const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        ORDER BY ordinal_position;
      `
    });
    
    if (sqlError) {
      console.log('❌ Erro na query SQL:', sqlError.message);
    } else {
      console.log('✅ Query SQL executada');
      console.log('Resultado:', sqlResult);
      
      // Como o exec_sql retorna apenas success/rows_affected, vamos tentar outro método
    }
    
    // Método 4: Usar SELECT com LIMIT 0 para obter estrutura
    console.log('\n📋 Método 4: Usando SELECT com LIMIT 0...');
    const { data: emptySelect, error: emptyError } = await supabase
      .from('instituicoes')
      .select('*')
      .limit(0);
    
    if (emptyError) {
      console.log('❌ Erro no SELECT vazio:', emptyError.message);
    } else {
      console.log('✅ SELECT vazio funcionou');
      console.log('Dados:', emptySelect);
      console.log('Tipo:', typeof emptySelect);
      console.log('É array:', Array.isArray(emptySelect));
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

getTableColumns();