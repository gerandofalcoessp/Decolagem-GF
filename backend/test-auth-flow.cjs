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
            headers: res.headers
          });
        } catch (e) {
          resolve({ 
            success: res.statusCode >= 200 && res.statusCode < 300, 
            data: body, 
            status: res.statusCode,
            headers: res.headers
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

async function testAuthFlow() {
  console.log('🔐 Testando fluxo completo de autenticação e APIs...\n');
  
  // 1. Testar endpoints públicos
  console.log('1. Testando endpoints públicos...');
  
  const health = await makeRequest('GET', '/health');
  console.log(`✅ /health: ${health.success ? 'OK' : 'ERRO'} (${health.status})`);
  
  const root = await makeRequest('GET', '/');
  console.log(`✅ / (root): ${root.success ? 'OK' : 'ERRO'} (${root.status})`);
  
  const supabaseStatus = await makeRequest('GET', '/supabase/status');
  console.log(`✅ /supabase/status: ${supabaseStatus.success ? 'OK' : 'ERRO'} (${supabaseStatus.status})`);
  
  const dbStatus = await makeRequest('GET', '/db/status');
  console.log(`✅ /db/status: ${dbStatus.success ? 'OK' : 'ERRO'} (${dbStatus.status})`);
  
  // 2. Testar endpoints protegidos SEM token (devem retornar 401)
  console.log('\n2. Testando endpoints protegidos SEM token (esperado: 401)...');
  
  const membersNoAuth = await makeRequest('GET', '/members');
  console.log(`🔒 /members (sem token): ${membersNoAuth.status === 401 ? 'OK (401)' : `ERRO (${membersNoAuth.status})`}`);
  
  const goalsNoAuth = await makeRequest('GET', '/goals');
  console.log(`🔒 /goals (sem token): ${goalsNoAuth.status === 401 ? 'OK (401)' : `ERRO (${goalsNoAuth.status})`}`);
  
  const activitiesNoAuth = await makeRequest('GET', '/activities');
  console.log(`🔒 /activities (sem token): ${activitiesNoAuth.status === 401 ? 'OK (401)' : `ERRO (${activitiesNoAuth.status})`}`);
  
  // 3. Criar usuário de teste (se em desenvolvimento)
  console.log('\n3. Criando usuário de teste...');
  
  const testEmail = `teste-${Date.now()}@example.com`;
  const testPassword = 'senha123456';
  
  const createUser = await makeRequest('POST', '/dev/create-test-user', {
    email: testEmail,
    password: testPassword,
    nome: 'Usuário de Teste',
    role: 'member'
  });
  
  if (createUser.success) {
    console.log(`✅ Usuário criado: ${testEmail}`);
  } else {
    console.log(`❌ Erro ao criar usuário: ${createUser.status} - ${JSON.stringify(createUser.data)}`);
    return;
  }
  
  // 4. Fazer login para obter token
  console.log('\n4. Fazendo login...');
  
  const login = await makeRequest('POST', '/auth/login', {
    email: testEmail,
    password: testPassword
  });
  
  if (!login.success) {
    console.log(`❌ Erro no login: ${login.status} - ${JSON.stringify(login.data)}`);
    return;
  }
  
  const token = login.data?.session?.access_token;
  if (!token) {
    console.log(`❌ Token não encontrado na resposta do login`);
    console.log('Resposta do login:', JSON.stringify(login.data, null, 2));
    return;
  }
  
  console.log(`✅ Login realizado com sucesso! Token obtido.`);
  
  // 5. Testar endpoints protegidos COM token
  console.log('\n5. Testando endpoints protegidos COM token...');
  
  const authHeaders = { 'Authorization': `Bearer ${token}` };
  
  const me = await makeRequest('GET', '/auth/me', null, authHeaders);
  console.log(`🔓 /auth/me: ${me.success ? 'OK' : `ERRO (${me.status})`}`);
  if (me.success) {
    console.log(`   Usuário: ${me.data?.user?.email}`);
  }
  
  const membersAuth = await makeRequest('GET', '/members', null, authHeaders);
  console.log(`🔓 /members: ${membersAuth.success ? 'OK' : `ERRO (${membersAuth.status})`}`);
  if (membersAuth.success) {
    console.log(`   Membros encontrados: ${membersAuth.data?.data?.length || 0}`);
  }
  
  const goalsAuth = await makeRequest('GET', '/goals', null, authHeaders);
  console.log(`🔓 /goals: ${goalsAuth.success ? 'OK' : `ERRO (${goalsAuth.status})`}`);
  if (goalsAuth.success) {
    console.log(`   Metas encontradas: ${goalsAuth.data?.data?.length || 0}`);
  }
  
  const activitiesAuth = await makeRequest('GET', '/activities', null, authHeaders);
  console.log(`🔓 /activities: ${activitiesAuth.success ? 'OK' : `ERRO (${activitiesAuth.status})`}`);
  if (activitiesAuth.success) {
    console.log(`   Atividades encontradas: ${activitiesAuth.data?.data?.length || 0}`);
  }
  
  const microcreditoAuth = await makeRequest('GET', '/microcredito', null, authHeaders);
  console.log(`🔓 /microcredito: ${microcreditoAuth.success ? 'OK' : `ERRO (${microcreditoAuth.status})`}`);
  
  const asmarasAuth = await makeRequest('GET', '/asmaras', null, authHeaders);
  console.log(`🔓 /asmaras: ${asmarasAuth.success ? 'OK' : `ERRO (${asmarasAuth.status})`}`);
  
  const decolagemAuth = await makeRequest('GET', '/decolagem', null, authHeaders);
  console.log(`🔓 /decolagem: ${decolagemAuth.success ? 'OK' : `ERRO (${decolagemAuth.status})`}`);
  
  // 6. Testar operações POST
  console.log('\n6. Testando operações POST...');
  
  const createGoal = await makeRequest('POST', '/goals', {
    title: 'Meta de Teste',
    description: 'Descrição da meta de teste',
    target_value: 1000,
    current_value: 0
  }, authHeaders);
  console.log(`📝 POST /goals: ${createGoal.success ? 'OK' : `ERRO (${createGoal.status})`}`);
  
  const createActivity = await makeRequest('POST', '/activities', {
    title: 'Atividade de Teste',
    description: 'Descrição da atividade de teste',
    type: 'meeting'
  }, authHeaders);
  console.log(`📝 POST /activities: ${createActivity.success ? 'OK' : `ERRO (${createActivity.status})`}`);
  
  // 7. Testar logout
  console.log('\n7. Testando logout...');
  
  const logout = await makeRequest('POST', '/auth/logout', null, authHeaders);
  console.log(`🚪 /auth/logout: ${logout.success ? 'OK' : `ERRO (${logout.status})`}`);
  
  // 8. Verificar se token foi invalidado
  console.log('\n8. Verificando invalidação do token...');
  
  const meAfterLogout = await makeRequest('GET', '/auth/me', null, authHeaders);
  console.log(`🔒 /auth/me (após logout): ${meAfterLogout.status === 401 ? 'OK (401)' : `ERRO (${meAfterLogout.status})`}`);
  
  console.log('\n✅ Teste de fluxo de autenticação concluído!');
}

testAuthFlow().catch(console.error);