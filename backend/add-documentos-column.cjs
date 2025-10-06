const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addDocumentosColumn() {
  try {
    console.log('🔧 Adicionando coluna documentos à tabela instituicoes...\n');
    
    // 1. Verificar se a coluna já existe
    console.log('🔍 Verificando se a coluna documentos já existe...');
    const { data: columnCheck, error: columnError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name
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
    
    if (columnCheck && columnCheck.success && columnCheck.rows_affected > 0) {
      console.log('✅ A coluna documentos já existe! Nenhuma ação necessária.');
      return;
    }
    
    console.log('❌ A coluna documentos não existe. Adicionando...');
    
    // 2. Adicionar a coluna documentos
    console.log('🔧 Executando ALTER TABLE para adicionar coluna documentos...');
    const { data: alterResult, error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE public.instituicoes 
        ADD COLUMN documentos jsonb DEFAULT '[]'::jsonb;
      `
    });
    
    if (alterError) {
      console.error('❌ Erro ao adicionar coluna documentos:', alterError);
      return;
    }
    
    console.log('✅ Coluna documentos adicionada com sucesso!', alterResult);
    
    // 3. Verificar se a coluna foi criada corretamente
    console.log('\n🔍 Verificando se a coluna foi criada corretamente...');
    const { data: verifyResult, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        AND column_name = 'documentos';
      `
    });
    
    if (verifyError) {
      console.error('❌ Erro ao verificar coluna criada:', verifyError);
      return;
    }
    
    console.log('✅ Verificação da coluna criada:', verifyResult);
    
    // 4. Testar inserção de dados com a nova coluna
    console.log('\n🧪 Testando inserção com a nova coluna...');
    const testData = {
      nome: 'Teste Documentos',
      regional: 'nacional',
      programa: 'decolagem',
      documentos: [{ tipo: 'teste', nome: 'documento_teste.pdf' }]
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('instituicoes')
      .insert(testData)
      .select('*')
      .single();
    
    if (insertError) {
      console.error('❌ Erro ao testar inserção:', insertError);
      return;
    }
    
    console.log('✅ Teste de inserção bem-sucedido!');
    console.log('📊 Dados inseridos:', {
      id: insertResult.id,
      nome: insertResult.nome,
      documentos: insertResult.documentos
    });
    
    // 5. Limpar dados de teste
    console.log('\n🗑️ Removendo dados de teste...');
    const { error: deleteError } = await supabase
      .from('instituicoes')
      .delete()
      .eq('id', insertResult.id);
    
    if (deleteError) {
      console.error('⚠️ Erro ao remover dados de teste:', deleteError);
    } else {
      console.log('✅ Dados de teste removidos com sucesso!');
    }
    
    // 6. Mostrar estrutura final da tabela
    console.log('\n📊 Estrutura final da tabela instituicoes:');
    const { data: finalStructure, error: finalError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          ordinal_position
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'instituicoes'
        ORDER BY ordinal_position;
      `
    });
    
    if (finalError) {
      console.error('❌ Erro ao obter estrutura final:', finalError);
    } else {
      console.log('✅ Estrutura final obtida:', finalStructure);
    }
    
    console.log('\n🎉 Processo concluído! A coluna documentos foi adicionada com sucesso.');
    
  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

addDocumentosColumn();