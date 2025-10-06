require('dotenv').config();
const http = require('http');

const BASE_URL = 'http://localhost:4000';

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
            status: res.statusCode,
            headers: res.headers,
            rawBody: body
          });
        } catch (e) {
          resolve({ 
            success: res.statusCode >= 200 && res.statusCode < 300, 
            data: body, 
            status: res.statusCode,
            headers: res.headers,
            rawBody: body
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

async function debugApiErrors() {
  console.log('🔍 Debugando erros específicos das APIs...\n');
  
  // 1. Primeiro, fazer login para obter token
  console.log('1. Fazendo login...');
  
  const testEmail = `teste-${Date.now()}@example.com`;
  const testPassword = 'senha123456';
  
  const createUser = await makeRequest('POST', '/dev/create-test-user', {
    email: testEmail,
    password: testPassword,
    nome: 'Usuário de Teste Debug',
    role: 'member'
  });
  
  if (!createUser.success) {
    console.log(`❌ Erro ao criar usuário: ${createUser.status}`);
    return;
  }
  
  const login = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  });
  
  if (!login.success) {
    console.log(`❌ Erro no login: ${login.status}`);
    return;
  }
  
  const token = login.data?.session?.access_token;
  if (!token) {
    console.log(`❌ Token não encontrado`);
    return;
  }
  
  console.log(`✅ Login realizado com sucesso!`);
  
  const authHeaders = { 'Authorization': `Bearer ${token}` };
  
  // 2. Debugar endpoints que retornam 400
  console.log('\n2. Debugando endpoints com erro 400...');
  
  const microcredito = await makeRequest('GET', '/microcredito', null, authHeaders);
  console.log(`\n🔍 /microcredito:`);
  console.log(`   Status: ${microcredito.status}`);
  console.log(`   Resposta: ${JSON.stringify(microcredito.data, null, 2)}`);
  
  const asmaras = await makeRequest('GET', '/asmaras', null, authHeaders);
  console.log(`\n🔍 /asmaras:`);
  console.log(`   Status: ${asmaras.status}`);
  console.log(`   Resposta: ${JSON.stringify(asmaras.data, null, 2)}`);
  
  const decolagem = await makeRequest('GET', '/decolagem', null, authHeaders);
  console.log(`\n🔍 /decolagem:`);
  console.log(`   Status: ${decolagem.status}`);
  console.log(`   Resposta: ${JSON.stringify(decolagem.data, null, 2)}`);
  
  // 3. Debugar operações POST
  console.log('\n3. Debugando operações POST...');
  
  const postGoals = await makeRequest('POST', '/goals', {
    title: 'Meta de Teste Debug',
    description: 'Descrição da meta de teste',
    target_value: 1000,
    current_value: 0
  }, authHeaders);
  console.log(`\n🔍 POST /goals:`);
  console.log(`   Status: ${postGoals.status}`);
  console.log(`   Resposta: ${JSON.stringify(postGoals.data, null, 2)}`);
  
  const postActivities = await makeRequest('POST', '/activities', {
    title: 'Atividade de Teste Debug',
    description: 'Descrição da atividade de teste',
    type: 'meeting'
  }, authHeaders);
  console.log(`\n🔍 POST /activities:`);
  console.log(`   Status: ${postActivities.status}`);
  console.log(`   Resposta: ${JSON.stringify(postActivities.data, null, 2)}`);
  
  // 4. Testar com dados mínimos
  console.log('\n4. Testando POST com dados mínimos...');
  
  const postGoalsMinimal = await makeRequest('POST', '/goals', {
    nome: 'Meta Mínima',
    valor_meta: 100
  }, authHeaders);
  console.log(`\n🔍 POST /goals (mínimo):`);
  console.log(`   Status: ${postGoalsMinimal.status}`);
  console.log(`   Resposta: ${JSON.stringify(postGoalsMinimal.data, null, 2)}`);
  
  const postActivitiesMinimal = await makeRequest('POST', '/activities', {
    titulo: 'Atividade Mínima'
  }, authHeaders);
  console.log(`\n🔍 POST /activities (mínimo):`);
  console.log(`   Status: ${postActivitiesMinimal.status}`);
  console.log(`   Resposta: ${JSON.stringify(postActivitiesMinimal.data, null, 2)}`);
  
  // 5. Verificar estrutura das tabelas
  console.log('\n5. Verificando estrutura das tabelas...');
  
  const dbTables = await makeRequest('GET', '/db/tables');
  console.log(`\n🔍 /db/tables:`);
  console.log(`   Status: ${dbTables.status}`);
  if (dbTables.success && dbTables.data) {
    console.log(`   Tabelas encontradas: ${Object.keys(dbTables.data).join(', ')}`);
  }
  
  console.log('\n✅ Debug concluído!');
}

debugApiErrors().catch(console.error);