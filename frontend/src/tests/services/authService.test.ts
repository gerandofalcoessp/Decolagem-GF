import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '../../services/authService';

// Mock do fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock do localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '123',
          nome: 'Test User',
          email: 'test@example.com',
          role: 'super_admin',
          ativo: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        token: 'mock-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AuthService.login('test@example.com', 'password123');

      expect(result).not.toBeNull();
      expect(result?.member).toEqual(mockResponse.user);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_user', JSON.stringify(mockResponse.user));
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => mockResponse,
      });

      await expect(AuthService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid credentials');
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('deve tratar erro de rede', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(AuthService.login('test@example.com', 'password123')).rejects.toThrow('Erro de conexão');
    });
  });

  describe('logout', () => {
    it('deve fazer logout com sucesso', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const result = await AuthService.logout();

      expect(result).toBeUndefined();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    it('deve limpar dados locais mesmo com erro na API', async () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await AuthService.logout();

      expect(result).toBeUndefined();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('getCurrentUser', () => {
    it('deve retornar usuário autenticado', async () => {
      const mockUser = {
        id: '123',
        nome: 'Test User',
        email: 'test@example.com',
        role: 'super_admin',
        ativo: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      mockLocalStorage.getItem.mockImplementation((key) => {
        if (key === 'auth_token') return 'mock-token';
        if (key === 'auth_user') return JSON.stringify(mockUser);
        return null;
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          member: mockUser,
        }),
      });

      const result = await AuthService.getCurrentUser();

      expect(result).not.toBeNull();
      expect(result?.member).toEqual(mockUser);
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      });
    });

    it('deve retornar erro quando não há token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('deve limpar dados quando token é inválido', async () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-token');

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Token inválido' }),
      });

      const result = await AuthService.getCurrentUser();

      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('isAuthenticated', () => {
    it('deve retornar true quando há token válido', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');

      const result = AuthService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('deve retornar false quando não há token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('getToken', () => {
    it('deve retornar token do localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');

      const result = AuthService.getToken();

      expect(result).toBe('mock-token');
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    it('deve retornar null quando não há token', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = AuthService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('clearAuthData', () => {
    it('deve limpar todos os dados de autenticação', () => {
      AuthService.clearAuthData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });
  });

  describe('register', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      const mockResponse = {
        success: true,
        user: {
          id: '123',
          nome: 'New User',
          email: 'newuser@example.com',
          role: 'super_admin',
          ativo: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
      };

      mockLocalStorage.getItem.mockReturnValue('admin-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        nome: 'New User',
        role: 'super_admin' as const,
        regional: 'Norte',
        ativo: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      await expect(AuthService.register(userData)).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin-token',
        },
        body: JSON.stringify(userData),
      });
    });

    it('deve retornar erro quando não há token de admin', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        nome: 'New User',
        role: 'super_admin' as const,
        regional: 'Norte',
      };

      await expect(AuthService.register(userData)).rejects.toThrow('Token de administrador necessário');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('deve solicitar recuperação de senha com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Email de reset enviado' }),
      });

      await expect(AuthService.resetPassword('test@example.com')).resolves.toBeUndefined();
      
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
        }),
      });
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      const mockResponse = {
        success: true,
        message: 'Senha atualizada com sucesso',
      };

      mockLocalStorage.getItem.mockReturnValue('mock-token');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await AuthService.updatePassword('newpassword123');

      expect(result).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:4000/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          newPassword: 'newpassword123',
        }),
      });
    });

    it('deve retornar erro quando não há token', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(AuthService.updatePassword('newpassword123')).rejects.toThrow('Token não encontrado');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});