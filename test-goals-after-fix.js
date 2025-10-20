require('dotenv').config();

async function testGoalsAfterFix() {
  console.log('🧪 Testando API de metas após correção...\n');

  try {
    // 1. Fazer login via API do backend
    console.log('1. Fazendo login...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'coord.regional.sp@gerandofalcoes.com',
        password: 'Teste123!'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erro no login:', loginResponse.status, loginResponse.statusText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', loginData.user?.name || loginData.user?.email);
    console.log('🔑 Role:', loginData.user?.role);

    const token = loginData.token;

    // 2. Testar API de metas
    console.log('\n2. Testando API de metas...');
    const goalsResponse = await fetch('http://localhost:4000/api/goals', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!goalsResponse.ok) {
      console.error('❌ Erro na API de metas:', goalsResponse.status, goalsResponse.statusText);
      const errorText = await goalsResponse.text();
      console.error('Detalhes do erro:', errorText);
      return;
    }

    const goals = await goalsResponse.json();
    console.log('🎯 Total de metas retornadas:', goals.length);

    if (goals.length > 0) {
      console.log('\n📋 Primeiras 5 metas:');
      goals.slice(0, 5).forEach((goal, index) => {
        console.log(`${index + 1}. ${goal.nome}`);
        console.log(`   Meta: ${goal.meta}`);
        console.log(`   Atual: ${goal.atual}`);
        console.log(`   Status: ${goal.status}`);
        console.log(`   Member ID: ${goal.member_id}`);
        console.log('');
      });
    }

    // 3. Testar endpoint de metas por atividade
    console.log('3. Testando endpoint de metas por atividade...');
    const activityGoalsResponse = await fetch('http://localhost:4000/api/goals/by-activity', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!activityGoalsResponse.ok) {
      console.error('❌ Erro na API de metas por atividade:', activityGoalsResponse.status, activityGoalsResponse.statusText);
      const errorText = await activityGoalsResponse.text();
      console.error('Detalhes do erro:', errorText);
    } else {
      const activityGoals = await activityGoalsResponse.json();
      console.log('📊 Metas por atividade retornadas:', activityGoals.length);
      
      if (activityGoals.length > 0) {
        console.log('\n🎯 Primeira meta por atividade:');
        const firstActivity = activityGoals[0];
        console.log(`   Atividade: ${firstActivity.activity_name}`);
        console.log(`   Meta: ${firstActivity.goal_value}`);
        console.log(`   Atual: ${firstActivity.current_value}`);
        console.log(`   Status: ${firstActivity.status}`);
      }
    }

    // 4. Testar API de atividades regionais para comparação
    console.log('\n4. Testando API de atividades regionais...');
    const activitiesResponse = await fetch('http://localhost:4000/api/regional-activities', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('📈 Total de atividades regionais:', activities.length);
      
      if (activities.length > 0) {
        console.log('🔍 Primeira atividade regional:');
        const firstActivity = activities[0];
        console.log(`   Label: ${firstActivity.label}`);
        console.log(`   Valor: ${firstActivity.value}`);
        console.log(`   Tipo: ${firstActivity.tipo}`);
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o teste
testGoalsAfterFix();