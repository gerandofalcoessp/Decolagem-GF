require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGoalsSchema() {
  console.log('🔍 Verificando estrutura da tabela goals...\n');

  try {
    // Tentar inserir um registro simples para descobrir a estrutura
    console.log('1. Testando inserção simples para descobrir campos...');
    
    const { data, error } = await supabase
      .from('goals')
      .insert({
        nome: 'Teste Estrutura',
        descricao: 'Teste para descobrir estrutura da tabela'
      })
      .select('*')
      .single();

    if (error) {
      console.log('❌ Erro na inserção (esperado):', error.message);
      
      // Tentar descobrir a estrutura através de uma consulta vazia
      console.log('\n2. Tentando descobrir estrutura através de consulta...');
      
      const { data: emptyData, error: emptyError } = await supabase
        .from('goals')
        .select('*')
        .limit(0);

      if (emptyError) {
        console.error('❌ Erro na consulta:', emptyError.message);
      } else {
        console.log('✅ Consulta vazia bem-sucedida');
      }
    } else {
      console.log('✅ Inserção bem-sucedida!');
      console.log('📊 Dados inseridos:', data);
      
      // Limpar o registro de teste
      await supabase.from('goals').delete().eq('id', data.id);
      console.log('🧹 Registro de teste removido');
    }

    // Tentar diferentes combinações de campos
    console.log('\n3. Testando campos básicos...');
    
    const basicFields = {
      nome: 'Meta Teste',
      descricao: 'Descrição da meta teste'
    };

    const { data: basicData, error: basicError } = await supabase
      .from('goals')
      .insert(basicFields)
      .select('*')
      .single();

    if (basicError) {
      console.log('❌ Erro com campos básicos:', basicError.message);
    } else {
      console.log('✅ Campos básicos funcionaram!');
      console.log('📋 Estrutura descoberta:');
      Object.keys(basicData).forEach(key => {
        console.log(`   - ${key}: ${typeof basicData[key]} (${basicData[key]})`);
      });
      
      // Limpar
      await supabase.from('goals').delete().eq('id', basicData.id);
      console.log('🧹 Registro de teste removido');
    }

    // Tentar com campos adicionais comuns
    console.log('\n4. Testando campos adicionais...');
    
    const extendedFields = {
      nome: 'Meta Teste Extendida',
      descricao: 'Descrição da meta teste',
      valor_meta: 100,
      valor_atual: 50,
      status: 'pending',
      due_date: '2024-12-31'
    };

    const { data: extendedData, error: extendedError } = await supabase
      .from('goals')
      .insert(extendedFields)
      .select('*')
      .single();

    if (extendedError) {
      console.log('❌ Erro com campos estendidos:', extendedError.message);
    } else {
      console.log('✅ Campos estendidos funcionaram!');
      console.log('📋 Estrutura completa:');
      Object.keys(extendedData).forEach(key => {
        console.log(`   - ${key}: ${typeof extendedData[key]} (${extendedData[key]})`);
      });
      
      // Limpar
      await supabase.from('goals').delete().eq('id', extendedData.id);
      console.log('🧹 Registro de teste removido');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
checkGoalsSchema();