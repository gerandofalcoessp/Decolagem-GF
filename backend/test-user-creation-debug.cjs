const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testUserCreation() {
  console.log('🧪 Testando criação de usuário com logs detalhados...\n');
  
  try {
    // 1. Fazer login como super admin
    console.log('1. 🔐 Fazendo login como super admin...');
    
    // Tentar com os super admins reais encontrados
    const possibleCredentials = [
      { email: 'flavio.almeida@gerandofalcoes.com', password: '123456' },
      { email: 'leo.martins@gerandofalcoes.com', password: '123456' },
      { email: 'coord.regional.sp@gerandofalcoes.com', password: '123456' },
      { email: 'flavio.almeida@gerandofalcoes.com', password: 'admin123' },
      { email: 'leo.martins@gerandofalcoes.com', password: 'admin123' },
      { email: 'coord.regional.sp@gerandofalcoes.com', password: 'admin123' }
    ];

    let loginSuccess = false;
    let token = null;
    let adminUser = null;

    for (const cred of possibleCredentials) {
      console.log(`   Tentando: ${cred.email}`);
      
      const loginResponse = await makeRequest('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred),
      });

      if (loginResponse.status === 200) {
        console.log(`   ✅ Login realizado com sucesso!`);
        token = loginResponse.data.session?.access_token || loginResponse.data.access_token || loginResponse.data.token;
        adminUser = loginResponse.data.user;
        loginSuccess = true;
        break;
      } else {
        console.log(`   ❌ Falhou: ${loginResponse.data?.error || 'Credenciais inválidas'}`);
      }
    }

    if (!loginSuccess) {
      console.error('❌ Não foi possível fazer login com nenhum super admin');
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário logado:', adminUser?.email);
    console.log('🔑 Token obtido:', token.substring(0, 20) + '...');

    // 2. Tentar criar usuário
    console.log('\n2. 👤 Tentando criar novo usuário...');
    
    const userData = {
      email: `teste.debug.${Date.now()}@test.com`,
      password: 'TesteDebug123!',
      nome: 'Usuário Teste Debug',
      role: 'user',
      tipo: 'Regional',
      regional: 'R. Sudeste',
      funcao: 'Coordenador'
    };

    console.log('📝 Dados do usuário:', userData);

    const createResponse = await makeRequest('http://localhost:4000/api/auth/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('\n📊 Resposta da criação:');
    console.log('Status:', createResponse.status);
    console.log('Dados:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.status === 201) {
      console.log('✅ Usuário criado com sucesso!');
      
      // 3. Verificar se foi criado na tabela usuarios
      console.log('\n3. 🔍 Verificando se foi criado na tabela usuarios...');
      
      const usersResponse = await makeRequest('http://localhost:4000/api/auth/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (usersResponse.status === 200) {
        const newUser = usersResponse.data.users.find(u => u.email === userData.email);
        if (newUser) {
          console.log('✅ Usuário encontrado na tabela usuarios:');
          console.log('- ID:', newUser.id);
          console.log('- Email:', newUser.email);
          console.log('- Nome:', newUser.nome);
          console.log('- Role:', newUser.role);
          console.log('- Regional:', newUser.regional);
        } else {
          console.log('❌ Usuário não encontrado na tabela usuarios');
        }
      } else {
        console.log('❌ Erro ao listar usuários:', usersResponse.data);
      }
    } else {
      console.error('❌ Erro ao criar usuário:', createResponse.data);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testUserCreation();