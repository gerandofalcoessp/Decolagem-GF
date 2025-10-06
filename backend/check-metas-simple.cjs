const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetasInDatabase() {
  console.log('🔍 Verificando ocorrências das metas no banco de dados...\n');

  try {
    // Verificar todos os goals
    console.log('📋 Verificando todos os goals:');
    const { data: allGoals, error: allGoalsError } = await supabase
      .from('goals')
      .select('*');

    if (allGoalsError) {
      console.error('❌ Erro ao consultar goals:', allGoalsError);
    } else {
      console.log(`   Total de goals: ${allGoals.length}`);
      
      const goalsWithAtendidos = allGoals.filter(goal => 
        (goal.nome && (goal.nome.includes('Atendidos Indiretamente') || goal.nome.includes('Atendidos Diretamente'))) ||
        (goal.descricao && (goal.descricao.includes('Atendidos Indiretamente') || goal.descricao.includes('Atendidos Diretamente')))
      );
      
      console.log(`   Goals com "Atendidos": ${goalsWithAtendidos.length}`);
      goalsWithAtendidos.forEach(goal => {
        console.log(`   - ID: ${goal.id}, Nome: ${goal.nome}`);
        if (goal.descricao && (goal.descricao.includes('Atendidos Indiretamente') || goal.descricao.includes('Atendidos Diretamente'))) {
          console.log(`     Descrição: ${goal.descricao}`);
        }
      });
    }

    // Verificar todos os members
    console.log('\n👥 Verificando estrutura da tabela members:');
    const { data: sampleMembers, error: membersError } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (membersError) {
      console.log('   ⚠️  Erro ao consultar members:', membersError.message);
    } else if (sampleMembers && sampleMembers.length > 0) {
      console.log('   Colunas disponíveis na tabela members:');
      Object.keys(sampleMembers[0]).forEach(key => {
        if (key.toLowerCase().includes('atendidos')) {
          console.log(`   - ${key}`);
        }
      });
    }

    // Verificar se existe alguma tabela com nome relacionado a metas
    console.log('\n📊 Tentando verificar outras tabelas relacionadas a metas...');
    
    // Tentar buscar por qualquer referência a "Atendidos" em diferentes tabelas
    const tablesToCheck = ['goals', 'members', 'usuarios'];
    
    for (const table of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!error && data) {
          console.log(`   ✅ Tabela ${table} existe`);
          if (data.length > 0) {
            const columns = Object.keys(data[0]);
            const atendidosColumns = columns.filter(col => col.toLowerCase().includes('atendidos'));
            if (atendidosColumns.length > 0) {
              console.log(`      Colunas relacionadas a atendidos: ${atendidosColumns.join(', ')}`);
            }
          }
        }
      } catch (err) {
        console.log(`   ❌ Tabela ${table} não existe ou erro: ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkMetasInDatabase();