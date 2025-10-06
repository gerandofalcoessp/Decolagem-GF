// Usando fetch nativo do Node.js (disponível a partir da versão 18)

const API_BASE_URL = 'http://localhost:4000';

async function testUsersEndpoint() {
  try {
    console.log('🔍 Testando endpoint /auth/users...');
    
    // Primeiro, fazer login para obter o token
    console.log('📡 Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@decolagem.com',
        password: 'SuperAdmin2024!'
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Erro no login: ${loginResponse.status} ${loginResponse.statusText}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso');
    console.log('👤 Usuário logado:', loginData.user?.email);
    
    const token = loginData.session?.access_token;
    if (!token) {
      throw new Error('Token não encontrado na resposta do login');
    }

    // Agora testar o endpoint /auth/users
    console.log('\n📡 Testando endpoint /auth/users...');
    const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📊 Status da resposta:', usersResponse.status);
    
    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      throw new Error(`Erro na requisição: ${usersResponse.status} ${usersResponse.statusText}\nResposta: ${errorText}`);
    }

    const usersData = await usersResponse.json();
    console.log('✅ Dados recebidos com sucesso');
    console.log('📊 Estrutura da resposta:', Object.keys(usersData));
    
    if (usersData.users) {
      console.log(`👥 Total de usuários encontrados: ${usersData.users.length}`);
      
      if (usersData.users.length > 0) {
        console.log('\n📋 Primeiro usuário (exemplo):');
        const firstUser = usersData.users[0];
        console.log('- ID:', firstUser.id);
        console.log('- Email:', firstUser.email);
        console.log('- Nome:', firstUser.nome);
        console.log('- Role:', firstUser.role);
        console.log('- Regional:', firstUser.regional);
        console.log('- Email confirmado:', firstUser.email_confirmed_at ? 'Sim' : 'Não');
        console.log('- Criado em:', firstUser.created_at);
        
        console.log('\n📋 Todos os usuários:');
        usersData.users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.nome || user.email} (${user.email}) - Role: ${user.role || 'N/A'} - Status: ${user.email_confirmed_at ? 'Ativo' : 'Inativo'}`);
        });
      } else {
        console.log('⚠️ Nenhum usuário encontrado');
      }
    } else {
      console.log('⚠️ Propriedade "users" não encontrada na resposta');
      console.log('📄 Resposta completa:', JSON.stringify(usersData, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testUsersEndpoint();