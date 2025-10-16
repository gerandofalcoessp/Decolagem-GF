import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/authService';

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

describe('Debug AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('deve lançar erro de rede corretamente', async () => {
    console.log('🔍 Iniciando teste de erro de rede...');
    
    // Simular erro de rede
    mockFetch.mockImplementationOnce(() => {
      console.log('🚨 Mock fetch sendo executado - lançando erro');
      throw new Error('Network error');
    });

    console.log('📞 Chamando AuthService.login...');
    
    try {
      await AuthService.login('test@example.com', 'password123');
      console.log('❌ Não deveria chegar aqui - erro esperado');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('✅ Erro capturado:', error.message);
      console.log('🔍 Tipo do erro:', typeof error);
      console.log('🔍 Stack trace:', error.stack);
      expect(error.message).toContain('Network error');
    }
  });
});