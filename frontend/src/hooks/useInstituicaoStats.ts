import { useState, useEffect, useCallback } from 'react';
import { InstituicaoService, InstituicaoStats } from '@/services/instituicaoService';

export function useInstituicaoStats() {
  const [data, setData] = useState<InstituicaoStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stats = await InstituicaoService.getStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
      console.error('Error fetching institution stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(() => {
    return fetchStats();
  }, [fetchStats]);

  // Carregar dados iniciais
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Atualização automática a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchStats();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchStats, loading]);

  return {
    data,
    loading,
    error,
    refetch
  };
}