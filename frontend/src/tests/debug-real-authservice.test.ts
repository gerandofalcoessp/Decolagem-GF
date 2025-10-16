import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simulação exata do código do AuthService
describe('Debug Real AuthService Behavior', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve reproduzir exatamente o comportamento do AuthService.login', async () => {
    console.log('🔍 Teste real AuthService iniciado');
    
    // Configurar mock para falhar
    mockFetch.mockImplementationOnce(() => {
      console.log('🚨 Mock fetch executado - lançando erro');
      throw new Error('Network error');
    });

    // Simular exatamente o método postJsonWithFallback
    const postJsonWithFallback = async (endpoint: string, payload: any): Promise<Response> => {
      console.log('📞 postJsonWithFallback chamado');
      const primaryUrl = `http://localhost:4000${endpoint}`;
      
      try {
        console.log('🔄 Tentando fetch primário...');
        const response = await fetch(primaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.log('✅ Fetch primário retornou:', response);
        return response;
      } catch (err) {
        console.log('❌ Erro no fetch primário:', err);
        // Fallback para backend local em 4005 quando API_BASE_URL aponta para 4000
        if (primaryUrl.startsWith('http://localhost:4000')) {
          const fallbackUrl = `http://localhost:4005${endpoint}`;
          try {
            console.log('🔄 Tentando fetch fallback...');
            const response = await fetch(fallbackUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            console.log('✅ Fetch fallback retornou:', response);
            return response;
          } catch (err2) {
            console.log('❌ Erro no fetch fallback:', err2);
            // Re-lançar o erro original
            throw err;
          }
        }
        // Re-lançar o erro original
        throw err;
      }
    };

    // Simular exatamente o método login
    const simulateLogin = async (email: string, password: string) => {
      console.log('📞 Simulando login...');
      
      let response: Response;
      
      try {
        console.log('🔄 Chamando postJsonWithFallback...');
        response = await postJsonWithFallback('/api/auth/login', { email, password });
        console.log('✅ postJsonWithFallback retornou response:', response);
      } catch (error) {
        console.log('❌ Erro no postJsonWithFallback:', error);
        // Erro de rede ou outro erro antes de obter resposta
        throw error;
      }
      
      try {
        console.log('🔍 Tentando acessar response.headers...');
        const contentType = response.headers.get('content-type') || '';
        console.log('📋 Content-Type:', contentType);
        
        // Resto da lógica...
        return { success: true };
      } catch (error) {
        console.log('💥 Erro ao acessar response.headers:', error);
        throw error;
      }
    };

    // Executar e capturar erro
    try {
      await simulateLogin('test@example.com', 'password123');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('🎯 Erro final capturado:', error.message);
      console.log('🔍 Stack trace:', error.stack);
      
      // Verificar qual erro foi lançado
      if (error.message.includes('Network error')) {
        console.log('✅ Erro de rede correto');
        expect(error.message).toContain('Network error');
      } else if (error.message.includes('Cannot read properties of undefined')) {
        console.log('❌ Erro de response.headers undefined - BUG ENCONTRADO!');
        expect.fail(`Bug encontrado: ${error.message}`);
      } else {
        console.log('❓ Erro inesperado:', error.message);
        expect.fail(`Erro inesperado: ${error.message}`);
      }
    }
  });
});