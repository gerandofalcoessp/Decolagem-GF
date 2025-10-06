const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkGoalsTable() {
  try {
    console.log('🔍 Verificando estrutura da tabela goals...\n');

    // 1. Tentar fazer um SELECT simples na tabela para ver quais colunas existem
    console.log('🧪 Testando SELECT na tabela goals...');
    const { data: testSelect, error: selectError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('❌ Erro no SELECT:', selectError.message);
      console.error('   Detalhes completos:', selectError);
    } else {
      console.log('✅ SELECT funcionou. Registros encontrados:', testSelect?.length || 0);
      if (testSelect && testSelect.length > 0) {
        console.log('📋 Colunas disponíveis no primeiro registro:');
        Object.keys(testSelect[0]).forEach(key => {
          console.log(`   - ${key}: ${typeof testSelect[0][key]}`);
        });
      }
    }

    // 2. Verificar estrutura atual da tabela usando SQL direto
    console.log('\n🔍 Verificando estrutura atual da tabela goals...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', { 
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'goals' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (tableError) {
      console.error('❌ Erro ao verificar estrutura da tabela:', tableError.message);
      
      // Tentar método alternativo usando describe
      console.log('\n🔍 Tentando método alternativo...');
      const { data: describeData, error: describeError } = await supabase
        .from('goals')
        .select('*')
        .limit(0);
        
      if (describeError) {
        console.error('❌ Erro no método alternativo:', describeError.message);
      } else {
        console.log('✅ Tabela goals existe, mas não conseguimos ver sua estrutura');
      }
    } else {
      console.log('✅ Estrutura da tabela goals:');
      tableInfo.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 4. Tentar fazer um INSERT de teste com colunas originais
    console.log('\n🧪 Testando INSERT com colunas originais...');
    const originalTestData = {
      title: 'Teste Meta Original',
      description: 'Teste de descrição original',
      target_value: 100,
      current_value: 0,
      due_date: '2025-12-31',
      status: 'pending'
    };

    const { data: originalInsert, error: originalInsertError } = await supabase
      .from('goals')
      .insert(originalTestData)
      .select('*')
      .single();

    if (originalInsertError) {
      console.error('❌ Erro no INSERT com colunas originais:', originalInsertError.message);
    } else {
      console.log('✅ INSERT com colunas originais funcionou:', originalInsert?.id);
      
      // Limpar o registro de teste
      await supabase.from('goals').delete().eq('id', originalInsert.id);
      console.log('🧹 Registro de teste removido');
    }

    // 5. Tentar fazer um INSERT de teste com colunas novas
    console.log('\n🧪 Testando INSERT com colunas novas...');
    const testData = {
      nome: 'Teste Meta',
      descricao: 'Teste de descrição',
      valor_meta: 100,
      valor_atual: 0,
      due_date: '2025-12-31',
      status: 'pending'
    };

    const { data: testInsert, error: insertError } = await supabase
      .from('goals')
      .insert(testData)
      .select('*')
      .single();

    if (insertError) {
      console.error('❌ Erro no INSERT de teste:', insertError.message);
      console.error('   Detalhes completos:', insertError);
    } else {
      console.log('✅ INSERT de teste funcionou:', testInsert?.id);
      
      // Limpar o registro de teste
      await supabase.from('goals').delete().eq('id', testInsert.id);
      console.log('🧹 Registro de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkGoalsTable();