import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Debug API_BASE_URL', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve mostrar o valor de API_BASE_URL', async () => {
    // Verificar variáveis de ambiente
    console.log('🔍 VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('🔍 NODE_ENV:', import.meta.env.NODE_ENV);
    console.log('🔍 MODE:', import.meta.env.MODE);
    
    // Simular o cálculo de API_BASE_URL
    const calculatedApiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
    console.log('🔍 API_BASE_URL calculado:', calculatedApiBaseUrl);
    
    // Verificar se vai ativar o fallback
    const willUseFallback = calculatedApiBaseUrl.startsWith('http://localhost:4000');
    console.log('🔍 Vai usar fallback?', willUseFallback);
    
    // Verificar se API_BASE_URL está vazio (que pode ser o problema)
    const isEmpty = calculatedApiBaseUrl === '';
    console.log('🔍 API_BASE_URL está vazio?', isEmpty);
    
    expect(true).toBe(true); // Teste sempre passa, só queremos os logs
  });
});