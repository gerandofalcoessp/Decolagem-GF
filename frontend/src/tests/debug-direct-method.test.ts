import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug Direct Method', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve verificar se o método postJsonWithFallback existe', async () => {
    const { AuthService } = await import('../services/authService');
    
    // Verificar se o método existe
    const hasMethod = typeof (AuthService as any).postJsonWithFallback === 'function';
    expect(hasMethod).toBe(true);
  });

  it('deve testar se o método é realmente chamado', async () => {
    const { AuthService } = await import('../services/authService');
    
    // Mock fetch para retornar uma resposta válida
    const mockResponse = {
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
      headers: new Headers(),
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    try {
      const postJsonWithFallback = (AuthService as any).postJsonWithFallback;
      const result = await postJsonWithFallback('/api/test', { test: true });
      
      // Verificar se fetch foi chamado
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockResponse);
    } catch (error) {
      throw new Error(`Erro inesperado: ${error}`);
    }
  });

  it('deve testar comportamento com erro de fetch', async () => {
    const { AuthService } = await import('../services/authService');
    
    // Mock fetch para lançar erro
    const networkError = new Error('Network error');
    mockFetch.mockRejectedValueOnce(networkError);

    try {
      const postJsonWithFallback = (AuthService as any).postJsonWithFallback;
      console.log('Chamando postJsonWithFallback com erro...');
      const result = await postJsonWithFallback('/api/test', { test: true });
      console.log('Resultado inesperado:', result);
      
      // Se chegou aqui, não lançou erro como esperado
      throw new Error('Método não lançou erro como esperado');
    } catch (error: any) {
      console.log('Erro capturado:', error.message);
      console.log('Tipo do erro:', typeof error);
      console.log('Stack trace:', error.stack);
      
      // Verificar se o erro é o esperado
      if (error.message === 'Método não lançou erro como esperado') {
        throw error;
      }
      
      // Verificar se é o erro de rede original
      expect(error.message).toBe('Network error');
    }
  });
});