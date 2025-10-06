require('dotenv').config();
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:4000';

async function testAPIs() {
  console.log('🌐 Testando APIs principais do sistema...\n');
  
  // Função auxiliar para fazer requisições
  async function makeRequest(method, endpoint, data = null, headers = {}) {
    return new Promise((resolve) => {
      const url = new URL(`${BASE_URL}${endpoint}`);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = body ? JSON.parse(body) : null;
            resolve({ 
              success: res.statusCode >= 200 && res.statusCode < 300, 
              data: parsedData, 
              status: res.statusCode 
            });
          } catch (e) {
            resolve({ 
              success: res.statusCode >= 200 && res.statusCode < 300, 
              data: body, 
              status: res.statusCode 
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({ 
          success: false, 
          error: error.message, 
          status: 0 
        });
      });
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
  
  console.log('1. Testando endpoint de saúde...');
  const healthCheck = await makeRequest('GET', '/health');
  console.log(healthCheck.success ? '✅ Health check OK' : `❌ Health check falhou: ${healthCheck.error}`);
  
  console.log('\n2. Testando endpoints de autenticação...');
  
  // Testar /auth/me sem token
  const authMeNoToken = await makeRequest('GET', '/auth/me');
  console.log(authMeNoToken.status === 401 ? '✅ /auth/me protegido corretamente' : `⚠️  /auth/me: ${authMeNoToken.status}`);
  
  // Testar /auth/users
  const authUsers = await makeRequest('GET', '/auth/users');
  console.log(`📊 /auth/users: ${authUsers.success ? 'OK' : authUsers.error} (${authUsers.status})`);
  
  console.log('\n3. Testando endpoints de dados...');
  
  // Testar /members
  const members = await makeRequest('GET', '/members');
  console.log(`📊 /members: ${members.success ? `OK - ${JSON.stringify(members.data).length} chars` : members.error} (${members.status})`);
  
  // Testar /goals
  const goals = await makeRequest('GET', '/goals');
  console.log(`📊 /goals: ${goals.success ? `OK - ${JSON.stringify(goals.data).length} chars` : goals.error} (${goals.status})`);
  
  // Testar /microcredito
  const microcredito = await makeRequest('GET', '/microcredito');
  console.log(`📊 /microcredito: ${microcredito.success ? `OK - ${JSON.stringify(microcredito.data).length} chars` : microcredito.error} (${microcredito.status})`);
  
  // Testar /asmaras
  const asmaras = await makeRequest('GET', '/asmaras');
  console.log(`📊 /asmaras: ${asmaras.success ? `OK - ${JSON.stringify(asmaras.data).length} chars` : asmaras.error} (${asmaras.status})`);
  
  // Testar /decolagem
  const decolagem = await makeRequest('GET', '/decolagem');
  console.log(`📊 /decolagem: ${decolagem.success ? `OK - ${JSON.stringify(decolagem.data).length} chars` : decolagem.error} (${decolagem.status})`);
  
  console.log('\n4. Testando métodos HTTP...');
  
  // Testar POST em /members (sem autenticação)
  const postMembers = await makeRequest('POST', '/members', {
    name: 'Teste API',
    email: `teste-api-${Date.now()}@example.com`,
    phone: '11999999999'
  });
  console.log(`📝 POST /members: ${postMembers.success ? 'OK' : postMembers.error} (${postMembers.status})`);
  
  // Testar POST em /goals (sem autenticação)
  const postGoals = await makeRequest('POST', '/goals', {
    title: 'Meta de Teste API',
    description: 'Descrição da meta de teste',
    target_value: 1000,
    current_value: 0
  });
  console.log(`📝 POST /goals: ${postGoals.success ? 'OK' : postGoals.error} (${postGoals.status})`);
  
  console.log('\n5. Testando CORS...');
  
  // Testar CORS com origem permitida
  const corsTest = await makeRequest('GET', '/members', null, {
    'Origin': 'http://localhost:3001'
  });
  console.log(`🌐 CORS test: ${corsTest.success ? 'OK' : corsTest.error} (${corsTest.status})`);
  
  console.log('\n6. Testando endpoints inexistentes...');
  
  // Testar endpoint que não existe
  const notFound = await makeRequest('GET', '/endpoint-inexistente');
  console.log(notFound.status === 404 ? '✅ 404 funcionando corretamente' : `⚠️  Endpoint inexistente: ${notFound.status}`);
  
  console.log('\n📊 Resumo dos testes de API:');
  console.log('- Health check:', healthCheck.success ? '✅' : '❌');
  console.log('- Autenticação:', authMeNoToken.status === 401 ? '✅' : '❌');
  console.log('- Endpoints de dados:', (members.success || goals.success) ? '✅' : '❌');
  console.log('- Métodos HTTP:', (postMembers.success || postGoals.success) ? '✅' : '❌');
  console.log('- CORS:', corsTest.success ? '✅' : '❌');
  console.log('- Error handling:', notFound.status === 404 ? '✅' : '❌');
  
  // Análise detalhada dos erros
  console.log('\n🔍 Análise detalhada dos problemas encontrados:');
  
  if (!members.success) {
    console.log(`❌ /members: ${members.error}`);
  }
  
  if (!goals.success) {
    console.log(`❌ /goals: ${goals.error}`);
  }
  
  if (!microcredito.success) {
    console.log(`❌ /microcredito: ${microcredito.error}`);
  }
  
  if (!asmaras.success) {
    console.log(`❌ /asmaras: ${asmaras.error}`);
  }
  
  if (!decolagem.success) {
    console.log(`❌ /decolagem: ${decolagem.error}`);
  }
}

testAPIs().catch(console.error);