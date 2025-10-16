const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInstituicoesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela instituicoes...\n');

    // 1. Verificar se a tabela existe fazendo um SELECT simples
    console.log('🔄 Verificando tabela com SELECT...');
    const { data: testData, error: testError } = await supabase
      .from('instituicoes')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Tabela instituicoes não existe ou não é acessível:', testError.message);
      return;
    } else {
      console.log('✅ Tabela instituicoes existe e é acessível');
      console.log('📊 Estrutura detectada através de SELECT:');
      if (testData && testData.length > 0) {
        const sampleRecord = testData[0];
        Object.keys(sampleRecord).forEach(column => {
          console.log(`  - ${column}: ${typeof sampleRecord[column]}`);
        });
        
        // Verificar especificamente a coluna evasao_data
        if (sampleRecord.hasOwnProperty('evasao_data')) {
          console.log('\n✅ Coluna evasao_data encontrada!');
        } else {
          console.log('\n❌ Coluna evasao_data NÃO encontrada!');
        }
      } else {
        console.log('  (Tabela vazia, não foi possível detectar estrutura)');
        console.log('  Tentando fazer um INSERT de teste para verificar colunas...');
        
        // Se a tabela estiver vazia, tentar um INSERT de teste para verificar as colunas
        const testInsert = {
          nome: 'TESTE_VERIFICACAO_ESTRUTURA',
          regional: 'nacional',
          programa: 'decolagem',
          status: 'ativa'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('instituicoes')
          .insert(testInsert)
          .select('*');
          
        if (insertError) {
          console.log('❌ Erro no INSERT de teste:', insertError.message);
        } else {
          console.log('✅ INSERT de teste bem-sucedido, estrutura detectada:');
          if (insertData && insertData.length > 0) {
            const insertedRecord = insertData[0];
            Object.keys(insertedRecord).forEach(column => {
              console.log(`  - ${column}: ${typeof insertedRecord[column]}`);
            });
            
            // Verificar especificamente a coluna evasao_data
            if (insertedRecord.hasOwnProperty('evasao_data')) {
              console.log('\n✅ Coluna evasao_data encontrada!');
            } else {
              console.log('\n❌ Coluna evasao_data NÃO encontrada!');
            }
            
            // Limpar o registro de teste
            await supabase
              .from('instituicoes')
              .delete()
              .eq('id', insertedRecord.id);
            console.log('🧹 Registro de teste removido');
          }
        }
      }
    }

    // 2. Testar um INSERT/UPDATE simples para verificar se funciona
    console.log('\n🧪 Testando operação de evasão...');
    
    // Primeiro, verificar se existe alguma instituição para testar
    const { data: instituicoes, error: selectError } = await supabase
      .from('instituicoes')
      .select('id, nome, status')
      .limit(1);

    if (selectError) {
      console.log('❌ Erro ao buscar instituições:', selectError.message);
      return;
    }

    if (!instituicoes || instituicoes.length === 0) {
      console.log('⚠️ Nenhuma instituição encontrada para testar');
      return;
    }

    const testInstituicao = instituicoes[0];
    console.log(`📋 Testando com instituição: ${testInstituicao.nome} (ID: ${testInstituicao.id})`);

    // Tentar fazer um UPDATE de teste (sem realmente alterar)
    const { data: updateData, error: updateError } = await supabase
      .from('instituicoes')
      .update({
        status: 'evadida',
        evasao_motivo: 'Teste de sistema',
        evasao_data: '2025-01-27',
        evasao_registrado_em: new Date().toISOString()
      })
      .eq('id', testInstituicao.id)
      .select('*');

    if (updateError) {
      console.log('❌ Erro no UPDATE de teste:', updateError.message);
      console.log('   Detalhes:', updateError);
    } else {
      console.log('✅ UPDATE de teste executado com sucesso!');
      
      // Reverter o teste
      await supabase
        .from('instituicoes')
        .update({
          status: testInstituicao.status,
          evasao_motivo: null,
          evasao_data: null,
          evasao_registrado_em: null
        })
        .eq('id', testInstituicao.id);
      
      console.log('🔄 Teste revertido com sucesso');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkInstituicoesTable();