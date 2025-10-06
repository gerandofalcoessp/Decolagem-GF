require('dotenv').config();

const API_BASE_URL = 'http://localhost:4000';

async function fixGoalsViaAPI() {
  console.log('🔧 Corrigindo associação das metas via API...');

  try {
    // 1. Fazer login para obter token
    console.log('🔑 Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@decolagem.com',
        password: 'teste123'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Erro no login: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso');

    // 2. Buscar usuário de teste
    console.log('👤 Buscando dados do usuário...');
    const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Erro ao buscar usuário: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    console.log('✅ Usuário encontrado:', userData.user.id);

    // 3. Buscar todas as metas
    console.log('📋 Buscando todas as metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!goalsResponse.ok) {
      throw new Error(`Erro ao buscar metas: ${goalsResponse.status}`);
    }

    const goalsData = await goalsResponse.json();
    const goals = goalsData.data || [];
    console.log(`📊 Total de metas encontradas: ${goals.length}`);

    // 4. Atualizar cada meta para associar ao usuário correto
    let updatedCount = 0;
    for (const goal of goals) {
      if (goal.member_id !== userData.user.id) {
        console.log(`🔄 Atualizando meta: ${goal.nome}`);
        
        const updateResponse = await fetch(`${API_BASE_URL}/goals/${goal.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            member_id: userData.user.id
          }),
        });

        if (updateResponse.ok) {
          updatedCount++;
          console.log(`✅ Meta "${goal.nome}" atualizada`);
        } else {
          console.log(`❌ Erro ao atualizar meta "${goal.nome}"`);
        }
      }
    }

    console.log(`✅ Processo concluído! ${updatedCount} metas foram atualizadas.`);

    // 5. Verificar metas do usuário após atualização
    console.log('🔍 Verificando metas do usuário após atualização...');
    const finalGoalsResponse = await fetch(`${API_BASE_URL}/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (finalGoalsResponse.ok) {
      const finalGoalsData = await finalGoalsResponse.json();
      const userGoals = (finalGoalsData.data || []).filter(goal => goal.member_id === userData.user.id);
      console.log(`📈 Total de metas associadas ao usuário: ${userGoals.length}`);
      
      if (userGoals.length > 0) {
        console.log('📋 Metas do usuário:');
        userGoals.forEach((goal, index) => {
          console.log(`  ${index + 1}. ${goal.nome} (Status: ${goal.status})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro durante a correção:', error.message);
  }
}

fixGoalsViaAPI();