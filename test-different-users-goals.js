// Script para testar visibilidade de metas com diferentes usuários
const API_BASE_URL = 'http://localhost:4000';

async function testUserGoalsVisibility() {
  console.log('🔍 Testando visibilidade de metas com diferentes usuários...\n');

  const users = [
    { email: 'flavio.almeida@gerandofalcoes.com', password: '123456', name: 'Flávio (Super Admin)' },
    { email: 'lemaestro@gerandofalcoes.com', password: '123456', name: 'Lemaestro' },
    { email: 'ana.neiry@gerandofalcoes.com', password: '123456', name: 'Ana Neiry' }
  ];

  for (const user of users) {
    try {
      console.log(`\n📋 Testando usuário: ${user.name}`);
      console.log(`   Email: ${user.email}`);

      // 1. Fazer login
      const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          password: user.password
        }),
      });

      if (!loginResponse.ok) {
        console.log(`❌ Falha no login para ${user.name}`);
        continue;
      }

      const loginData = await loginResponse.json();
      const token = loginData.session?.access_token || loginData.token;
      
      if (!token) {
        console.log(`❌ Token não encontrado para ${user.name}`);
        continue;
      }

      console.log(`✅ Login realizado com sucesso`);
      console.log(`   Role: ${loginData.user?.role || 'N/A'}`);
      console.log(`   Regional: ${loginData.user?.regional || 'N/A'}`);
      console.log(`   Member ID: ${loginData.member?.id || 'N/A'}`);

      // 2. Testar API de metas
      const goalsResponse = await fetch(`${API_BASE_URL}/api/goals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!goalsResponse.ok) {
        console.log(`❌ Erro na API de metas para ${user.name}`);
        continue;
      }

      const goalsData = await goalsResponse.json();
      console.log(`📊 Número de metas visíveis: ${goalsData.data ? goalsData.data.length : 0}`);

      if (goalsData.data && goalsData.data.length > 0) {
        console.log(`📋 Primeiras 3 metas:`);
        goalsData.data.slice(0, 3).forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome} (Member ID: ${goal.member_id})`);
        });

        // Verificar se há metas de diferentes member_ids
        const uniqueMemberIds = [...new Set(goalsData.data.map(goal => goal.member_id))];
        console.log(`🔍 Member IDs únicos nas metas: ${uniqueMemberIds.length}`);
        console.log(`   IDs: ${uniqueMemberIds.join(', ')}`);
      }

    } catch (error) {
      console.error(`❌ Erro para ${user.name}:`, error.message);
    }
  }

  console.log('\n🔍 Verificando estrutura das metas no banco de dados...');
  
  // Fazer login como super admin para verificar todas as metas
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio.almeida@gerandofalcoes.com',
        password: '123456'
      }),
    });

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;

    const goalsResponse = await fetch(`${API_BASE_URL}/api/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const goalsData = await goalsResponse.json();
    
    if (goalsData.data) {
      console.log(`\n📊 Total de metas no sistema: ${goalsData.data.length}`);
      
      // Agrupar por member_id
      const metasPorMember = {};
      goalsData.data.forEach(goal => {
        const memberId = goal.member_id;
        if (!metasPorMember[memberId]) {
          metasPorMember[memberId] = [];
        }
        metasPorMember[memberId].push(goal.nome);
      });

      console.log('\n📋 Metas por Member ID:');
      Object.entries(metasPorMember).forEach(([memberId, metas]) => {
        console.log(`   ${memberId}: ${metas.length} metas`);
        metas.slice(0, 2).forEach(meta => {
          console.log(`     - ${meta}`);
        });
        if (metas.length > 2) {
          console.log(`     ... e mais ${metas.length - 2} metas`);
        }
      });

      // Verificar se há campos de configuração de visibilidade
      console.log('\n🔍 Campos das metas (primeira meta):');
      if (goalsData.data[0]) {
        Object.keys(goalsData.data[0]).forEach(key => {
          console.log(`   - ${key}: ${goalsData.data[0][key]}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar estrutura das metas:', error.message);
  }
}

testUserGoalsVisibility().catch(console.error);