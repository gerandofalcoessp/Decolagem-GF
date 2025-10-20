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
    // 1. Fazer login para obter o member_id correto
    console.log('1. Fazendo login para obter member_id correto...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coord.regional.sp@gerandofalcoes.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    if (!loginData.user && !loginData.session) {
      console.error('❌ Erro no login:', loginData);
      return;
    }

    const correctMemberId = loginData.member?.id;
    console.log('✅ Member ID correto:', correctMemberId);
    console.log('👤 Usuário:', loginData.user?.nome);

    // 2. Buscar todas as metas existentes
    console.log('\n2. Buscando metas existentes...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log('🎯 Total de metas encontradas:', goals.length);

    // 3. Atualizar metas para o member_id correto
    console.log('\n3. Atualizando metas para o member_id correto...');
    
    let updatedCount = 0;
    for (const goal of goals) {
      if (goal.member_id !== correctMemberId) {
        console.log(`🔄 Atualizando meta: ${goal.nome}`);
        
        const { data: updatedGoal, error: updateError } = await supabase
          .from('goals')
          .update({ member_id: correctMemberId })
          .eq('id', goal.id)
          .select('*')
          .single();

        if (updateError) {
          console.error(`❌ Erro ao atualizar meta "${goal.nome}":`, updateError);
        } else {
          updatedCount++;
          console.log(`✅ Meta "${goal.nome}" atualizada com sucesso`);
        }
      } else {
        console.log(`✅ Meta "${goal.nome}" já tem o member_id correto`);
      }
    }

    console.log(`\n🎉 Processo concluído! ${updatedCount} metas foram atualizadas.`);

    // 4. Verificar se as metas agora aparecem na API
    console.log('\n4. Testando API de metas após correção...');
    const token = loginData.session?.access_token;
    
    const goalsApiResponse = await fetch('http://localhost:4000/api/goals', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const goalsApiData = await goalsApiResponse.json();
    console.log('📊 Metas retornadas pela API:', goalsApiData.data?.length || 0);
    
    if (goalsApiData.data && goalsApiData.data.length > 0) {
      console.log('🎯 Primeira meta da API:');
      console.log(`   - Nome: ${goalsApiData.data[0].nome}`);
      console.log(`   - Meta: ${goalsApiData.data[0].valor_meta}`);
      console.log(`   - Atual: ${goalsApiData.data[0].valor_atual}`);
      console.log(`   - Status: ${goalsApiData.data[0].status}`);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
fixGoalsMemberId();