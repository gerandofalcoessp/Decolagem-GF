const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkGoalsDatabase() {
  console.log('🔍 Verificando metas no banco de dados...\n');
  
  try {
    // 1. Verificar todas as metas na tabela (usando admin para ignorar RLS)
    console.log('1. Buscando todas as metas na tabela goals...');
    const { data: allGoals, error: goalsError } = await supabaseAdmin
      .from('goals')
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log(`✅ Total de metas encontradas: ${allGoals.length}`);
    
    if (allGoals.length > 0) {
      console.log('\n📋 Detalhes das metas:');
      allGoals.forEach((goal, index) => {
        console.log(`\nMeta ${index + 1}:`);
        console.log(`  ID: ${goal.id}`);
        console.log(`  Nome: ${goal.nome || goal.title || 'N/A'}`);
        console.log(`  Descrição: ${goal.descricao || goal.description || 'N/A'}`);
        console.log(`  Member ID: ${goal.member_id || 'N/A'}`);
        console.log(`  Status: ${goal.status || 'N/A'}`);
        console.log(`  Criado em: ${goal.created_at || 'N/A'}`);
        console.log(`  Colunas disponíveis: ${Object.keys(goal).join(', ')}`);
      });
    }

    // 2. Verificar usuário de teste
    console.log('\n2. Verificando usuário de teste...');
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('email', 'teste@decolagem.com')
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário de teste:', userError);
    } else {
      console.log('✅ Usuário de teste encontrado:');
      console.log(`  ID: ${testUser.id}`);
      console.log(`  Auth User ID: ${testUser.auth_user_id}`);
      console.log(`  Email: ${testUser.email}`);
      console.log(`  Nome: ${testUser.name}`);
    }

    // 3. Verificar se existem metas para o usuário de teste
    if (testUser) {
      console.log('\n3. Verificando metas do usuário de teste...');
      const { data: userGoals, error: userGoalsError } = await supabaseAdmin
        .from('goals')
        .select('*')
        .eq('member_id', testUser.id);

      if (userGoalsError) {
        console.error('❌ Erro ao buscar metas do usuário:', userGoalsError);
      } else {
        console.log(`✅ Metas do usuário de teste: ${userGoals.length}`);
        if (userGoals.length > 0) {
          userGoals.forEach((goal, index) => {
            console.log(`  Meta ${index + 1}: ${goal.nome || goal.title} (ID: ${goal.id})`);
          });
        }
      }
    }

    // 4. Verificar estrutura da tabela goals
    console.log('\n4. Verificando estrutura da tabela goals...');
    const { data: tableStructure, error: structureError } = await supabaseAdmin
      .rpc('exec_sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'goals' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError);
    } else {
      console.log('✅ Estrutura da tabela goals:');
      tableStructure.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkGoalsDatabase();