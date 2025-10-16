import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRouter from '../../routes/auth';
import { AuthService } from '../../services/authService';
import { getUserFromToken } from '../../services/supabaseClient';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Mock do supabaseClient
jest.mock('../../services/supabaseClient', () => ({
  getUserFromToken: jest.fn(),
}));

// Criar uma instância do app para testes
const app = express();
app.use(express.json());
app.use(cors());
app.use('/auth', authRouter);

// Mock do AuthService
jest.mock('../../services/authService', () => ({
  AuthService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    updatePassword: jest.fn(),
    updateUser: jest.fn(),
    getMemberData: jest.fn(),
    listUsers: jest.fn(),
    resetPassword: jest.fn(),
  }
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

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession();
      const mockMemberData = { id: '1', name: 'Test User' };

      (AuthService.signIn as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      });
      (AuthService.getMemberData as jest.Mock).mockResolvedValue({
        id: 1,
        nome: 'Test User',
        email: 'test@example.com',
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('member');
      expect(response.body).toHaveProperty('session');
    });

    it('deve retornar erro com credenciais inválidas', async () => {
      (AuthService.signIn as jest.Mock).mockResolvedValue({
        user: null,
        session: null,
        error: createMockAuthError('Invalid credentials'),
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('deve fazer logout com sucesso', async () => {
      (getUserFromToken as jest.Mock).mockResolvedValue({ id: '123' });
      (AuthService.signOut as jest.Mock).mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer token123');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Logout realizado com sucesso',
      });
    });
  });

  describe('GET /auth/me', () => {
    it('deve retornar dados do usuário autenticado', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      };

      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);
      (AuthService.getMemberData as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('member');
    });

    it('deve retornar erro sem token', async () => {
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/auth/me')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/register', () => {
    it('deve registrar novo usuário com sucesso', async () => {
      const mockUser = createMockUser();
      const mockSession = createMockSession();

      (getUserFromToken as jest.Mock).mockResolvedValue(mockUser);
      (AuthService.getMemberData as jest.Mock).mockResolvedValue({
        id: 1,
        role: 'super_admin',
        nome: 'Admin User',
      });
      (AuthService.signUp as jest.Mock).mockResolvedValue({
        user: mockUser,
        session: mockSession,
        error: null,
      });

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer valid-token')
        .send({
          email: 'test@example.com',
          password: 'password123',
          nome: 'Test User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
    });

    it('deve validar campos obrigatórios', async () => {
      (getUserFromToken as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/register')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('deve enviar email de reset de senha', async () => {
      (AuthService.resetPassword as jest.Mock).mockResolvedValue({ error: null });

      const response = await request(app)
        .post('/auth/reset-password')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Email de recuperação enviado com sucesso',
      });
    });
  });

  describe('PUT /auth/update-password', () => {
    it('deve atualizar senha com sucesso', async () => {
      (getUserFromToken as jest.Mock).mockResolvedValue({ id: '123' });
      (AuthService.updatePassword as jest.Mock).mockResolvedValue({
        error: null,
      });

      const response = await request(app)
        .put('/auth/update-password')
        .set('Authorization', 'Bearer valid-token')
        .send({
          newPassword: 'newPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Senha atualizada com sucesso',
      });
    });
  });
});