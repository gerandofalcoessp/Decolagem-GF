// Script para debugar problemas de autenticação
const API_BASE_URL = 'http://localhost:4000';

async function debugAuthIssue() {
  console.log('🔍 Debugando problemas de autenticação...\n');

  // 1. Verificar se o backend está respondendo
  console.log('1. Testando conectividade com o backend...');
  try {
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log(`✅ Backend respondendo: ${healthResponse.status}`);
  } catch (error) {
    console.log(`❌ Backend não está respondendo: ${error.message}`);
    return;
  }

  // 2. Testar login para obter token válido
  console.log('\n2. Testando login...');
  try {
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'leo.martins@gerandofalcoes.com',
        password: 'senha123'
      }),
    });

    console.log(`Status do login: ${loginResponse.status}`);
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log(`❌ Erro no login:`, errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    console.log('Estrutura da resposta:', Object.keys(loginData));
    
    const token = loginData.session?.access_token;
    if (!token) {
      console.log('❌ Token não encontrado na resposta do login');
      console.log('Resposta completa:', JSON.stringify(loginData, null, 2));
      return;
    }

    console.log(`✅ Token obtido: ${token.substring(0, 20)}...`);

    // 3. Testar endpoints que estão falhando
    console.log('\n3. Testando endpoints com token...');
    
    const endpoints = ['/api/auth/me', '/api/members', '/api/goals'];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTestando ${endpoint}...`);
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint} funcionando`);
          console.log(`Tipo de dados: ${Array.isArray(data) ? 'Array' : typeof data}`);
        } else {
          const errorData = await response.json();
          console.log(`❌ ${endpoint} falhou:`, errorData);
        }
      } catch (error) {
        console.log(`❌ Erro ao testar ${endpoint}:`, error.message);
      }
    }

    // 4. Testar endpoint que retorna 404
    console.log('\n4. Testando endpoint /api/atividades...');
    try {
      const atividadesResponse = await fetch(`${API_BASE_URL}/api/atividades`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`Status /api/atividades: ${atividadesResponse.status}`);
      
      if (atividadesResponse.status === 404) {
        console.log('❌ Endpoint /api/atividades não existe no backend');
      }
    } catch (error) {
      console.log(`❌ Erro ao testar /api/atividades:`, error.message);
    }

  } catch (error) {
    console.log(`❌ Erro geral:`, error.message);
  }
}

// Executar o debug
debugAuthIssue().catch(console.error);