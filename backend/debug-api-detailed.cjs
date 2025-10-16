const { default: fetch } = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3002';

async function debugApiDetailed() {
  console.log('🔍 Debug detalhado da API...\n');

  try {
    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'flavio.almeida@gerandofalcoes.com',
        password: '123456'
      })
    });

    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.error('❌ Erro no login:', loginResponse.status, errorText);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.session.access_token;
    
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', loginData.user?.user_metadata?.full_name);
    console.log('🏢 Regional:', loginData.user?.user_metadata?.regional);
    console.log('🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...');

    // 2. Testar endpoint /me para verificar dados do usuário
    console.log('\n2️⃣ Verificando dados do usuário via /me...');
    const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.error('❌ Erro no /me:', meResponse.status, errorText);
      return;
    }

    const meData = await meResponse.json();
    console.log('✅ Dados do usuário via /me:', {
      id: meData.id,
      email: meData.email,
      regional: meData.regional,
      role: meData.role,
      full_name: meData.full_name
    });

    // 3. Fazer chamada para API de atividades com logs detalhados
    console.log('\n3️⃣ Chamando API de atividades regionais...');
    const activitiesResponse = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', activitiesResponse.status);
    console.log('📋 Headers da resposta:', Object.fromEntries(activitiesResponse.headers.entries()));

    if (!activitiesResponse.ok) {
      const errorText = await activitiesResponse.text();
      console.error('❌ Erro na API de atividades:', activitiesResponse.status, errorText);
      return;
    }

    const activitiesData = await activitiesResponse.json();
    console.log('✅ Resposta da API de atividades:');
    console.log('   - Tipo de dados:', typeof activitiesData);
    console.log('   - É array?:', Array.isArray(activitiesData));
    console.log('   - Quantidade:', Array.isArray(activitiesData) ? activitiesData.length : 'N/A');
    
    if (Array.isArray(activitiesData) && activitiesData.length > 0) {
      console.log('   - Primeira atividade:', {
        id: activitiesData[0].id,
        titulo: activitiesData[0].titulo,
        regional: activitiesData[0].regional,
        created_at: activitiesData[0].created_at
      });
    } else {
      console.log('   - Estrutura dos dados:', Object.keys(activitiesData || {}));
      console.log('   - Dados completos:', JSON.stringify(activitiesData, null, 2).substring(0, 500) + '...');
    }

    // 4. Fazer chamada para API de eventos do calendário
    console.log('\n4️⃣ Chamando API de eventos do calendário...');
    const eventsResponse = await fetch(`${API_BASE_URL}/api/calendar-events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status da resposta:', eventsResponse.status);

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('❌ Erro na API de eventos:', eventsResponse.status, errorText);
      return;
    }

    const eventsData = await eventsResponse.json();
    console.log('✅ Resposta da API de eventos:');
    console.log('   - Tipo de dados:', typeof eventsData);
    console.log('   - É array?:', Array.isArray(eventsData));
    console.log('   - Estrutura:', Object.keys(eventsData || {}));
    
    if (eventsData.data && Array.isArray(eventsData.data)) {
      console.log('   - Quantidade de eventos:', eventsData.data.length);
      if (eventsData.data.length > 0) {
        console.log('   - Primeiro evento:', {
          id: eventsData.data[0].id,
          title: eventsData.data[0].title,
          regional: eventsData.data[0].regional,
          start_date: eventsData.data[0].start_date
        });
      }
    } else {
      console.log('   - Dados completos:', JSON.stringify(eventsData, null, 2).substring(0, 500) + '...');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugApiDetailed().then(() => {
  console.log('\n🎯 Debug detalhado concluído!');
});