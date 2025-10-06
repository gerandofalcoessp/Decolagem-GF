const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGoalsTable() {
  console.log('🔍 Verificando estrutura da tabela goals...');
  
  try {
    // Buscar estrutura da tabela
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'goals' AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });
    
    if (error) {
      console.error('❌ Erro ao verificar tabela:', error);
      return;
    }
    
    console.log('📋 Estrutura atual da tabela goals:');
    if (data && Array.isArray(data)) {
      data.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    } else {
      console.log('  Dados não encontrados ou formato inválido:', data);
    }
    
    // Buscar uma meta de exemplo
    const { data: sampleGoal, error: sampleError } = await supabase
      .from('goals')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('❌ Erro ao buscar meta de exemplo:', sampleError);
    } else if (sampleGoal && sampleGoal.length > 0) {
      console.log('\n📝 Exemplo de meta:');
      console.log(JSON.stringify(sampleGoal[0], null, 2));
      
      // Verificar se a descrição contém "Regionais"
      if (sampleGoal[0].descricao && sampleGoal[0].descricao.includes('Regionais')) {
        console.log('\n⚠️  ENCONTRADO: A descrição contém "Regionais" - precisa ser alterado para "Área"');
      }
    } else {
      console.log('\n📝 Nenhuma meta encontrada na tabela');
    }
    
    // Buscar todas as metas que contêm "Regionais" na descrição
    const { data: goalsWithRegionais, error: searchError } = await supabase
      .from('goals')
      .select('id, nome, descricao')
      .ilike('descricao', '%regionais%');
      
    if (searchError) {
      console.error('❌ Erro ao buscar metas com "Regionais":', searchError);
    } else {
      console.log(`\n🔍 Metas encontradas com "Regionais" na descrição: ${goalsWithRegionais.length}`);
      goalsWithRegionais.forEach(goal => {
        console.log(`  - ID: ${goal.id}, Nome: ${goal.nome}`);
        console.log(`    Descrição: ${goal.descricao}`);
      });
    }
    
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

checkGoalsTable().catch(console.error);