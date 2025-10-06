// Teste completo do fluxo de autenticação do frontend
const API_BASE_URL = 'http://localhost:4000';

// Simular localStorage para Node.js
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

// Simular o AuthService
class TestAuthService {
  static getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  static async login(email, password) {
    try {
      console.log('🔐 TestAuthService: Iniciando login...');
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro no login');
      }

      console.log('✅ TestAuthService: Login bem-sucedido');
      
      // Salvar token no localStorage (como o AuthService faz)
      if (data.session?.access_token) {
        localStorage.setItem('auth_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        console.log('💾 TestAuthService: Token salvo no localStorage');
      }

      return data;
    } catch (error) {
      console.error('❌ TestAuthService: Erro no login:', error);
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      console.log('🔍 TestAuthService: Verificando token no localStorage');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('❌ TestAuthService: Nenhum token encontrado');
        return null;
      }

      console.log('📡 TestAuthService: Fazendo requisição para /auth/me');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        console.log('❌ TestAuthService: Resposta não OK:', response.status);
        if (response.status === 401) {
          console.log('🗑️ TestAuthService: Token inválido, limpando dados');
          this.clearAuthData();
          return null;
        }
        throw new Error('Erro ao obter dados do usuário');
      }

      console.log('✅ TestAuthService: Resposta OK, processando dados');
      const data = await response.json();
      console.log('📦 TestAuthService: Dados recebidos:', data);
      return data;
    } catch (error) {
      console.error('💥 TestAuthService: Erro ao obter usuário atual:', error);
      return null;
    }
  }

  static mapToFrontendUser(backendData) {
    console.log('🔄 TestAuthService: Mapeando dados do backend para frontend');
    console.log('📥 Dados recebidos:', backendData);
    
    const user = backendData.user || {};
    const member = backendData.member || {};
    
    const mappedUser = {
      id: user.id || member.auth_user_id,
      email: user.email || member.email,
      nome: user.nome || member.name,
      role: user.role || 'member',
      regional: user.regional || member.regional_id,
      ativo: member.ativo !== undefined ? member.ativo : true,
      created_at: member.created_at || user.created_at,
      updated_at: member.updated_at || user.updated_at,
    };
    
    console.log('📤 Dados mapeados:', mappedUser);
    return mappedUser;
  }

  static clearAuthData() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth-storage');
  }
}

// Simular o AuthStore
class TestAuthStore {
  constructor() {
    this.state = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    console.log('🏪 TestAuthStore: Estado atualizado:', this.state);
  }

  async login(email, password) {
    try {
      console.log('🏪 TestAuthStore: Iniciando login...');
      this.setState({ isLoading: true });

      const response = await TestAuthService.login(email, password);
      const user = TestAuthService.mapToFrontendUser(response);

      this.setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('✅ TestAuthStore: Login concluído com sucesso');
      return response;
    } catch (error) {
      console.error('❌ TestAuthStore: Erro no login:', error);
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      throw error;
    }
  }

  async checkAuth() {
    try {
      console.log('🔐 TestAuthStore: Iniciando checkAuth');
      this.setState({ isLoading: true });
      
      console.log('📡 TestAuthStore: Chamando TestAuthService.getCurrentUser');
      const response = await TestAuthService.getCurrentUser();
      
      if (response) {
        console.log('✅ TestAuthStore: Usuário encontrado:', response);
        const user = TestAuthService.mapToFrontendUser(response);
        this.setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        console.log('❌ TestAuthStore: Nenhum usuário encontrado');
        this.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('💥 TestAuthStore: Erro ao verificar autenticação:', error);
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }
}

// Executar teste completo
async function runCompleteTest() {
  console.log('🚀 Iniciando teste completo do fluxo de autenticação...\n');
  
  const authStore = new TestAuthStore();
  
  // Limpar dados anteriores
  TestAuthService.clearAuthData();
  console.log('🧹 Dados de autenticação limpos\n');
  
  // 1. Testar checkAuth sem token (deve retornar não autenticado)
  console.log('1️⃣ Testando checkAuth sem token...');
  await authStore.checkAuth();
  console.log('Estado após checkAuth sem token:', authStore.state);
  console.log('');
  
  // 2. Fazer login
  console.log('2️⃣ Fazendo login...');
  try {
    await authStore.login('superadmin@decolagem.com', 'SuperAdmin2024!');
    console.log('Estado após login:', authStore.state);
  } catch (error) {
    console.error('Erro no login:', error);
    return;
  }
  console.log('');
  
  // 3. Testar checkAuth com token (deve retornar autenticado)
  console.log('3️⃣ Testando checkAuth com token...');
  await authStore.checkAuth();
  console.log('Estado após checkAuth com token:', authStore.state);
  console.log('');
  
  // 4. Verificar localStorage
  console.log('4️⃣ Verificando localStorage...');
  const token = localStorage.getItem('auth_token');
  const refreshToken = localStorage.getItem('refresh_token');
  console.log('Token presente:', !!token);
  console.log('Refresh token presente:', !!refreshToken);
  
  console.log('\n🎉 Teste completo finalizado!');
}

// Executar o teste
runCompleteTest().catch(console.error);