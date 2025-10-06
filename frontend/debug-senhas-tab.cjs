// Script para debugar o carregamento de dados na aba Senhas
// Usando fetch nativo do Node.js (disponível a partir da versão 18)

const API_BASE_URL = 'http://localhost:4000';

async function debugSenhasTab() {
  try {
    console.log('🔍 Debugando aba Senhas...');
    
    // Primeiro, fazer login para obter token
    console.log('🔐 Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@decolagem.com',
        password: 'SuperAdmin2024!'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Login falhou: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('📋 Estrutura da resposta do login:');
    console.log(JSON.stringify(loginData, null, 2));
    console.log('🎫 Token obtido:', loginData.session?.access_token ? 'SIM' : 'NÃO');

    // Agora testar o endpoint de usuários
    console.log('\n📡 Testando endpoint /auth/users...');
    const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', usersResponse.status);

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      throw new Error(`Erro ao buscar usuários: ${usersResponse.status} - ${errorText}`);
    }

    const usersData = await usersResponse.json();
    console.log('✅ Dados de usuários obtidos com sucesso');
    console.log('📋 Estrutura completa da resposta:');
    console.log(JSON.stringify(usersData, null, 2));
    
    // Verificar se é um array ou objeto
    if (Array.isArray(usersData)) {
      console.log('👥 Número de usuários:', usersData.length);
    } else {
      console.log('📦 Tipo de dados:', typeof usersData);
      console.log('🔑 Chaves disponíveis:', Object.keys(usersData));
      
      // Verificar se há uma propriedade que contém os usuários
      if (usersData.users && Array.isArray(usersData.users)) {
        console.log('👥 Número de usuários (em usersData.users):', usersData.users.length);
      }
    }
    
    if (usersData.length > 0) {
      console.log('\n📋 Estrutura do primeiro usuário:');
      console.log(JSON.stringify(usersData[0], null, 2));
    }

    // Verificar se os campos esperados estão presentes
    if (usersData.length > 0) {
      const firstUser = usersData[0];
      const expectedFields = ['id', 'email', 'nome', 'tipo', 'regional', 'createdAt'];
      
      console.log('\n🔍 Verificando campos esperados:');
      expectedFields.forEach(field => {
        const hasField = field in firstUser;
        console.log(`  ${field}: ${hasField ? '✅' : '❌'}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante o debug:', error.message);
  }
}

debugSenhasTab();