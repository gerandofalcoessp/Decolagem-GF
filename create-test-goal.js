const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestGoal() {
  console.log('🎯 Criando meta de teste...\n');
  
  try {
    // 1. Buscar o usuário de teste
    console.log('1. Buscando usuário de teste...');
    const { data: testUser, error: userError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('email', 'teste@decolagem.com')
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário de teste:', userError);
      return;
    }

    console.log('✅ Usuário de teste encontrado:');
    console.log(`  ID: ${testUser.id}`);
    console.log(`  Nome: ${testUser.name}`);
    console.log(`  Email: ${testUser.email}`);

    // 2. Criar uma meta de teste
    console.log('\n2. Criando meta de teste...');
    const goalData = {
      member_id: testUser.id,
      nome: 'Meta de Teste',
      descricao: 'Esta é uma meta criada para teste do sistema',
      valor_meta: 100,
      valor_atual: 0,
      status: 'pending',
      due_date: '2025-12-31'
    };

    const { data: newGoal, error: goalError } = await supabaseAdmin
      .from('goals')
      .insert(goalData)
      .select('*')
      .single();

    if (goalError) {
      console.error('❌ Erro ao criar meta:', goalError);
      return;
    }

    console.log('✅ Meta de teste criada com sucesso:');
    console.log(`  ID: ${newGoal.id}`);
    console.log(`  Nome: ${newGoal.nome}`);
    console.log(`  Descrição: ${newGoal.descricao}`);
    console.log(`  Member ID: ${newGoal.member_id}`);
    console.log(`  Status: ${newGoal.status}`);

    // 3. Verificar se a meta foi criada corretamente
    console.log('\n3. Verificando meta criada...');
    const { data: verifyGoal, error: verifyError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('id', newGoal.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar meta:', verifyError);
    } else {
      console.log('✅ Meta verificada com sucesso:');
      console.log(`  Todas as colunas: ${Object.keys(verifyGoal).join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestGoal();