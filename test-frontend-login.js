// Script para testar login no frontend
const API_BASE_URL = 'http://localhost:4000';

async function testFrontendLogin() {
  console.log('🔍 Testando login no frontend...\n');
  
  try {
    // 1. Fazer login
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

    console.log('Status do login:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Erro no login:', errorText);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    console.log('Dados recebidos:', JSON.stringify(loginData, null, 2));

    // 2. Verificar se o token está presente
    const token = loginData.session?.access_token;
    if (!token) {
      console.error('❌ Token não encontrado na resposta!');
      return;
    }

    console.log('🔑 Token obtido:', token.substring(0, 50) + '...');

    // 3. Testar API de atividades regionais com o token
    console.log('\n2. Testando API de atividades regionais...');
    const activitiesResponse = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status das atividades:', activitiesResponse.status);
    
    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log('✅ Atividades carregadas com sucesso!');
      console.log('Número de atividades:', activities.length || 0);
      console.log('Dados das atividades:', JSON.stringify(activities, null, 2));
    } else {
      const errorText = await activitiesResponse.text();
      console.error('❌ Erro ao carregar atividades:', errorText);
    }

    // 4. Testar API de metas
    console.log('\n3. Testando API de metas...');
    const goalsResponse = await fetch(`${API_BASE_URL}/api/goals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status das metas:', goalsResponse.status);
    
    if (goalsResponse.ok) {
      const goals = await goalsResponse.json();
      console.log('✅ Metas carregadas com sucesso!');
      console.log('Número de metas:', goals.length || 0);
    } else {
      const errorText = await goalsResponse.text();
      console.error('❌ Erro ao carregar metas:', errorText);
    }

    // 5. Testar API de usuário atual
    console.log('\n4. Testando API de usuário atual...');
    const userResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status do usuário:', userResponse.status);
    
    if (userResponse.ok) {
      const user = await userResponse.json();
      console.log('✅ Dados do usuário carregados com sucesso!');
      console.log('Usuário:', JSON.stringify(user, null, 2));
    } else {
      const errorText = await userResponse.text();
      console.error('❌ Erro ao carregar dados do usuário:', errorText);
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o teste
testFrontendLogin();