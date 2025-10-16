// Debug script to test frontend data fetching and processing
// This script will simulate the dashboard data fetching to identify why cards are empty

const API_BASE_URL = 'http://localhost:3002';

async function debugFrontendData() {
  console.log('🔍 DEBUG: Testando processamento de dados do frontend');
  console.log('='.repeat(60));

  try {
    // 1. Login to get token
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
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.session?.access_token;
    
    if (!token) {
      throw new Error('Token não encontrado na resposta do login');
    }

    console.log('✅ Login realizado com sucesso');
    console.log('🔑 Token obtido:', token.substring(0, 20) + '...');

    // 2. Test /api/atividades endpoint (used by useActivities)
    console.log('\n2️⃣ Testando endpoint /api/atividades...');
    const atividadesResponse = await fetch(`${API_BASE_URL}/api/atividades`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', atividadesResponse.status);
    
    if (atividadesResponse.ok) {
      const atividadesData = await atividadesResponse.json();
      console.log('📊 Dados de atividades recebidos:');
      console.log('  - Tipo da resposta:', typeof atividadesData);
      console.log('  - Tem propriedade "data"?', 'data' in atividadesData);
      console.log('  - Estrutura:', Object.keys(atividadesData));
      
      const activities = atividadesData.data || atividadesData;
      console.log('  - Total de atividades:', Array.isArray(activities) ? activities.length : 'Não é array');
      
      if (Array.isArray(activities) && activities.length > 0) {
        console.log('  - Primeira atividade:', activities[0]);
        console.log('  - Campos da primeira atividade:', Object.keys(activities[0]));
      }
    } else {
      console.log('❌ Erro na resposta:', await atividadesResponse.text());
    }

    // 3. Test /api/regional-activities endpoint
    console.log('\n3️⃣ Testando endpoint /api/regional-activities...');
    const regionalResponse = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', regionalResponse.status);
    
    if (regionalResponse.ok) {
      const regionalData = await regionalResponse.json();
      console.log('📊 Dados de atividades regionais recebidos:');
      console.log('  - Tipo da resposta:', typeof regionalData);
      console.log('  - Tem propriedade "data"?', 'data' in regionalData);
      console.log('  - Estrutura:', Object.keys(regionalData));
      
      const regionalActivities = regionalData.data || regionalData;
      console.log('  - Total de atividades regionais:', Array.isArray(regionalActivities) ? regionalActivities.length : 'Não é array');
      
      if (Array.isArray(regionalActivities) && regionalActivities.length > 0) {
        console.log('  - Primeira atividade regional:', regionalActivities[0]);
        console.log('  - Campos da primeira atividade regional:', Object.keys(regionalActivities[0]));
      }
    } else {
      console.log('❌ Erro na resposta:', await regionalResponse.text());
    }

    // 4. Test /api/calendar-events endpoint
    console.log('\n4️⃣ Testando endpoint /api/calendar-events...');
    const eventsResponse = await fetch(`${API_BASE_URL}/api/calendar-events`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', eventsResponse.status);
    
    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log('📊 Dados de eventos recebidos:');
      console.log('  - Tipo da resposta:', typeof eventsData);
      console.log('  - Tem propriedade "data"?', 'data' in eventsData);
      console.log('  - Estrutura:', Object.keys(eventsData));
      
      const events = eventsData.data || eventsData;
      console.log('  - Total de eventos:', Array.isArray(events) ? events.length : 'Não é array');
      
      if (Array.isArray(events) && events.length > 0) {
        console.log('  - Primeiro evento:', events[0]);
        console.log('  - Campos do primeiro evento:', Object.keys(events[0]));
      }
    } else {
      console.log('❌ Erro na resposta:', await eventsResponse.text());
    }

    // 5. Test other endpoints used by dashboard
    const endpoints = [
      '/api/members',
      '/api/microcredito', 
      '/api/asmaras',
      '/api/decolagem'
    ];

    for (const endpoint of endpoints) {
      console.log(`\n5️⃣ Testando endpoint ${endpoint}...`);
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Dados de ${endpoint} recebidos:`);
        console.log('  - Tipo da resposta:', typeof data);
        console.log('  - Tem propriedade "data"?', 'data' in data);
        
        const items = data.data || data;
        console.log('  - Total de itens:', Array.isArray(items) ? items.length : 'Não é array');
        
        if (Array.isArray(items) && items.length > 0) {
          console.log('  - Primeiro item:', items[0]);
        }
      } else {
        console.log('❌ Erro na resposta:', await response.text());
      }
    }

    // 6. Simulate dashboard calculations
    console.log('\n6️⃣ Simulando cálculos do dashboard...');
    
    // Get all data again for calculations
    const allResponses = await Promise.all([
      fetch(`${API_BASE_URL}/api/atividades`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/regional-activities`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/members`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/microcredito`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/asmaras`, { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(`${API_BASE_URL}/api/decolagem`, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    const [activitiesRes, regionalRes, membersRes, microcreditoRes, asmarasRes, decolagemRes] = allResponses;
    
    const activitiesData = activitiesRes.ok ? await activitiesRes.json() : null;
    const regionalData = regionalRes.ok ? await regionalRes.json() : null;
    const membersData = membersRes.ok ? await membersRes.json() : null;
    const microcreditoData = microcreditoRes.ok ? await microcreditoRes.json() : null;
    const asmarasData = asmarasRes.ok ? await asmarasRes.json() : null;
    const decolagemData = decolagemRes.ok ? await decolagemRes.json() : null;

    // Extract arrays
    const activities = activitiesData?.data || activitiesData || [];
    const regionalActivities = regionalData?.data || regionalData || [];
    const members = membersData?.data || membersData || [];
    const microcredito = microcreditoData?.data || microcreditoData || [];
    const asmaras = asmarasData?.data || asmarasData || [];
    const decolagem = decolagemData?.data || decolagemData || [];

    console.log('📊 Arrays extraídos:');
    console.log('  - activities:', Array.isArray(activities) ? activities.length : 'Não é array');
    console.log('  - regionalActivities:', Array.isArray(regionalActivities) ? regionalActivities.length : 'Não é array');
    console.log('  - members:', Array.isArray(members) ? members.length : 'Não é array');
    console.log('  - microcredito:', Array.isArray(microcredito) ? microcredito.length : 'Não é array');
    console.log('  - asmaras:', Array.isArray(asmaras) ? asmaras.length : 'Não é array');
    console.log('  - decolagem:', Array.isArray(decolagem) ? decolagem.length : 'Não é array');

    // Simulate dashboard label matching (from DashboardPage.tsx)
    function isStringMatch(str1, str2) {
      if (!str1 || !str2) return false;
      const normalize = (s) => s.toLowerCase().trim().replace(/[^\w\s]/g, '');
      return normalize(str1).includes(normalize(str2)) || normalize(str2).includes(normalize(str1));
    }

    function sumActivitiesByLabels(labels) {
      if (!Array.isArray(activities)) return 0;
      return activities
        .filter(activity => labels.some(label => isStringMatch(activity.atividade_label || '', label)))
        .reduce((sum, activity) => sum + (parseFloat(activity.valor_realizado) || 0), 0);
    }

    // Test some key calculations
    const testLabels = [
      'Famílias Embarcadas Decolagem',
      'Diagnósticos Realizados', 
      'ONGs Decolagem',
      'ONGs Maras',
      'Retenção Decolagem',
      'Ligas Maras Formadas',
      'Total Maras',
      'Leads do dia',
      'Total de Leads',
      'NPS'
    ];

    console.log('\n📊 Testando cálculos por label:');
    testLabels.forEach(label => {
      const value = sumActivitiesByLabels([label]);
      console.log(`  - ${label}: ${value}`);
    });

    console.log('\n✅ Debug concluído!');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
  }
}

// Execute the debug
debugFrontendData();