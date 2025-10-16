import { User, Regional } from '../types';
import { logger } from '../utils/logger';
import { API_BASE_URL } from '../utils/config';

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    nome?: string;
    role?: string;
    funcao?: string;
    regional?: string;
  };
  member: {
    id: string;
    nome: string;
    email: string;
    role: string;
    funcao?: string;
    regional: string;
    ativo: boolean;
    created_at: string;
    updated_at: string;
  } | null;
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface AuthError {
  message: string;
  status?: number;
}

export class AuthService {
  private static getAuthHeaders(): Record<string, string> {
    // Verificar se estamos no ambiente do navegador para evitar problemas de hidratação
    if (typeof window === 'undefined') {
      return {};
    }
    
    const token =
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private static async postJsonWithFallback(endpoint: string, payload: any, headers: Record<string, string> = {}): Promise<Response> {
    const primaryUrl = `${API_BASE_URL}${endpoint}`;
    let lastError: Error;
    
    // Tentar URL primária
    try {
      const response = await fetch(primaryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });
      // Garantir que response não seja undefined (cobre cenário de mocks incorretos)
      if (!response) {
        throw new Error('Network error');
      }
      return response;
    } catch (err) {
      lastError = err as Error;
      
      // Fallback para backend local em 4005 quando API_BASE_URL aponta para 4000
      if (API_BASE_URL.startsWith('http://localhost:4000')) {
        const fallbackUrl = `http://localhost:4005${endpoint}`;
        try {
          const response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(payload),
          });
          if (!response) {
            throw lastError;
          }
          return response;
        } catch (err2) {
          // Re-lançar o erro original se ambos falharam
          throw lastError;
        }
      }
      
      // Re-lançar o erro original se não há fallback
      throw lastError;
    }
  }

  /**
   * Realiza login usando o backend
   */
  static async login(email: string, password: string): Promise<LoginResponse> {
    let response: Response | undefined;
    
    try {
      response = await this.postJsonWithFallback('/api/auth/login', { email, password });
    } catch (error) {
      // Erro de rede ou outro erro antes de obter resposta - propagar o erro original
      throw error;
    }
    
    try {
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      let rawText: string | null = null;

      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (e) {
          // Se a resposta não for JSON válido, tentar ler como texto
          rawText = await response.text().catch(() => '');
        }
      } else {
        // Conteúdo não-JSON (por exemplo, HTML ou vazio)
        rawText = await response.text().catch(() => '');
      }

      if (!response.ok) {
        const msg = (data && data.error) ? data.error : (rawText ? rawText : `Erro no login (HTTP ${response.status})`);
        throw new Error(msg);
      }

      if (!data) {
        // Tentar converter texto em JSON se possível, senão erro claro
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error('Resposta do servidor inválida: conteúdo não JSON');
        }
      }

      // Salvar token no localStorage (apenas no navegador)
      if (typeof window !== 'undefined' && data.session?.access_token) {
        localStorage.setItem('auth_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
      }

      return data;
    } catch (error) {
      // Re-lançar o erro original (incluindo erros de rede)
      throw error;
    }
  }

  /**
   * Realiza logout
   */
  static async logout(): Promise<void> {
    try {
      // Verificar se estamos no navegador
      if (typeof window === 'undefined') {
        return;
      }
      
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      logger.error('Erro no logout:', error);
    } finally {
      // Sempre limpar tokens locais (apenas no navegador)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth-storage');
      }
    }
  }

  /**
   * Obtém dados do usuário autenticado
   */
  static async getCurrentUser(): Promise<LoginResponse | null> {
    try {
      // Verificar se estamos no navegador
      if (typeof window === 'undefined') {
        return null;
      }
      
      logger.debug('🔍 AuthService: Verificando token no localStorage');
      const token = localStorage.getItem('auth_token');
      if (!token) {
        logger.debug('❌ AuthService: Nenhum token encontrado');
        return null;
      }

      logger.debug('📡 AuthService: Fazendo requisição para /auth/me');
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        logger.debug('❌ AuthService: Resposta não OK:', response.status);
        if (response.status === 401) {
          // Token inválido, limpar storage
          logger.debug('🗑️ AuthService: Token inválido, limpando dados');
          this.clearAuthData();
          return null;
        }
        const raw = await response.text().catch(() => '');
        throw new Error(raw || 'Erro ao obter dados do usuário');
      }

      logger.debug('✅ AuthService: Resposta OK, processando dados');
      const contentType = response.headers.get('content-type') || '';
      let data: any = null;
      let rawText: string | null = null;
      if (contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch {
          rawText = await response.text().catch(() => '');
        }
      } else {
        rawText = await response.text().catch(() => '');
      }
      if (!data) {
        try {
          data = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error('Resposta do servidor inválida: conteúdo não JSON');
        }
      }
      logger.debug('📦 AuthService: Dados recebidos:', data);
      return data;
    } catch (error) {
      logger.error('💥 AuthService: Erro ao obter usuário atual:', error);
      this.clearAuthData();
      return null;
    }
  }

  /**
   * Registra novo usuário (apenas admins)
   */
  static async register(userData: {
    email: string;
    password: string;
    nome: string;
    role: string;
    regional: string;
  }): Promise<void> {
    // Verificar se há token de administrador
    const token = this.getToken();
    if (!token) {
      throw new Error('Token de administrador necessário');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar usuário');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao registrar usuário');
    }
  }

  /**
   * Solicita recuperação de senha
   */
  static async resetPassword(email: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao solicitar recuperação de senha');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha');
    }
  }

  /**
   * Atualiza senha do usuário
   */
  static async updatePassword(newPassword: string): Promise<void> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/update-password`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar senha');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar senha');
    }
  }

  /**
   * Atualiza senha de um usuário específico (apenas admin)
   */
  static async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${userId}/update-password`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar senha do usuário');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar senha do usuário');
    }
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtém o token de autenticação
   */
  static getToken(): string | null {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      return null;
    }
    
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token')
    );
  }

  /**
   * Limpa dados de autenticação
   */
  static clearAuthData(): void {
    // Verificar se estamos no navegador
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth-storage');
  }

  /**
   * Converte dados do backend para o formato do frontend
   */
  static mapToFrontendUser(backendData: LoginResponse): User {
    return {
      id: backendData.member?.id || backendData.user.id,
      nome: backendData.member?.nome || backendData.user.nome || '',
      email: backendData.member?.email || backendData.user.email,
      role: (backendData.member?.role || backendData.user.role || 'equipe_interna') as any,
      funcao: backendData.member?.funcao || backendData.user.funcao,
      regional: (backendData.member?.regional || backendData.user.regional || '') as Regional,
      ativo: backendData.member?.ativo ?? true,
      created_at: backendData.member?.created_at || new Date().toISOString(),
      updated_at: backendData.member?.updated_at || new Date().toISOString(),
    };
  }
}