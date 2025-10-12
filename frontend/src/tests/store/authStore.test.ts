import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/authStore';
import { AuthService } from '../../services/authService';

// Mock do AuthService
vi.mock('../../services/authService', () => ({
  AuthService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn(),
    updatePassword: vi.fn(),
    isAuthenticated: vi.fn(),
    getToken: vi.fn(),
    clearAuthData: vi.fn(),
    mapToFrontendUser: vi.fn(),
  },
}));

const mockAuthService = AuthService as any;

describe('AuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Estado inicial', () => {
    it('deve ter estado inicial correto', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const mockUser = {
        id: '123',
        nome: 'Test User',
        email: 'test@example.com',
        role: 'membro' as const,
      };

      const mockResponse = {
        success: true,
        user: mockUser,
        token: 'mock-token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);
      mockAuthService.mapToFrontendUser.mockReturnValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAuthService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockAuthService.mapToFrontendUser).toHaveBeenCalledWith(mockResponse);
    });

    it('deve tratar erro de login', async () => {
      const mockResponse = {
        success: false,
        error: 'Invalid credentials',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
    });

    it('deve definir loading durante o login', async () => {
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise((resolve) => {
        resolveLogin = resolve;
      });

      mockAuthService.login.mockReturnValue(loginPromise);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveLogin!({
          success: true,
          user: { 
          id: '123', 
          nome: 'Test', 
          email: 'test@example.com', 
          role: 'super_admin',
          ativo: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
          token: 'token',
        });
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('deve fazer logout com sucesso', async () => {
      // Configurar estado inicial com usuário logado
      useAuthStore.setState({
        user: { 
          id: '123', 
          nome: 'Test', 
          email: 'test@example.com', 
          role: 'super_admin',
          ativo: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      mockAuthService.logout.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('deve fazer logout mesmo com erro na API', async () => {
      useAuthStore.setState({
        user: { 
          id: '123', 
          nome: 'Test', 
          email: 'test@example.com', 
          role: 'super_admin',
          ativo: true,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z'
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      mockAuthService.logout.mockResolvedValue({ success: false, error: 'Network error' });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('deve verificar autenticação com sucesso', async () => {
      const mockUser = {
        id: '123',
        nome: 'Test User',
        email: 'test@example.com',
        role: 'membro' as const,
      };

      const mockResponse = {
        success: true,
        user: mockUser,
      };

      mockAuthService.getCurrentUser.mockResolvedValue(mockResponse);
      mockAuthService.mapToFrontendUser.mockReturnValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockAuthService.mapToFrontendUser).toHaveBeenCalledWith(mockResponse);
    });

    it('deve tratar usuário não autenticado', async () => {
      mockAuthService.getCurrentUser.mockResolvedValue({
        success: false,
        error: 'Token não encontrado',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuth();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBeNull(); // checkAuth não deve definir erro
    });
  });

  describe('register', () => {
    it('deve registrar usuário com sucesso', async () => {
      const mockUser = {
        id: '123',
        nome: 'New User',
        email: 'newuser@example.com',
        role: 'membro' as const,
      };

      mockAuthService.register.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      const { result } = renderHook(() => useAuthStore());

      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        nome: 'New User',
        role: 'super_admin' as const,
        regional: 'Norte',
      };

      await act(async () => {
        await result.current.register(userData);
      });

      expect(result.current.error).toBeNull();
      expect(mockAuthService.register).toHaveBeenCalledWith(userData);
    });

    it('deve tratar erro de registro', async () => {
      mockAuthService.register.mockResolvedValue({
        success: false,
        error: 'Email já existe',
      });

      const { result } = renderHook(() => useAuthStore());

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        nome: 'Existing User',
        role: 'super_admin' as const,
        regional: 'Norte',
      };

      await act(async () => {
        await result.current.register(userData);
      });

      expect(result.current.error).toBe('Email já existe');
    });
  });

  describe('resetPassword', () => {
    it('deve solicitar reset de senha com sucesso', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        success: true,
        message: 'Email enviado',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });

      expect(result.current.error).toBeNull();
      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('test@example.com');
    });

    it('deve tratar erro de reset de senha', async () => {
      mockAuthService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Email não encontrado',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.resetPassword('notfound@example.com');
      });

      expect(result.current.error).toBe('Email não encontrado');
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      mockAuthService.updatePassword.mockResolvedValue({
        success: true,
        message: 'Senha atualizada',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updatePassword('newpassword123');
      });

      expect(result.current.error).toBeNull();
      expect(mockAuthService.updatePassword).toHaveBeenCalledWith('newpassword123');
    });

    it('deve tratar erro de atualização de senha', async () => {
      mockAuthService.updatePassword.mockResolvedValue({
        success: false,
        error: 'Senha muito fraca',
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updatePassword('123');
      });

      expect(result.current.error).toBe('Senha muito fraca');
    });
  });

  describe('clearError', () => {
    it('deve limpar erro', () => {
      useAuthStore.setState({ error: 'Algum erro' });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});