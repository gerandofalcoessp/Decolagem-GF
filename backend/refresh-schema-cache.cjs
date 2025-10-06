const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function refreshSchemaCache() {
  try {
    console.log('🔄 Tentando resolver o problema de cache do schema do Supabase...\n');
    
    // 1. Verificar se a coluna existe no banco de dados
    console.log('🔍 Verificando se a coluna documentos existe no banco...');
    const { data: columnExists, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        AND column_name = 'documentos';
      `
    });
    
    if (columnError) {
      console.error('❌ Erro ao verificar coluna:', columnError);
      return;
    }
    
    console.log('✅ Resultado da verificação:', columnExists);
    
    // 2. Tentar forçar refresh do schema usando NOTIFY
    console.log('\n🔄 Tentando forçar refresh do schema com NOTIFY...');
    const { data: notifyResult, error: notifyError } = await supabase.rpc('exec_sql', {
      sql: `NOTIFY pgrst, 'reload schema';`
    });
    
    if (notifyError) {
      console.error('❌ Erro ao executar NOTIFY:', notifyError);
    } else {
      console.log('✅ NOTIFY executado:', notifyResult);
    }
    
    // 3. Aguardar um pouco para o cache ser atualizado
    console.log('\n⏳ Aguardando 3 segundos para o cache ser atualizado...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 4. Tentar uma operação simples primeiro
    console.log('\n🧪 Testando operação SELECT simples...');
    const { data: selectTest, error: selectError } = await supabase
      .from('instituicoes')
      .select('id, nome, documentos')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro no SELECT:', selectError);
    } else {
      console.log('✅ SELECT funcionou! Dados:', selectTest);
    }
    
    // 5. Se o SELECT funcionou, tentar INSERT
    if (!selectError) {
      console.log('\n🧪 Testando INSERT com documentos...');
      const testData = {
        nome: 'Teste Schema Cache',
        regional: 'nacional',
        programa: 'decolagem',
        documentos: [{ tipo: 'teste', nome: 'cache_test.pdf' }]
      };
      
      const { data: insertResult, error: insertError } = await supabase
        .from('instituicoes')
        .insert(testData)
        .select('*')
        .single();
      
      if (insertError) {
        console.error('❌ Erro no INSERT:', insertError);
        
        // Tentar sem a coluna documentos para ver se é específico dela
        console.log('\n🧪 Testando INSERT sem documentos...');
        const testDataWithoutDocs = {
          nome: 'Teste Sem Documentos',
          regional: 'nacional',
          programa: 'decolagem'
        };
        
        const { data: insertWithoutDocs, error: insertWithoutDocsError } = await supabase
          .from('instituicoes')
          .insert(testDataWithoutDocs)
          .select('*')
          .single();
        
        if (insertWithoutDocsError) {
          console.error('❌ Erro no INSERT sem documentos:', insertWithoutDocsError);
        } else {
          console.log('✅ INSERT sem documentos funcionou!');
          console.log('📊 Dados:', insertWithoutDocs);
          
          // Tentar UPDATE para adicionar documentos
          console.log('\n🧪 Testando UPDATE para adicionar documentos...');
          const { data: updateResult, error: updateError } = await supabase
            .from('instituicoes')
            .update({ documentos: [{ tipo: 'update_test', nome: 'update_test.pdf' }] })
            .eq('id', insertWithoutDocs.id)
            .select('*')
            .single();
          
          if (updateError) {
            console.error('❌ Erro no UPDATE:', updateError);
          } else {
            console.log('✅ UPDATE funcionou!');
            console.log('📊 Dados atualizados:', updateResult);
          }
          
          // Limpar dados de teste
          console.log('\n🗑️ Limpando dados de teste...');
          const { error: deleteError } = await supabase
            .from('instituicoes')
            .delete()
            .eq('id', insertWithoutDocs.id);
          
          if (deleteError) {
            console.error('⚠️ Erro ao limpar:', deleteError);
          } else {
            console.log('✅ Dados de teste removidos!');
          }
        }
      } else {
        console.log('✅ INSERT com documentos funcionou!');
        console.log('📊 Dados inseridos:', insertResult);
        
        // Limpar dados de teste
        console.log('\n🗑️ Limpando dados de teste...');
        const { error: deleteError } = await supabase
          .from('instituicoes')
          .delete()
          .eq('id', insertResult.id);
        
        if (deleteError) {
          console.error('⚠️ Erro ao limpar:', deleteError);
        } else {
          console.log('✅ Dados de teste removidos!');
        }
      }
    }
    
    // 6. Verificar se há outras formas de refresh
    console.log('\n🔄 Tentando outras formas de refresh...');
    
    // Tentar recriar o cliente Supabase
    console.log('🔄 Recriando cliente Supabase...');
    const newSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data: newClientTest, error: newClientError } = await newSupabase
      .from('instituicoes')
      .select('id, nome, documentos')
      .limit(1);
    
    if (newClientError) {
      console.error('❌ Erro com novo cliente:', newClientError);
    } else {
      console.log('✅ Novo cliente funcionou!');
    }
    
    console.log('\n🎯 Resumo dos testes:');
    console.log('- Coluna existe no banco:', columnExists?.success && columnExists?.rows_affected > 0 ? '✅' : '❌');
    console.log('- NOTIFY executado:', !notifyError ? '✅' : '❌');
    console.log('- SELECT funcionou:', !selectError ? '✅' : '❌');
    console.log('- Novo cliente funcionou:', !newClientError ? '✅' : '❌');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

refreshSchemaCache();