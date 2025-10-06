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
    // Verificar na tabela goals
    console.log('📋 Verificando tabela goals:');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or('nome.ilike.%Atendidos Indiretamente%,nome.ilike.%Atendidos Diretamente%,descricao.ilike.%Atendidos Indiretamente%,descricao.ilike.%Atendidos Diretamente%');

    if (goalsError) {
      console.error('❌ Erro ao consultar goals:', goalsError);
    } else {
      console.log(`   Encontrados ${goals.length} goals com essas metas:`);
      goals.forEach(goal => {
        console.log(`   - ID: ${goal.id}, Nome: ${goal.nome}`);
        if (goal.descricao && (goal.descricao.includes('Atendidos Indiretamente') || goal.descricao.includes('Atendidos Diretamente'))) {
          console.log(`     Descrição: ${goal.descricao}`);
        }
      });
    }

    // Verificar na tabela metas (se existir)
    console.log('\n📊 Verificando tabela metas:');
    const { data: metas, error: metasError } = await supabase
      .from('metas')
      .select('*')
      .or('nome.ilike.%Atendidos Indiretamente%,nome.ilike.%Atendidos Diretamente%');

    if (metasError) {
      console.log('   ⚠️  Tabela metas não encontrada ou erro:', metasError.message);
    } else {
      console.log(`   Encontradas ${metas.length} metas com esses nomes:`);
      metas.forEach(meta => {
        console.log(`   - ID: ${meta.id}, Nome: ${meta.nome}`);
      });
    }

    // Verificar na tabela members (se houver referências)
    console.log('\n👥 Verificando tabela members:');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .or('atendidos_indiretamente.not.is.null,atendidos_diretamente.not.is.null');

    if (membersError) {
      console.log('   ⚠️  Erro ao consultar members:', membersError.message);
    } else {
      console.log(`   Encontrados ${members.length} members com dados de atendidos:`);
      members.slice(0, 5).forEach(member => {
        console.log(`   - ID: ${member.id}, Atendidos Indiretamente: ${member.atendidos_indiretamente}, Atendidos Diretamente: ${member.atendidos_diretamente}`);
      });
      if (members.length > 5) {
        console.log(`   ... e mais ${members.length - 5} registros`);
      }
    }

    // Verificar estrutura das tabelas
    console.log('\n🏗️  Verificando estrutura das tabelas:');
    
    // Verificar colunas da tabela goals
    const { data: goalsColumns, error: goalsColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'goals' });
    
    if (!goalsColumnsError && goalsColumns) {
      console.log('   Colunas da tabela goals:');
      goalsColumns.forEach(col => {
        if (col.column_name.toLowerCase().includes('atendidos')) {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        }
      });
    }

    // Verificar colunas da tabela members
    const { data: membersColumns, error: membersColumnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'members' });
    
    if (!membersColumnsError && membersColumns) {
      console.log('   Colunas da tabela members relacionadas a atendidos:');
      membersColumns.forEach(col => {
        if (col.column_name.toLowerCase().includes('atendidos')) {
          console.log(`   - ${col.column_name} (${col.data_type})`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkMetasInDatabase();