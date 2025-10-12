const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteFlow() {
  console.log('🧪 Testando fluxo completo de exclusão de atividades regionais...\n');

  try {
    // 1. Fazer login como Deise
    console.log('1️⃣ Fazendo login como Deise...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.co@gerandofalcoes.com',
      password: 'senha123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', authData.user.email);
    console.log('🔑 Token:', authData.session.access_token.substring(0, 50) + '...');

    // 2. Buscar a atividade "Atendidos Diretos Decolagem"
    console.log('\n2️⃣ Buscando atividade "Atendidos Diretos Decolagem"...');
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('title', 'Atendidos Diretos Decolagem')
      .limit(1);

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError.message);
      return;
    }

    if (!activities || activities.length === 0) {
      console.log('⚠️ Atividade não encontrada. Criando uma nova...');
      
      // Criar atividade de teste
      const { data: newActivity, error: createError } = await supabase
        .from('regional_activities')
        .insert({
          title: 'Atendidos Diretos Decolagem',
          description: 'Atividade de teste para exclusão',
          regional: 'centro_oeste',
          member_id: authData.user.id,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar atividade:', createError.message);
        return;
      }

      console.log('✅ Atividade criada:', newActivity.id);
      activities[0] = newActivity;
    } else {
      console.log('✅ Atividade encontrada:', activities[0].id);
    }

    const activity = activities[0];
    console.log('📋 Detalhes da atividade:');
    console.log('   - ID:', activity.id);
    console.log('   - Título:', activity.title);
    console.log('   - Regional:', activity.regional);
    console.log('   - Criador:', activity.member_id);

    // 3. Testar exclusão via API do backend
    console.log('\n3️⃣ Testando exclusão via API do backend...');
    
    const backendUrl = 'http://localhost:4000'; // Porta do backend
    const deleteResponse = await fetch(`${backendUrl}/api/regional-activities/${activity.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Status da resposta:', deleteResponse.status);
    console.log('📡 Status text:', deleteResponse.statusText);

    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('✅ Exclusão bem-sucedida via API:', result);
      
      // Verificar se foi realmente excluída
      const { data: checkActivity, error: checkError } = await supabase
        .from('regional_activities')
        .select('*')
        .eq('id', activity.id);

      if (checkError) {
        console.error('❌ Erro ao verificar exclusão:', checkError.message);
      } else if (checkActivity.length === 0) {
        console.log('✅ Confirmado: Atividade foi excluída do banco de dados');
      } else {
        console.log('⚠️ Atividade ainda existe no banco de dados');
      }
    } else {
      const errorText = await deleteResponse.text();
      console.error('❌ Erro na exclusão via API:');
      console.error('   Status:', deleteResponse.status);
      console.error('   Resposta:', errorText);
    }

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
  }
}

testDeleteFlow();