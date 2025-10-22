import { supabase } from './services/supabaseClient.js';

// Simular autenticação (necessário para RLS)
async function simulateAuth() {
  // Para teste, vamos usar um usuário fictício
  // Em produção, isso seria feito através do login real
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.log('⚠️ Não foi possível fazer login anônimo, continuando sem auth...');
  } else {
    console.log('✅ Login anônimo realizado');
  }
}

async function testDashboardRealtime() {
  console.log('🎯 Testando subscriptions no dashboard real...\n');

  await simulateAuth();

  let eventCount = 0;
  const events = [];

  // Configurar subscription para goals
  console.log('📡 Configurando subscription para goals...');
  const goalsChannel = supabase
    .channel('goals-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'goals'
      },
      (payload) => {
        eventCount++;
        const event = {
          type: 'GOALS',
          event: payload.eventType,
          data: payload.new || payload.old,
          timestamp: new Date().toISOString()
        };
        events.push(event);
        console.log(`🔔 [${eventCount}] [GOALS] ${payload.eventType}:`, {
          id: event.data?.id,
          nome: event.data?.nome,
          timestamp: event.timestamp
        });
      }
    )
    .subscribe((status) => {
      console.log('📡 Status da subscription goals:', status);
    });

  // Configurar subscription para regional_activities
  console.log('📡 Configurando subscription para regional_activities...');
  const activitiesChannel = supabase
    .channel('activities-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'regional_activities'
      },
      (payload) => {
        eventCount++;
        const event = {
          type: 'ACTIVITIES',
          event: payload.eventType,
          data: payload.new || payload.old,
          timestamp: new Date().toISOString()
        };
        events.push(event);
        console.log(`🔔 [${eventCount}] [ACTIVITIES] ${payload.eventType}:`, {
          id: event.data?.id,
          nome: event.data?.nome,
          timestamp: event.timestamp
        });
      }
    )
    .subscribe((status) => {
      console.log('📡 Status da subscription activities:', status);
    });

  // Aguardar subscriptions ficarem ativas
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n🧪 Agora faça algumas mudanças no dashboard:');
  console.log('   1. Abra o dashboard em http://localhost:3003');
  console.log('   2. Crie, edite ou delete uma meta');
  console.log('   3. Crie, edite ou delete uma atividade regional');
  console.log('   4. Observe os eventos sendo recebidos aqui');
  console.log('\n⏳ Aguardando por 60 segundos...\n');

  // Aguardar por eventos
  await new Promise(resolve => setTimeout(resolve, 60000));

  console.log('\n📊 RELATÓRIO FINAL:');
  console.log(`   Total de eventos recebidos: ${eventCount}`);
  
  if (events.length > 0) {
    console.log('   Eventos por tipo:');
    const eventsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(eventsByType).forEach(([type, count]) => {
      console.log(`     - ${type}: ${count}`);
    });

    console.log('\n   Últimos eventos:');
    events.slice(-5).forEach((event, index) => {
      console.log(`     ${index + 1}. [${event.type}] ${event.event} - ${event.data?.nome || 'N/A'}`);
    });
  }

  if (eventCount > 0) {
    console.log('\n✅ SUBSCRIPTIONS FUNCIONANDO NO DASHBOARD!');
    console.log('   O frontend está recebendo eventos em tempo real.');
  } else {
    console.log('\n❌ Nenhum evento recebido');
    console.log('   Verifique se você fez mudanças no dashboard durante o teste.');
  }

  // Limpar subscriptions
  console.log('\n🔌 Removendo subscriptions...');
  await goalsChannel.unsubscribe();
  await activitiesChannel.unsubscribe();
  
  console.log('✅ Teste concluído!');
}

// Executar teste
testDashboardRealtime().catch(console.error);