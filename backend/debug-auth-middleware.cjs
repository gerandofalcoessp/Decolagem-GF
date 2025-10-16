const { default: fetch } = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = 'http://localhost:4000';

async function debugAuthMiddleware() {
  try {
    console.log('🔍 Debugando middleware de autenticação...\n');
    
    // 1. Fazer login
    console.log('1️⃣ Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'flavio.almeida@gerandofalcoes.com',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Erro no login: ${loginResponse.status} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.session.access_token; // Use access_token instead of token
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Dados do usuário logado:');
    console.log('   - Nome:', loginData.user.nome);
    console.log('   - Email:', loginData.user.email);
    console.log('   - Regional:', loginData.user.regional);
    console.log('   - Função:', loginData.user.funcao);
    console.log('   - Role:', loginData.user.role);
    console.log('   - Token type:', typeof token);
    console.log('   - Token length:', token ? token.length : 0);
    console.log('');
    
    // 2. Testar endpoint /me para ver dados do middleware
    console.log('2️⃣ Testando endpoint /me...');
    const meResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!meResponse.ok) {
      const errorText = await meResponse.text();
      console.log('❌ Erro no endpoint /me:', meResponse.status, errorText);
    } else {
      const meData = await meResponse.json();
      console.log('✅ Dados do /me:');
      console.log('   - ID:', meData.id);
      console.log('   - Email:', meData.email);
      console.log('   - Regional:', meData.regional);
      console.log('   - Função:', meData.funcao);
      console.log('   - Role:', meData.role);
    }
    console.log('');
    
    // 3. Testar API de atividades regionais com logs detalhados
    console.log('3️⃣ Testando API de atividades regionais...');
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
      console.log('❌ Erro na API de atividades:', errorText);
    } else {
      const activitiesData = await activitiesResponse.json();
      console.log('✅ Resposta da API de atividades:');
      console.log('   - Tipo de dados:', typeof activitiesData);
      console.log('   - Estrutura:', Object.keys(activitiesData));
      console.log('   - Quantidade de atividades:', activitiesData.data?.length || 0);
      
      if (activitiesData.data && activitiesData.data.length > 0) {
        console.log('📋 Primeiras atividades:');
        activitiesData.data.slice(0, 3).forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.title} (Regional: ${activity.regional})`);
        });
      }
    }
    console.log('');
    
    // 4. Testar API de eventos do calendário
    console.log('4️⃣ Testando API de eventos do calendário...');
    const eventsResponse = await fetch(`${API_BASE_URL}/api/calendar-events`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status da resposta:', eventsResponse.status);
    
    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.log('❌ Erro na API de eventos:', errorText);
    } else {
      const eventsData = await eventsResponse.json();
      console.log('✅ Resposta da API de eventos:');
      console.log('   - Tipo de dados:', typeof eventsData);
      console.log('   - Estrutura:', Object.keys(eventsData));
      console.log('   - Quantidade de eventos:', eventsData.data?.length || 0);
      
      if (eventsData.data && eventsData.data.length > 0) {
        console.log('📋 Primeiros eventos:');
        eventsData.data.slice(0, 3).forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.titulo} (Regional: ${event.regional})`);
        });
      }
    }
    
    console.log('\n🎯 Debug concluído!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugAuthMiddleware();