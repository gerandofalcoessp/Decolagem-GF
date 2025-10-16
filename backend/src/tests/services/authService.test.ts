import { AuthService } from '../../services/authService';
import { supabase, supabaseAdmin } from '../../services/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Mock do supabase
jest.mock('../../services/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
  },
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: jest.fn(),
      },
    },
  },
}));

// Helper para criar mock de User
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

// Helper para criar mock de Session
const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  access_token: 'token123',
  refresh_token: 'refresh123',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: createMockUser(),
  ...overrides,
});

// Helper para criar mock de AuthError
const createMockAuthError = (message: string): AuthError => ({
  message,
  name: 'AuthError',
  status: 400,
} as unknown as AuthError);

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock do supabase.auth.setSession
    if (supabase) {
      supabase.auth.setSession = jest.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      });
    }
  });

  describe('signIn', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockResponse = {
        data: {
          user: createMockUser(),
          session: createMockSession(),
        },
        error: null,
      };

      (supabase!.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AuthService.signIn('test@example.com', 'password123');

      expect(result).toEqual({
        user: mockResponse.data.user,
        session: mockResponse.data.session,
        error: null,
      });
      expect(supabase!.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      const mockResponse = {
        data: { user: null, session: null },
        error: createMockAuthError('Invalid credentials'),
      };

      (supabase!.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockResponse);

      const result = await AuthService.signIn('test@example.com', 'wrongpassword');

      expect(result).toEqual({
        user: null,
        session: null,
        error: mockResponse.error,
      });
    });
  });

  describe('signUp', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        data: { user: mockUser, session: null },
        error: null,
      };

      (supabaseAdmin!.auth.admin.createUser as jest.Mock).mockResolvedValue(mockResponse);

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        metadata: { nome: 'Test User' }
      };

      const result = await AuthService.signUp(userData);

      expect(result.user).toEqual(mockUser);
      expect(result.session).toBeNull();
      expect(result.error).toBeNull();
    });

    it('deve retornar erro quando registro falha', async () => {
      const mockError = createMockAuthError('Registration failed');
      const mockResponse = {
        data: { user: null, session: null },
        error: mockError,
      };

      (supabaseAdmin!.auth.admin.createUser as jest.Mock).mockResolvedValue(mockResponse);

      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        metadata: { nome: 'Test User' }
      };

      const result = await AuthService.signUp(userData);

      expect(result.user).toBeNull();
      expect(result.session).toBeNull();
      expect(result.error).toEqual(mockError);
    });
  });

  describe('signOut', () => {
    it('deve fazer logout com sucesso', async () => {
      const mockToken = 'valid-token';
      (supabase!.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      const result = await AuthService.signOut(mockToken);

      expect(result.error).toBeNull();
      expect(supabase!.auth.signOut).toHaveBeenCalled();
    });

    it('deve retornar erro quando logout falha', async () => {
      const mockToken = 'invalid-token';
      const mockError = createMockAuthError('Logout failed');
      (supabase!.auth.signOut as jest.Mock).mockResolvedValue({ error: mockError });

      const result = await AuthService.signOut(mockToken);

      expect(result.error).toEqual(mockError);
    });
  });

  describe('updatePassword', () => {
    it('deve atualizar senha com sucesso', async () => {
      const mockGetUserResponse = {
        data: { user: createMockUser() },
        error: null,
      };

      const mockUpdateResponse = {
        data: { user: createMockUser() },
        error: null,
      };

      (supabase!.auth.getUser as jest.Mock).mockResolvedValue(mockGetUserResponse);
      (supabase!.auth.updateUser as jest.Mock).mockResolvedValue(mockUpdateResponse);

      const result = await AuthService.updatePassword('token123', 'newpassword123');

      expect(result).toEqual({
        error: null,
      });
      expect(supabase!.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
    });
  });
});