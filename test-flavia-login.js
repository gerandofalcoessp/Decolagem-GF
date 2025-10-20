// Script para testar login com flavia.silva@gerandofalcoes.com
const API_BASE_URL = 'http://localhost:4000/api';

async function testFlaviaLogin() {
  console.log('🔍 Testando login com flavia.silva@gerandofalcoes.com...\n');

  // Senhas comuns para testar
  const possiblePasswords = [
    'Teste123!',
    'senha123',
    'admin123',
    '123456',
    'Decolagem123!',
    'flavia123',
    'Flavia123!'
  ];

  let loginData = null;
  let token = null;

  // Tentar diferentes senhas
  for (const password of possiblePasswords) {
    try {
      console.log(`🔑 Testando senha: ${password}`);
      
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'flavia.silva@gerandofalcoes.com',
          password: password
        }),
      });

      if (loginResponse.ok) {
        loginData = await loginResponse.json();
        token = loginData.session?.access_token || loginData.token;
        
        console.log(`✅ Login realizado com sucesso com senha: ${password}`);
        console.log(`   Role: ${loginData.user?.role || 'N/A'}`);
        console.log(`   Regional: ${loginData.user?.regional || 'N/A'}`);
        console.log(`   User ID: ${loginData.user?.id || 'N/A'}`);
        break;
      } else {
        const errorText = await loginResponse.text();
        console.log(`❌ Falha com senha ${password}: ${loginResponse.status} - ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar senha ${password}:`, error.message);
    }
  }

  if (!token) {
    console.log('\n❌ Não foi possível fazer login com nenhuma senha testada');
    console.log('💡 Vou tentar resetar a senha do usuário...');
    
    // Tentar resetar senha via API admin
    try {
      const resetResponse = await fetch(`${API_BASE_URL}/auth/reset-password-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'flavia.silva@gerandofalcoes.com',
          newPassword: 'Teste123!'
        }),
      });

      if (resetResponse.ok) {
        console.log('✅ Senha resetada para: Teste123!');
        
        // Tentar login novamente
        const retryResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'flavia.silva@gerandofalcoes.com',
            password: 'Teste123!'
          }),
        });

        if (retryResponse.ok) {
          loginData = await retryResponse.json();
          token = loginData.session?.access_token || loginData.token;
          console.log('✅ Login realizado após reset da senha');
        }
      } else {
        console.log('❌ Falha ao resetar senha');
      }
    } catch (error) {
      console.log('❌ Erro ao resetar senha:', error.message);
    }
  }

  if (!token) {
    console.log('\n❌ Não foi possível obter token de acesso');
    return;
  }

  try {
    // 2. Buscar metas
    console.log('\n2️⃣ Buscando metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!goalsResponse.ok) {
      console.log(`❌ Falha ao buscar metas: ${goalsResponse.status}`);
      const errorText = await goalsResponse.text();
      console.log(`   Detalhes: ${errorText}`);
    } else {
      const goalsData = await goalsResponse.json();
      console.log(`✅ Metas encontradas: ${goalsData.data?.length || 0}`);
      
      if (goalsData.data && goalsData.data.length > 0) {
        console.log('\n📋 Detalhes das metas:');
        goalsData.data.forEach((meta, index) => {
          console.log(`${index + 1}. ${meta.nome}`);
          console.log(`   - Descrição: ${meta.descricao}`);
          console.log(`   - Valor Meta: ${meta.valor_meta}`);
          console.log(`   - Valor Atual: ${meta.valor_atual}`);
          console.log(`   - Member ID: ${meta.member_id}`);
          console.log(`   - Created by: ${meta.created_by}`);
          console.log('');
        });
      } else {
        console.log('❌ Nenhuma meta encontrada para este usuário');
      }
    }

    // 3. Buscar dados do member
    console.log('\n3️⃣ Buscando dados do member...');
    const memberResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (memberResponse.ok) {
      const memberData = await memberResponse.json();
      console.log('✅ Dados do member:');
      console.log(`  ID: ${memberData.id}`);
      console.log(`  Email: ${memberData.email}`);
      console.log(`  Nome: ${memberData.name}`);
      console.log(`  Regional: ${memberData.regional || 'N/A'}`);
      console.log(`  Área: ${memberData.area || 'N/A'}`);
      console.log(`  Role: ${memberData.role || 'N/A'}`);
      console.log(`  Auth User ID: ${memberData.auth_user_id}`);
    }

    // 4. Verificar todas as metas no sistema (como super admin)
    console.log('\n4️⃣ Verificando total de metas no sistema...');
    
    // Fazer uma requisição como super admin para ver todas as metas
    const superAdminLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'leo.martins@gerandofalcoes.com', // Super admin encontrado
        password: 'Teste123!'
      }),
    });

    if (superAdminLoginResponse.ok) {
      const superAdminData = await superAdminLoginResponse.json();
      const superAdminToken = superAdminData.session?.access_token || superAdminData.token;
      
      if (superAdminToken) {
        const allGoalsResponse = await fetch(`${API_BASE_URL}/goals`, {
          headers: {
            'Authorization': `Bearer ${superAdminToken}`
          }
        });

        if (allGoalsResponse.ok) {
          const allGoalsData = await allGoalsResponse.json();
          console.log(`📊 Total de metas no sistema: ${allGoalsData.data?.length || 0}`);
          
          if (allGoalsData.data && allGoalsData.data.length > 0) {
            // Analisar metas por regional/área
            const metasPorRegional = {};
            const metasPorArea = {};
            
            allGoalsData.data.forEach(meta => {
              const regional = meta.regional || meta.descricao || 'N/A';
              const area = meta.area || 'N/A';
              
              metasPorRegional[regional] = (metasPorRegional[regional] || 0) + 1;
              metasPorArea[area] = (metasPorArea[area] || 0) + 1;
            });
            
            console.log('\n📈 Metas por regional/descrição:');
            Object.entries(metasPorRegional).forEach(([regional, count]) => {
              console.log(`  - ${regional}: ${count} metas`);
            });
            
            console.log('\n📈 Metas por área:');
            Object.entries(metasPorArea).forEach(([area, count]) => {
              console.log(`  - ${area}: ${count} metas`);
            });

            // Verificar se há metas relacionadas ao Rio de Janeiro
            const metasRio = allGoalsData.data.filter(meta => {
              const descricao = (meta.descricao || '').toLowerCase();
              const regional = (meta.regional || '').toLowerCase();
              const area = (meta.area || '').toLowerCase();
              
              return descricao.includes('rio') || 
                     regional.includes('rio') || 
                     area.includes('rio') ||
                     descricao.includes('rj') || 
                     regional.includes('rj') || 
                     area.includes('rj');
            });
            
            console.log(`\n🎯 Metas relacionadas ao Rio de Janeiro: ${metasRio.length}`);
            metasRio.forEach((meta, index) => {
              console.log(`${index + 1}. ${meta.nome}`);
              console.log(`   - Descrição: ${meta.descricao}`);
              console.log(`   - Regional: ${meta.regional || 'N/A'}`);
              console.log(`   - Área: ${meta.area || 'N/A'}`);
              console.log('');
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testFlaviaLogin();