// Script para investigar problema das metas
const API_BASE_URL = 'http://localhost:4000';

async function debugGoalsIssue() {
  console.log('🔍 Investigando problema das metas...\n');
  
  try {
    // 1. Fazer login para obter token
    console.log('1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'coord.regional.sp@gerandofalcoes.com',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Erro no login:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;
    
    if (!token) {
      console.error('❌ Token não encontrado na resposta!');
      return;
    }

    console.log('✅ Login bem-sucedido!');

    // 2. Testar API de metas
    console.log('\n2. Testando API de metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/api/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da API de metas:', goalsResponse.status);
    
    if (goalsResponse.ok) {
      const goals = await goalsResponse.json();
      console.log('✅ API de metas funcionando!');
      console.log('Número de metas retornadas:', goals.length || 0);
      
      if (goals.length > 0) {
        console.log('\n📋 Primeiras 3 metas:');
        goals.slice(0, 3).forEach((goal, index) => {
          console.log(`${index + 1}. ID: ${goal.id}`);
          console.log(`   Tipo: ${goal.tipo}`);
          console.log(`   Regional: ${goal.regional}`);
          console.log(`   Meta: ${goal.meta}`);
          console.log(`   Status: ${goal.status}`);
          console.log(`   Ano: ${goal.ano}`);
          console.log(`   Mês: ${goal.mes || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Nenhuma meta encontrada na API!');
      }
    } else {
      const errorText = await goalsResponse.text();
      console.error('❌ Erro na API de metas:', errorText);
    }

    // 3. Testar API de atividades regionais
    console.log('\n3. Testando API de atividades regionais...');
    const activitiesResponse = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('✅ API de atividades funcionando!');
      console.log('Número de atividades:', activities.length || 0);
      
      // Procurar por "Famílias Embarcadas Decolagem"
      const familiesActivities = activities.filter(activity => 
        activity.tipo === 'familias_embarcadas_decolagem' || 
        activity.titulo?.toLowerCase().includes('famílias embarcadas')
      );
      
      console.log('\n📊 Atividades "Famílias Embarcadas Decolagem":');
      console.log('Quantidade encontrada:', familiesActivities.length);
      
      if (familiesActivities.length > 0) {
        familiesActivities.forEach((activity, index) => {
          console.log(`${index + 1}. ID: ${activity.id}`);
          console.log(`   Título: ${activity.titulo}`);
          console.log(`   Tipo: ${activity.tipo}`);
          console.log(`   Regional: ${activity.regional}`);
          console.log(`   Quantidade: ${activity.quantidade}`);
          console.log('');
        });
      }
    } else {
      const errorText = await activitiesResponse.text();
      console.error('❌ Erro na API de atividades:', errorText);
    }

    // 4. Verificar se existe endpoint específico para metas por atividade
    console.log('\n4. Testando endpoint de metas por atividade...');
    const goalsByActivityResponse = await fetch(`${API_BASE_URL}/api/goals/by-activity`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status do endpoint metas por atividade:', goalsByActivityResponse.status);
    
    if (goalsByActivityResponse.ok) {
      const goalsByActivity = await goalsByActivityResponse.json();
      console.log('✅ Endpoint de metas por atividade funcionando!');
      console.log('Dados retornados:', JSON.stringify(goalsByActivity, null, 2));
    } else {
      console.log('⚠️ Endpoint de metas por atividade não existe ou não está funcionando');
    }

    // 5. Verificar endpoint de metas com filtros
    console.log('\n5. Testando metas com filtro por tipo...');
    const goalsFilteredResponse = await fetch(`${API_BASE_URL}/api/goals?tipo=familias_embarcadas_decolagem`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (goalsFilteredResponse.ok) {
      const goalsFiltered = await goalsFilteredResponse.json();
      console.log('✅ Metas filtradas por tipo:');
      console.log('Quantidade:', goalsFiltered.length || 0);
      
      if (goalsFiltered.length > 0) {
        console.log('Metas encontradas:');
        goalsFiltered.forEach((goal, index) => {
          console.log(`${index + 1}. Tipo: ${goal.tipo}, Meta: ${goal.meta}, Regional: ${goal.regional}`);
        });
      }
    } else {
      console.log('⚠️ Filtro por tipo não funcionou');
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o debug
debugGoalsIssue();