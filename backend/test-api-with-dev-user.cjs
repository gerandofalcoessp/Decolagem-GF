const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config();

async function testApiWithDevUser() {
  try {
    console.log('🧪 Testando API com usuário de desenvolvimento...\n');
    
    // 1. Criar usuário de teste usando endpoint DEV
    console.log('👤 Criando usuário de teste...');
    const createUserResponse = await fetch('http://localhost:4000/dev/create-test-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: `test-${Date.now()}@example.com`,
        password: 'Test@123456'
      })
    });
    
    if (!createUserResponse.ok) {
      console.error('❌ Erro ao criar usuário de teste:', createUserResponse.status);
      const errorData = await createUserResponse.json();
      console.error('   Detalhes:', errorData);
      return;
    }
    
    const userData = await createUserResponse.json();
    console.log('✅ Usuário de teste criado:');
    console.log(`   Email: ${userData.email}`);
    console.log(`   Token: ${userData.token.substring(0, 20)}...`);
    
    const token = userData.token;
    
    // 2. Testar endpoint /me
    console.log('\n🔍 Testando endpoint /me...');
    const meResponse = await fetch('http://localhost:4000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${meResponse.status}`);
    const meData = await meResponse.json();
    console.log(`   Dados:`, JSON.stringify(meData, null, 2));
    
    // 3. Testar endpoint GET regional-activities
    console.log('\n🔍 Testando GET /api/regional-activities...');
    const getResponse = await fetch('http://localhost:4000/api/regional-activities', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`   Status: ${getResponse.status}`);
    if (getResponse.status !== 200) {
      const errorData = await getResponse.json();
      console.log(`   Erro:`, JSON.stringify(errorData, null, 2));
    } else {
      console.log('   ✅ GET funcionou corretamente');
    }
    
    // 4. Testar endpoint POST regional-activities
    console.log('\n🔍 Testando POST /api/regional-activities...');
    const postData = {
      title: 'Teste de Atividade',
      description: 'Descrição de teste',
      type: 'workshop',
      activity_date: '2024-01-15',
      regional: 'R. Centro-Oeste',
      status: 'planejada'
    };
    
    const postResponse = await fetch('http://localhost:4000/api/regional-activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });
    
    console.log(`   Status: ${postResponse.status}`);
    const responseData = await postResponse.json();
    console.log(`   Resposta:`, JSON.stringify(responseData, null, 2));
    
    if (postResponse.status === 403) {
      console.log('\n💡 ERRO 403 CONFIRMADO!');
      console.log('   O middleware está bloqueando a requisição');
      console.log('   Isso significa que o usuário de teste não tem role adequada');
    } else if (postResponse.status === 201) {
      console.log('\n✅ POST funcionou corretamente!');
      console.log('   O problema pode estar na role do usuário específico');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testApiWithDevUser();