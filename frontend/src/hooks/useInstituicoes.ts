import { useState, useEffect, useCallback } from 'react';
import { InstituicaoService, Instituicao } from '@/services/instituicaoService';

export function useInstituicoes() {
  const [data, setData] = useState<Instituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstituicoes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const instituicoes = await InstituicaoService.getInstituicoes();
      setData(instituicoes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar instituições');
      console.error('Error fetching instituicoes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchInstituicoes();
  }, [fetchInstituicoes]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchInstituicoes();
  }, [fetchInstituicoes]);

  // Atualização automática a cada 5 minutos (reduzido de 30 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchInstituicoes();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [fetchInstituicoes, loading]);

  return {
    data,
    loading,
    error,
    refetch
  };
}