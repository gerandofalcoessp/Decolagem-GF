import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug Minimal', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve testar apenas o postJsonWithFallback isoladamente', async () => {
    // Importar dinamicamente para evitar problemas de hoisting
    const { AuthService } = await import('../services/authService');
    
    // Mock fetch para lançar erro de rede
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    try {
      // Acessar o método privado através de reflexão para teste
      const postJsonWithFallback = (AuthService as any).postJsonWithFallback;
      await postJsonWithFallback('/api/auth/login', { email: 'test', password: 'test' });
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('🔍 Erro do postJsonWithFallback:', error.message);
      expect(error.message).toBe('Network error');
    }
  });

  it('deve testar o login completo com mock correto', async () => {
    // Importar dinamicamente
    const { AuthService } = await import('../services/authService');
    
    // Mock fetch para lançar erro de rede
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    try {
      await AuthService.login('test@example.com', 'password');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('🔍 Erro do login:', error.message);
      console.log('🔍 Stack trace:', error.stack);
      
      // Verificar se é o erro esperado ou o bug
      if (error.message.includes('Cannot read properties of undefined')) {
        console.log('❌ BUG ENCONTRADO - response.headers sendo acessado quando response é undefined');
        expect.fail(`Bug encontrado: ${error.message}`);
      } else {
        expect(error.message).toBe('Network error');
      }
    }
  });
});