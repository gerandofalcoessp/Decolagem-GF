const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env' });

// Usar as mesmas configurações do frontend
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

console.log('🔧 Testando subscriptions em tempo real no frontend...\n');
console.log('📋 Configuração:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

// Criar cliente com as mesmas configurações do frontend
const supabase = createClient(supabaseUrl, supabaseKey, {
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
});

async function testFrontendRealtime() {
  console.log('\n🔄 Iniciando teste de subscriptions do frontend...\n');

  // Simular autenticação (se necessário)
  console.log('🔐 Verificando autenticação...');
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (authError) {
    console.log('⚠️ Erro de autenticação:', authError.message);
    console.log('📝 Continuando sem autenticação (usando anon key)...');
  } else if (session) {
    console.log('✅ Usuário autenticado:', session.user.email);
  } else {
    console.log('📝 Sem sessão ativa (usando anon key)...');
  }

  // Configurar subscription para goals (igual ao DashboardPage)
  console.log('\n📡 Configurando subscription para goals...');
  const goalsChannel = supabase
    .channel('dashboard_changes_test')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'goals' 
    }, (payload) => {
      console.log('🔔 [GOALS] Mudança detectada:', {
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        table: payload.table,
        schema: payload.schema,
        record: payload.new || payload.old
      });
    })
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'regional_activities' 
    }, (payload) => {
      console.log('🔔 [ACTIVITIES] Mudança detectada:', {
        eventType: payload.eventType,
        timestamp: new Date().toISOString(),
        table: payload.table,
        schema: payload.schema,
        record: payload.new || payload.old
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

  console.log('\n🧪 Fazendo mudanças para testar subscription...\n');

  // Teste 1: Inserir nova meta
  console.log('1️⃣ Inserindo nova meta...');
  const { data: newGoal, error: goalError } = await supabase
    .from('goals')
    .insert({
      nome: 'Meta Frontend Test',
      descricao: 'Meta para testar subscription do frontend',
      valor_meta: 200,
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

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 2: Atualizar a meta
  if (newGoal) {
    console.log('\n2️⃣ Atualizando meta...');
    const { error: updateError } = await supabase
      .from('goals')
      .update({ valor_atual: 100 })
      .eq('id', newGoal.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar meta:', updateError);
    } else {
      console.log('✅ Meta atualizada');
    }
  }

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 3: Inserir atividade regional
  console.log('\n3️⃣ Inserindo atividade regional...');
  const { data: newActivity, error: activityError } = await supabase
    .from('regional_activities')
    .insert({
      member_id: '0ef33475-718f-4671-b0db-5f2ac98c76ff',
      title: 'Atividade Frontend Test',
      description: 'Atividade para testar subscription do frontend',
      activity_date: new Date().toISOString().split('T')[0],
      type: 'teste_frontend',
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

  // Aguardar um pouco
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Teste 4: Deletar a meta
  if (newGoal) {
    console.log('\n4️⃣ Deletando meta...');
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

  // Aguardar eventos finais
  console.log('\n⏳ Aguardando eventos finais...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Limpar subscription
  console.log('\n🔌 Removendo subscription...');
  supabase.removeChannel(goalsChannel);

  console.log('✅ Teste de subscription do frontend concluído!');
}

// Executar teste
testFrontendRealtime().catch(console.error);