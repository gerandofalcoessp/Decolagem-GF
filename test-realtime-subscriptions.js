const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRealtimeSubscriptions() {
  console.log('🔄 Testando subscriptions em tempo real...\n');

  // Configurar subscription para goals
  console.log('📡 Configurando subscription para tabela goals...');
  const goalsChannel = supabase
    .channel('test_goals_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, (payload) => {
      console.log('🔔 [GOALS] Mudança detectada:', {
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        record: payload.new || payload.old
      });
    })
    .subscribe((status) => {
      console.log('📡 [GOALS] Status da subscription:', status);
    });

  // Configurar subscription para regional_activities
  console.log('📡 Configurando subscription para tabela regional_activities...');
  const activitiesChannel = supabase
    .channel('test_activities_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'regional_activities' }, (payload) => {
      console.log('🔔 [ACTIVITIES] Mudança detectada:', {
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        record: payload.new || payload.old
      });
    })
    .subscribe((status) => {
      console.log('📡 [ACTIVITIES] Status da subscription:', status);
    });

  // Aguardar um pouco para as subscriptions se estabelecerem
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🧪 Iniciando testes de mudanças...\n');

  // Teste 1: Inserir uma nova meta
  console.log('1️⃣ Inserindo nova meta...');
  const { data: newGoal, error: goalError } = await supabase
    .from('goals')
    .insert({
      nome: 'Meta de Teste Realtime',
      descricao: 'Meta criada para testar subscriptions em tempo real',
      valor_meta: 100,
      valor_atual: 0,
      status: 'in_progress',
      member_id: '0ef33475-718f-4671-b0db-5f2ac98c76ff'
    })
    .select()
    .single();

  if (goalError) {
    console.error('❌ Erro ao inserir meta:', goalError);
  } else {
    console.log('✅ Meta inserida:', newGoal);
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 2: Atualizar a meta
  if (newGoal) {
    console.log('\n2️⃣ Atualizando meta...');
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update({ valor_atual: 50 })
      .eq('id', newGoal.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar meta:', updateError);
    } else {
      console.log('✅ Meta atualizada:', updatedGoal);
    }
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 3: Inserir nova atividade regional
  console.log('\n3️⃣ Inserindo nova atividade regional...');
  const { data: newActivity, error: activityError } = await supabase
    .from('regional_activities')
    .insert({
      member_id: '0ef33475-718f-4671-b0db-5f2ac98c76ff',
      title: 'Atividade de Teste Realtime',
      description: 'Atividade criada para testar subscriptions em tempo real',
      activity_date: new Date().toISOString().split('T')[0],
      type: 'teste',
      regional: 'nacional',
      status: 'concluida'
    })
    .select()
    .single();

  if (activityError) {
    console.error('❌ Erro ao inserir atividade:', activityError);
  } else {
    console.log('✅ Atividade inserida:', newActivity);
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Teste 4: Deletar a meta de teste
  if (newGoal) {
    console.log('\n4️⃣ Deletando meta de teste...');
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', newGoal.id);

    if (deleteError) {
      console.error('❌ Erro ao deletar meta:', deleteError);
    } else {
      console.log('✅ Meta deletada');
    }
  }

  // Aguardar um pouco para ver os eventos
  console.log('\n⏳ Aguardando eventos de subscription...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Limpar subscriptions
  console.log('\n🔌 Removendo subscriptions...');
  supabase.removeChannel(goalsChannel);
  supabase.removeChannel(activitiesChannel);

  console.log('✅ Teste de subscriptions concluído!');
}

// Executar o teste
testRealtimeSubscriptions().catch(console.error);