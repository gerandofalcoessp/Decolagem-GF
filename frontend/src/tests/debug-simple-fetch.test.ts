import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug Simple Fetch', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve testar fetch mock diretamente', async () => {
    // Mock fetch para lançar erro
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    try {
      await fetch('http://test.com', { method: 'POST' });
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      expect(error.message).toBe('Network error');
    }
  });

  it('deve testar postJsonWithFallback com API_BASE_URL vazio', async () => {
    // Importar dinamicamente
    const { AuthService } = await import('../services/authService');
    
    // Mock fetch para lançar erro
    mockFetch.mockImplementationOnce(() => {
      console.log('Mock fetch foi chamado!');
      throw new Error('Network error');
    });

    try {
      // Acessar o método privado
      const postJsonWithFallback = (AuthService as any).postJsonWithFallback;
      console.log('Chamando postJsonWithFallback...');
      const result = await postJsonWithFallback('/api/auth/login', { email: 'test', password: 'test' });
      console.log('Resultado:', result);
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('Erro capturado:', error.message);
      // Se API_BASE_URL está vazio, não há fallback, então deve lançar o erro original
      expect(error.message).toBe('Network error');
    }
  });
});