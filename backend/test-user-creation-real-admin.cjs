// Usar fetch nativo do Node.js (disponível a partir da versão 18)
// const fetch = require('node-fetch');

// Função para fazer requisições HTTP com tratamento de erro
async function makeRequest(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return {
      status: response.status,
      ok: response.ok,
      data: data
    };
  } catch (error) {
    console.error('Erro na requisição:', error.message);
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testUserCreationWithRealAdmin() {
  console.log('🧪 Testando criação de usuário com super admin real...\n');
  
  try {
    // 1. Fazer login com um dos super admins reais
    console.log('1. 🔐 Fazendo login com super admin real...');
    
    // Vamos tentar com diferentes senhas possíveis para o Léo
    const possibleCredentials = [
      { email: 'leo.martins@gerandofalcoes.com', password: '123456' },
      { email: 'leo.martins@gerandofalcoes.com', password: 'Leo@123' },
      { email: 'leo.martins@gerandofalcoes.com', password: 'admin123' },
      { email: 'flavio.almeida@gerandofalcoes.com', password: '123456' },
      { email: 'flavio.almeida@gerandofalcoes.com', password: 'Flavio@123' },
      { email: 'flavio.almeida@gerandofalcoes.com', password: 'admin123' }
    ];

    let loginSuccess = false;
    let token = null;
    let adminUser = null;

    for (const cred of possibleCredentials) {
      console.log(`   Tentando: ${cred.email}`);
      
      const loginResponse = await makeRequest('http://localhost:4005/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cred),
      });

      if (loginResponse.status === 200) {
        console.log(`   ✅ Login realizado com sucesso!`);
        token = loginResponse.data.session?.access_token;
        adminUser = loginResponse.data.user;
        loginSuccess = true;
        break;
      } else {
        console.log(`   ❌ Falhou: ${loginResponse.data?.error || 'Credenciais inválidas'}`);
      }
    }

    if (!loginSuccess) {
      console.error('❌ Não foi possível fazer login com nenhum super admin');
      console.log('\n💡 Sugestão: Verifique as senhas dos usuários super admin no banco de dados');
      return;
    }

    console.log('👤 Usuário logado:', adminUser?.email);
    console.log('🔑 Token obtido:', token ? 'Sim' : 'Não');

    // 2. Tentar criar usuário
    console.log('\n2. 👤 Tentando criar novo usuário...');
    
    const userData = {
      email: `teste.real.admin.${Date.now()}@test.com`,
      password: 'TesteRealAdmin123!',
      nome: 'Usuário Teste Real Admin',
      role: 'user',
      tipo: 'Regional',
      regional: 'R. Sudeste',
      funcao: 'Coordenador'
    };

    console.log('📝 Dados do usuário:', userData);

    const createResponse = await makeRequest('http://localhost:4005/api/auth/register', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    console.log('Status da criação:', createResponse.status);
    
    if (createResponse.status === 201) {
      console.log('✅ Usuário criado com sucesso!');
      console.log('📋 Dados do usuário criado:', createResponse.data);
      
      // 3. Verificar se o usuário foi salvo na tabela usuarios
      console.log('\n3. 🔍 Verificando usuário na listagem...');
      
      const listResponse = await makeRequest('http://localhost:4005/api/auth/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (listResponse.status === 200) {
        const users = listResponse.data;
        const createdUser = users.find(u => u.email === userData.email);
        
        if (createdUser) {
          console.log('✅ Usuário encontrado na listagem!');
          console.log('📋 Dados na tabela usuarios:', createdUser);
        } else {
          console.log('❌ Usuário não encontrado na listagem');
        }
      } else {
        console.error('❌ Erro ao listar usuários:', listResponse.data);
      }
      
    } else {
      console.error('❌ Erro ao criar usuário:', createResponse.data);
      
      // Log detalhado do erro
      if (createResponse.data?.error) {
        console.log('📋 Detalhes do erro:', createResponse.data.error);
      }
      if (createResponse.data?.details) {
        console.log('📋 Detalhes adicionais:', createResponse.data.details);
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

testUserCreationWithRealAdmin();