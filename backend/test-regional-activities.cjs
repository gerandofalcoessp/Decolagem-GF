const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    if (options.data) {
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(options.data));
    }

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

async function testRegionalActivities() {
  try {
    console.log('🔐 Fazendo login...');
    
    const loginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      data: {
        email: 'teste.regional@decolagem.com',
        password: 'teste123'
      }
    });
    
    console.log('📋 Login response:', JSON.stringify(loginResponse, null, 2));
    
    if (loginResponse.status !== 200) {
      console.error('❌ Erro no login:', loginResponse.status, loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.session.access_token;
    const user = loginResponse.data.member;
    
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário:', user.name);
    console.log('🌍 Regional:', user.regional);
    
    console.log('\n📋 Testando endpoint /api/regional-activities...');
    
    const activitiesResponse = await makeRequest('http://localhost:3001/api/regional-activities', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });
    
    console.log('✅ Status:', activitiesResponse.status);
    console.log('📊 Atividades encontradas:', activitiesResponse.data.length);
    
    if (activitiesResponse.data.length > 0) {
      console.log('\n📝 Primeira atividade:');
      console.log(JSON.stringify(activitiesResponse.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testRegionalActivities();