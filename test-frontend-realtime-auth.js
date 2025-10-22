const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Usar service role key para poder inserir dados
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Testando subscriptions em tempo real com autenticação...\n');

// Cliente admin para inserir dados
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Cliente frontend para subscription (usando anon key)
const supabaseFrontend = createClient(
  process.env.VITE_SUPABASE_URL || supabaseUrl,
  process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    },
    global: {
      headers: {
        'x-client-info': 'decolagem-gf-frontend-test'
      }
    }
  }
);

async function testFrontendRealtimeWithAuth() {
  console.log('🔄 Iniciando teste de subscriptions com dados reais...\n');

  let eventsReceived = 0;
  const events = [];

  // Configurar subscription no cliente frontend
  console.log('📡 Configurando subscription no cliente frontend...');
  const channel = supabaseFrontend
    .channel('frontend_test_changes')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'goals' 
    }, (payload) => {
      eventsReceived++;
      const event = {
        type: 'GOALS',
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        table: payload.table,
        record: payload.new || payload.old
      };
      events.push(event);
      console.log(`🔔 [${eventsReceived}] [GOALS] ${payload.eventType}:`, {
        id: event.record?.id,
        nome: event.record?.nome,
        timestamp: event.timestamp
      });
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'regional_activities' 
    }, (payload) => {
      eventsReceived++;
      const event = {
        type: 'ACTIVITIES',
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        table: payload.table,
        record: payload.new || payload.old
      };
      events.push(event);
      console.log(`🔔 [${eventsReceived}] [ACTIVITIES] ${payload.eventType}:`, {
        id: event.record?.id,
        title: event.record?.title,
        timestamp: event.timestamp
      });
    })
    .subscribe((status) => {
      console.log('📡 Status da subscription:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscription ativa! Aguardando mudanças...');
      }
    });

  // Aguardar subscription se estabelecer
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('\n🧪 Fazendo mudanças usando cliente admin...\n');

  // Teste 1: Inserir nova meta usando admin
  console.log('1️⃣ Inserindo nova meta (admin)...');
  const { data: newGoal, error: goalError } = await supabaseAdmin
    .from('goals')
    .insert({
      nome: 'Meta Subscription Test',
      descricao: 'Meta para testar subscription frontend',
      valor_meta: 300,
      valor_atual: 0,
      status: 'in_progress',
      member_id: '0ef33475-718f-4671-b0db-5f2ac98c76ff'
    })
    .select()
    .single();

  if (goalError) {
    console.error('❌ Erro ao inserir meta:', goalError);
  } else {
    console.log('✅ Meta inserida:', newGoal?.nome);
  }

  // Aguardar evento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Atualizar a meta
  if (newGoal) {
    console.log('\n2️⃣ Atualizando meta (admin)...');
    const { error: updateError } = await supabaseAdmin
      .from('goals')
      .update({ valor_atual: 150 })
      .eq('id', newGoal.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar meta:', updateError);
    } else {
      console.log('✅ Meta atualizada');
    }
  }

  // Aguardar evento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Inserir atividade regional
  console.log('\n3️⃣ Inserindo atividade regional (admin)...');
  const { data: newActivity, error: activityError } = await supabaseAdmin
    .from('regional_activities')
    .insert({
      member_id: '0ef33475-718f-4671-b0db-5f2ac98c76ff',
      title: 'Atividade Subscription Test',
      description: 'Atividade para testar subscription frontend',
      activity_date: new Date().toISOString().split('T')[0],
      type: 'teste_subscription',
      regional: 'nacional',
      status: 'concluida'
    })
    .select()
    .single();

  if (activityError) {
    console.error('❌ Erro ao inserir atividade:', activityError);
  } else {
    console.log('✅ Atividade inserida:', newActivity?.title);
  }

  // Aguardar evento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 4: Deletar a meta
  if (newGoal) {
    console.log('\n4️⃣ Deletando meta (admin)...');
    const { error: deleteError } = await supabaseAdmin
      .from('goals')
      .delete()
      .eq('id', newGoal.id);

    if (deleteError) {
      console.error('❌ Erro ao deletar meta:', deleteError);
    } else {
      console.log('✅ Meta deletada');
    }
  }

  // Aguardar eventos finais
  console.log('\n⏳ Aguardando eventos finais...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Relatório final
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log(`   Total de eventos recebidos: ${eventsReceived}`);
  console.log(`   Eventos por tipo:`);
  
  const goalEvents = events.filter(e => e.type === 'GOALS');
  const activityEvents = events.filter(e => e.type === 'ACTIVITIES');
  
  console.log(`     - GOALS: ${goalEvents.length}`);
  console.log(`     - ACTIVITIES: ${activityEvents.length}`);
  
  if (eventsReceived > 0) {
    console.log('\n✅ SUBSCRIPTIONS FUNCIONANDO CORRETAMENTE!');
    console.log('   O frontend está recebendo eventos em tempo real do Supabase.');
  } else {
    console.log('\n❌ SUBSCRIPTIONS NÃO FUNCIONANDO');
    console.log('   O frontend não está recebendo eventos do Supabase.');
  }

  // Limpar subscription
  console.log('\n🔌 Removendo subscription...');
  supabaseFrontend.removeChannel(channel);

  console.log('✅ Teste concluído!');
  
  return {
    eventsReceived,
    goalEvents: goalEvents.length,
    activityEvents: activityEvents.length,
    working: eventsReceived > 0
  };
}

// Executar teste
testFrontendRealtimeWithAuth().catch(console.error);