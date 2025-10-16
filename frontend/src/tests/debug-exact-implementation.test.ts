import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug Exact Implementation', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve replicar exatamente o postJsonWithFallback', async () => {
    // Importar API_BASE_URL
    const { API_BASE_URL } = await import('../utils/config');
    console.log('API_BASE_URL:', API_BASE_URL);

    // Replicar exatamente o método postJsonWithFallback
    const postJsonWithFallback = async (endpoint: string, payload: any, headers: Record<string, string> = {}): Promise<Response> => {
      const primaryUrl = `${API_BASE_URL}${endpoint}`;
      let lastError: Error;
      
      console.log('Tentando URL primária:', primaryUrl);
      
      // Tentar URL primária
      try {
        const response = await fetch(primaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...headers },
          body: JSON.stringify(payload),
        });
        console.log('Resposta da URL primária:', response);
        return response;
      } catch (err) {
        console.log('Erro na URL primária:', err);
        lastError = err as Error;
        
        // Fallback para backend local em 4005 quando API_BASE_URL aponta para 4000
        if (API_BASE_URL.startsWith('http://localhost:4000')) {
          const fallbackUrl = `http://localhost:4005${endpoint}`;
          console.log('Tentando URL de fallback:', fallbackUrl);
          try {
            const response = await fetch(fallbackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify(payload),
            });
            console.log('Resposta da URL de fallback:', response);
            return response;
          } catch (err2) {
            console.log('Erro na URL de fallback:', err2);
            // Re-lançar o erro original se ambos falharam
            throw lastError;
          }
        }
        
        console.log('Sem fallback disponível, lançando erro original');
        // Re-lançar o erro original se não há fallback
        throw lastError;
      }
    };

    // Mock fetch para lançar erro
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await postJsonWithFallback('/api/test', { test: true });
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('Erro final capturado:', error.message);
      expect(error.message).toBe('Network error');
    }
  });
});