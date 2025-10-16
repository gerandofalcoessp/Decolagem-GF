import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug Fallback Behavior', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve mostrar exatamente o que acontece no postJsonWithFallback', async () => {
    // Importar dinamicamente
    const { AuthService } = await import('../services/authService');
    
    // Simular o valor de API_BASE_URL que está sendo usado
    const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
    console.log('🔍 API_BASE_URL no teste:', API_BASE_URL);
    console.log('🔍 Vai usar fallback?', API_BASE_URL.startsWith('http://localhost:4000'));
    
    // Mock fetch para lançar erro de rede na primeira chamada
    mockFetch.mockImplementationOnce(() => {
      console.log('🔍 Primeira chamada fetch - lançando Network error');
      throw new Error('Network error');
    });
    
    // Se houver fallback, mock a segunda chamada também
    if (API_BASE_URL.startsWith('http://localhost:4000')) {
      mockFetch.mockImplementationOnce(() => {
        console.log('🔍 Segunda chamada fetch (fallback) - lançando Network error');
        throw new Error('Network error fallback');
      });
    }

    try {
      // Acessar o método privado através de reflexão
      const postJsonWithFallback = (AuthService as any).postJsonWithFallback;
      await postJsonWithFallback('/api/auth/login', { email: 'test', password: 'test' });
      
      console.log('❌ ERRO: Não deveria chegar aqui - método deveria ter lançado erro');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('✅ Erro capturado:', error.message);
      console.log('🔍 Tipo do erro:', typeof error);
      console.log('🔍 Stack trace:', error.stack);
      
      // Verificar quantas vezes fetch foi chamado
      console.log('🔍 Fetch foi chamado', mockFetch.mock.calls.length, 'vezes');
      
      // O erro deve ser 'Network error' (original) ou 'Network error fallback'
      const isExpectedError = error.message === 'Network error' || error.message === 'Network error fallback';
      expect(isExpectedError).toBe(true);
    }
  });
});