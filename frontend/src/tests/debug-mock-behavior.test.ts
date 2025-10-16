import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug Mock Behavior', () => {
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('deve verificar se o mock está funcionando', async () => {
    // Mock fetch para lançar erro
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await fetch('http://test.com');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      expect(error.message).toBe('Network error');
    }
  });

  it('deve verificar se o mock está sendo chamado', async () => {
    // Mock fetch para retornar resposta
    mockFetch.mockResolvedValueOnce({ ok: true });

    await fetch('http://test.com');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('deve verificar comportamento com mockImplementationOnce', async () => {
    // Mock fetch com implementação que lança erro
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    try {
      await fetch('http://test.com');
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      expect(error.message).toBe('Network error');
    }
  });

  it('deve verificar se o mock persiste entre chamadas', async () => {
    // Primeira chamada - erro
    mockFetch.mockRejectedValueOnce(new Error('First error'));
    
    // Segunda chamada - sucesso
    mockFetch.mockResolvedValueOnce({ ok: true });

    // Primeira chamada
    try {
      await fetch('http://test1.com');
      expect.fail('Primeira chamada deveria ter lançado erro');
    } catch (error: any) {
      expect(error.message).toBe('First error');
    }

    // Segunda chamada
    const result = await fetch('http://test2.com');
    expect(result.ok).toBe(true);
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});