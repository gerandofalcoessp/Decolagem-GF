import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Debug Fetch Mock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve lançar erro quando fetch falha', async () => {
    // Simular erro de rede
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

  it('deve testar postJsonWithFallback diretamente', async () => {
    // Simular erro de rede
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Network error');
    });

    // Simular o método postJsonWithFallback
    const postJsonWithFallback = async (endpoint: string, payload: any) => {
      const primaryUrl = `http://localhost:4000${endpoint}`;
      try {
        const response = await fetch(primaryUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return response;
      } catch (err) {
        throw err;
      }
    };

    try {
      await postJsonWithFallback('/api/auth/login', { email: 'test', password: 'test' });
      expect.fail('Deveria ter lançado erro');
    } catch (error: any) {
      expect(error.message).toBe('Network error');
    }
  });
});