// Script para testar o endpoint com login válido
const http = require('http');

async function testWithLogin() {
  console.log('🔍 Testando endpoint com login válido...\n');

  // 1. Fazer login
  console.log('1️⃣ Fazendo login...');
  
  const loginData = JSON.stringify({
    email: 'coord.regional.sp@gerandofalcoes.com',
    password: 'Admin123!'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  const loginResult = await new Promise((resolve, reject) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(loginData);
    req.end();
  });

  if (loginResult.status !== 200) {
    console.log(`❌ Erro no login: ${JSON.stringify(loginResult.data)}`);
    return;
  }

  console.log('✅ Login realizado com sucesso!');
  
  // Extrair token
  const token = loginResult.data.session?.access_token || loginResult.data.token;
  if (!token) {
    console.log('❌ Token não encontrado na resposta do login');
    console.log('Resposta completa:', JSON.stringify(loginResult.data, null, 2));
    return;
  }

  console.log(`🎫 Token obtido: ${token.substring(0, 20)}...`);

  // 2. Testar endpoint com token
  console.log('\n2️⃣ Testando endpoint /api/regional-activities...');
  
  const apiOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/regional-activities',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const apiResult = await new Promise((resolve, reject) => {
    const req = http.request(apiOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });

  console.log(`Status: ${apiResult.status}`);
  
  if (apiResult.status === 200) {
    console.log('✅ Endpoint funcionando!');
    
    const activities = apiResult.data.data || apiResult.data;
    console.log(`📊 Total de atividades: ${activities.length}`);
    
    // Filtrar atividades de "Famílias Embarcadas Decolagem"
    const familiasActivities = activities.filter(activity => {
      const label = activity.label || activity.atividade || '';
      return label.toLowerCase().includes('famílias embarcadas decolagem') ||
             label.toLowerCase().includes('familias embarcadas decolagem');
    });
    
    console.log(`👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas": ${familiasActivities.length}`);
    
    if (familiasActivities.length > 0) {
      const total = familiasActivities.reduce((sum, activity) => {
        return sum + (activity.quantidade || activity.quantity || 0);
      }, 0);
      console.log(`📈 Total de famílias: ${total}`);
      
      console.log('\n📋 Detalhes das atividades:');
      familiasActivities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.label || activity.atividade} - Quantidade: ${activity.quantidade || activity.quantity || 0}`);
      });
    }
  } else {
    console.log(`❌ Erro no endpoint: ${JSON.stringify(apiResult.data)}`);
  }

  // 3. Testar endpoint /api/atividades também
  console.log('\n3️⃣ Testando endpoint /api/atividades...');
  
  const atividadesOptions = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/atividades',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const atividadesResult = await new Promise((resolve, reject) => {
    const req = http.request(atividadesOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });

  console.log(`Status /api/atividades: ${atividadesResult.status}`);
  
  if (atividadesResult.status === 200) {
    const atividades = atividadesResult.data.data || atividadesResult.data;
    console.log(`📊 Total de atividades em /api/atividades: ${atividades.length}`);
  } else {
    console.log(`❌ Erro em /api/atividades: ${JSON.stringify(atividadesResult.data)}`);
  }
}

testWithLogin().catch(console.error);