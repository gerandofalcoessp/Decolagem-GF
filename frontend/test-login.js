// Script de teste detalhado para simular o fluxo do frontend
const API_BASE_URL = 'http://localhost:4000/api';

async function testFrontendLoginFlow() {
  console.log('🔍 Testando fluxo completo do frontend...');
  
  try {
    // 1. Simular login
    console.log('\n📡 1. Fazendo login...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'frontend.tester@example.com',
        password: 'Dev@123456'
      }),
    });

    console.log('Status do login:', loginResponse.status);
    console.log('Headers do login:', Object.fromEntries(loginResponse.headers.entries()));

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.error('❌ Erro no login:', errorData);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login bem-sucedido!');
    console.log('Dados recebidos:', JSON.stringify(loginData, null, 2));

    // 2. Simular armazenamento no localStorage (como o AuthService faz)
    console.log('\n💾 2. Simulando armazenamento no localStorage...');
    const token = loginData.session?.access_token;
    console.log('Token recebido:', token ? 'Presente' : 'Ausente');
    
    if (!token) {
      console.error('❌ Token não encontrado na resposta!');
      return;
    }

    // 3. Simular mapToFrontendUser
    console.log('\n🔄 3. Simulando mapToFrontendUser...');
    const mappedUser = {
      id: loginData.member?.id || loginData.user.id,
      nome: loginData.member?.nome || loginData.user.nome || '',
      email: loginData.member?.email || loginData.user.email,
      role: (loginData.member?.role || loginData.user.role || 'equipe_interna'),
      regional: (loginData.member?.regional || loginData.user.regional || ''),
      ativo: loginData.member?.ativo ?? true,
      created_at: loginData.member?.created_at || new Date().toISOString(),
      updated_at: loginData.member?.updated_at || new Date().toISOString(),
    };
    console.log('Usuário mapeado:', JSON.stringify(mappedUser, null, 2));

    // 4. Testar getCurrentUser (como o checkAuth faz)
    console.log('\n🔐 4. Testando getCurrentUser...');
    const currentUserResponse = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status do getCurrentUser:', currentUserResponse.status);
    console.log('Headers do getCurrentUser:', Object.fromEntries(currentUserResponse.headers.entries()));

    if (!currentUserResponse.ok) {
      const errorData = await currentUserResponse.json();
      console.error('❌ Erro no getCurrentUser:', errorData);
      return;
    }

    const currentUserData = await currentUserResponse.json();
    console.log('✅ getCurrentUser bem-sucedido!');
    console.log('Dados do usuário atual:', JSON.stringify(currentUserData, null, 2));

    // 5. Verificar se os dados são consistentes
    console.log('\n🔍 5. Verificando consistência dos dados...');
    const loginUserId = loginData.member?.id || loginData.user.id;
    const currentUserId = currentUserData.member?.id || currentUserData.user.id;
    
    if (loginUserId === currentUserId) {
      console.log('✅ Dados consistentes entre login e getCurrentUser');
    } else {
      console.log('⚠️ Inconsistência detectada:');
      console.log('  Login user ID:', loginUserId);
      console.log('  Current user ID:', currentUserId);
    }

    // 6. Testar rotas protegidas
    console.log('\n🛡️ 6. Testando rotas protegidas...');
    const protectedEndpoints = [
      { path: '/regionals/users', label: 'Regionals Users' },
      { path: '/regional-activities', label: 'Regional Activities' },
    ];

    for (const ep of protectedEndpoints) {
      console.log(`\n📡 Chamando ${ep.label} (${ep.path})...`);
      const resp = await fetch(`${API_BASE_URL}${ep.path}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log(`Status ${ep.label}:`, resp.status);
      if (!resp.ok) {
        let err;
        try { err = await resp.json(); } catch {}
        console.error(`❌ Erro em ${ep.label}:`, err || resp.statusText);
      } else {
        const data = await resp.json();
        console.log(`✅ ${ep.label} OK`);
        console.log(`${ep.label} dados:`, JSON.stringify(data, null, 2));
      }
    }

    console.log('\n🎉 Teste completo finalizado com sucesso!');

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o teste
testFrontendLoginFlow();