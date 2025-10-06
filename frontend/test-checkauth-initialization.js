// Teste específico para verificar se o checkAuth está funcionando corretamente na inicialização
const API_BASE_URL = 'http://localhost:4000';

// Mock do localStorage para Node.js
const localStorage = {
  data: {},
  getItem(key) {
    return this.data[key] || null;
  },
  setItem(key, value) {
    this.data[key] = value;
  },
  removeItem(key) {
    delete this.data[key];
  },
  clear() {
    this.data = {};
  }
};

// Simular o comportamento do checkAuth na inicialização
async function testCheckAuthInitialization() {
  console.log('🚀 Testando checkAuth na inicialização...\n');

  // 1. Limpar dados anteriores
  console.log('1️⃣ Limpando dados anteriores...');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  console.log('✅ Dados limpos\n');

  // 2. Testar checkAuth sem token (cenário de primeira visita)
  console.log('2️⃣ Testando checkAuth sem token (primeira visita)...');
  const resultWithoutToken = await simulateCheckAuth();
  console.log('Resultado sem token:', resultWithoutToken);
  console.log('');

  // 3. Fazer login para obter token
  console.log('3️⃣ Fazendo login para obter token...');
  const loginResult = await simulateLogin();
  if (!loginResult.success) {
    console.error('❌ Falha no login, interrompendo teste');
    return;
  }
  console.log('✅ Login realizado com sucesso\n');

  // 4. Testar checkAuth com token válido (cenário de usuário logado)
  console.log('4️⃣ Testando checkAuth com token válido...');
  const resultWithToken = await simulateCheckAuth();
  console.log('Resultado com token:', resultWithToken);
  console.log('');

  // 5. Testar com token inválido
  console.log('5️⃣ Testando checkAuth com token inválido...');
  localStorage.setItem('auth_token', 'token_invalido_123');
  const resultWithInvalidToken = await simulateCheckAuth();
  console.log('Resultado com token inválido:', resultWithInvalidToken);
  console.log('');

  // 6. Verificar se dados foram limpos após token inválido
  console.log('6️⃣ Verificando limpeza após token inválido...');
  const tokenAfterInvalid = localStorage.getItem('auth_token');
  const userAfterInvalid = localStorage.getItem('auth_user');
  console.log('Token após inválido:', tokenAfterInvalid);
  console.log('User após inválido:', userAfterInvalid);
  console.log('');

  console.log('🎉 Teste de checkAuth na inicialização concluído!');
}

// Simular o comportamento do checkAuth
async function simulateCheckAuth() {
  try {
    console.log('🔐 Simulando checkAuth...');
    
    // Verificar token no localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.log('❌ Nenhum token encontrado');
      return { authenticated: false, user: null, reason: 'no_token' };
    }

    console.log('📡 Token encontrado, fazendo requisição para /auth/me');
    
    // Fazer requisição para /auth/me
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status da resposta:', response.status);

    if (!response.ok) {
      console.log('❌ Resposta não OK:', response.status);
      if (response.status === 401) {
        console.log('🗑️ Token inválido, limpando dados');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        return { authenticated: false, user: null, reason: 'invalid_token' };
      }
      return { authenticated: false, user: null, reason: 'api_error' };
    }

    const data = await response.json();
    console.log('✅ Dados do usuário obtidos:', data);
    
    return { 
      authenticated: true, 
      user: data.member || data.user, 
      reason: 'success' 
    };

  } catch (error) {
    console.error('💥 Erro no checkAuth:', error);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    return { authenticated: false, user: null, reason: 'error', error: error.message };
  }
}

// Simular login
async function simulateLogin() {
  try {
    console.log('📡 Fazendo login...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'superadmin@decolagem.com',
        password: 'SuperAdmin2024!'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro no login:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    console.log('✅ Login bem-sucedido');
    console.log('📦 Dados recebidos:', data);
    
    // Salvar token no localStorage
    if (data.session?.access_token) {
      console.log('💾 Salvando token do session:', data.session.access_token);
      localStorage.setItem('auth_token', data.session.access_token);
      if (data.member) {
        localStorage.setItem('auth_user', JSON.stringify(data.member));
      }
    } else if (data.token) {
      console.log('💾 Salvando token direto:', data.token);
      localStorage.setItem('auth_token', data.token);
      if (data.member) {
        localStorage.setItem('auth_user', JSON.stringify(data.member));
      }
    } else {
      console.log('⚠️ Nenhum token recebido no login');
    }

    // Verificar se foi salvo
    const savedToken = localStorage.getItem('auth_token');
    console.log('🔍 Token salvo verificado:', savedToken);

    return { success: true, data };

  } catch (error) {
    console.error('💥 Erro no login:', error);
    return { success: false, error: error.message };
  }
}

// Executar o teste
testCheckAuthInitialization().catch(console.error);