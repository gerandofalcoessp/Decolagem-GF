require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixGoalsMemberId() {
  console.log('🔧 Corrigindo member_id das metas...\n');

  try {
    // 1. Obter o member_id correto do usuário logado
    const correctMemberId = '0e63b7c4-0e3c-4295-8443-cacce34ec1c3'; // Erika Miranda
    console.log('✅ Member ID correto:', correctMemberId);

    // 2. Buscar todas as metas existentes
    console.log('\n2. Buscando todas as metas...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log('🎯 Total de metas encontradas:', goals.length);

    // 3. Atualizar todas as metas para o member_id correto
    console.log('\n3. Atualizando metas...');
    let updatedCount = 0;
    let errorCount = 0;

    for (const goal of goals) {
      console.log(`🔄 Atualizando meta: ${goal.nome}`);
      
      const { error: updateError } = await supabase
        .from('goals')
        .update({ member_id: correctMemberId })
        .eq('id', goal.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar meta "${goal.nome}":`, updateError);
        errorCount++;
      } else {
        console.log(`✅ Meta "${goal.nome}" atualizada com sucesso`);
        updatedCount++;
      }
    }

    console.log(`\n🎉 Processo concluído!`);
    console.log(`✅ Metas atualizadas: ${updatedCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    // 4. Verificar o resultado
    console.log('\n4. Verificando resultado...');
    const { data: updatedGoals, error: checkError } = await supabase
      .from('goals')
      .select('id, nome, member_id')
      .eq('member_id', correctMemberId);

    if (checkError) {
      console.error('❌ Erro ao verificar metas atualizadas:', checkError);
      return;
    }

    console.log('🎯 Metas agora associadas ao usuário correto:', updatedGoals.length);
    
    if (updatedGoals.length > 0) {
      console.log('\n📋 Primeiras 5 metas corrigidas:');
      updatedGoals.slice(0, 5).forEach((goal, index) => {
        console.log(`${index + 1}. ${goal.nome}`);
      });
    }

    // 5. Testar a API de metas
    console.log('\n5. Testando API de metas...');
    
    // Fazer login para obter token
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.sp@gerandofalcoes.com',
      password: 'Teste123!'
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError);
      return;
    }

    const token = loginData.session.access_token;
    console.log('✅ Login realizado com sucesso');

    // Testar API de metas
    const response = await fetch('http://localhost:4000/api/goals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const apiGoals = await response.json();
      console.log('📊 Metas retornadas pela API:', apiGoals.length);
      
      if (apiGoals.length > 0) {
        console.log('🎯 Primeira meta da API:');
        console.log(`   - Nome: ${apiGoals[0].nome}`);
        console.log(`   - Meta: ${apiGoals[0].meta}`);
        console.log(`   - Atual: ${apiGoals[0].atual}`);
        console.log(`   - Status: ${apiGoals[0].status}`);
      }
    } else {
      console.error('❌ Erro na API de metas:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
fixGoalsMemberId();