const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente admin (bypassa RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkInstituicoesTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela instituicoes com cliente admin...\n');

    // 1. Verificar se a tabela existe usando o cliente admin
    console.log('🔄 Verificando tabela com SELECT usando cliente admin...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('instituicoes')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Erro ao acessar tabela:', testError.message);
      return;
    }

    console.log('✅ Tabela instituicoes acessível via cliente admin');
    
    if (testData && testData.length > 0) {
      console.log('📊 Estrutura detectada através de SELECT:');
      const sampleRecord = testData[0];
      Object.keys(sampleRecord).forEach(column => {
        console.log(`  - ${column}: ${typeof sampleRecord[column]} (valor: ${sampleRecord[column]})`);
      });
      
      // Verificar especificamente a coluna evasao_data
      if (sampleRecord.hasOwnProperty('evasao_data')) {
        console.log('\n✅ Coluna evasao_data encontrada!');
        console.log(`   Valor atual: ${sampleRecord.evasao_data}`);
      } else {
        console.log('\n❌ Coluna evasao_data NÃO encontrada!');
      }
    } else {
      console.log('📊 Tabela vazia, fazendo INSERT de teste...');
      
      // Se a tabela estiver vazia, tentar um INSERT de teste
      const testInsert = {
        nome: 'TESTE_VERIFICACAO_ESTRUTURA',
        regional: 'nacional',
        programa: 'decolagem',
        status: 'ativa'
      };
      
      const { data: insertData, error: insertError } = await supabaseAdmin
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
            console.log(`  - ${column}: ${typeof insertedRecord[column]} (valor: ${insertedRecord[column]})`);
          });
          
          // Verificar especificamente a coluna evasao_data
          if (insertedRecord.hasOwnProperty('evasao_data')) {
            console.log('\n✅ Coluna evasao_data encontrada!');
            console.log(`   Valor: ${insertedRecord.evasao_data}`);
          } else {
            console.log('\n❌ Coluna evasao_data NÃO encontrada!');
          }
          
          // Limpar o registro de teste
          await supabaseAdmin
            .from('instituicoes')
            .delete()
            .eq('id', insertedRecord.id);
          console.log('🧹 Registro de teste removido');
        }
      }
    }

    // 2. Testar operação de evasão
    console.log('\n🧪 Testando operação de evasão...');
    
    // Buscar uma instituição existente
    const { data: instituicoes, error: searchError } = await supabaseAdmin
      .from('instituicoes')
      .select('id, nome, evasao_data')
      .limit(1);

    if (searchError) {
      console.log('❌ Erro ao buscar instituições:', searchError.message);
    } else if (instituicoes && instituicoes.length > 0) {
      const instituicao = instituicoes[0];
      console.log(`✅ Instituição encontrada: ${instituicao.nome} (ID: ${instituicao.id})`);
      console.log(`   evasao_data atual: ${instituicao.evasao_data}`);
      
      // Tentar atualizar a evasao_data
      const testEvasaoData = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const { data: updateData, error: updateError } = await supabaseAdmin
        .from('instituicoes')
        .update({ 
          evasao_data: testEvasaoData,
          evasao_motivo: 'Teste de verificação de estrutura'
        })
        .eq('id', instituicao.id)
        .select('*');

      if (updateError) {
        console.log('❌ Erro ao atualizar evasao_data:', updateError.message);
      } else {
        console.log('✅ Atualização de evasao_data bem-sucedida!');
        console.log(`   Nova evasao_data: ${updateData[0].evasao_data}`);
        console.log(`   evasao_motivo: ${updateData[0].evasao_motivo}`);
        
        // Reverter a alteração
        await supabaseAdmin
          .from('instituicoes')
          .update({ 
            evasao_data: null,
            evasao_motivo: null
          })
          .eq('id', instituicao.id);
        console.log('🔄 Alteração revertida');
      }
    } else {
      console.log('⚠️ Nenhuma instituição encontrada para testar');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkInstituicoesTable().catch(console.error);