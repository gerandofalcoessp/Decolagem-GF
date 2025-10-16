import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../services/authService';

describe('Debug Stack Trace', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve mostrar o stack trace completo do erro', async () => {
    // Mock fetch para lançar erro de rede
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    try {
      await AuthService.login('test@example.com', 'password');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      console.log('🔍 Stack trace completo:');
      console.log(error.stack);
      console.log('🔍 Mensagem do erro:', error.message);
      console.log('🔍 Nome do erro:', error.name);
      
      // Verificar se é o erro esperado
      if (error.message.includes('Cannot read properties of undefined')) {
        console.log('❌ BUG ENCONTRADO - response.headers sendo acessado quando response é undefined');
        console.log('🔍 Linha do erro:', error.stack?.split('\n')[1]);
      }
      
      throw error; // Re-lançar para ver o stack trace no output do teste
    }
  });
});