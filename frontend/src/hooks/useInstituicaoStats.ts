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
      console.log('Fetching institution stats...');
      const stats = await InstituicaoService.getStats();
      console.log('Institution stats received:', stats);
      setData(stats);
    } catch (err) {
      console.error('Error fetching institution stats:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
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

  // Atualização automática a cada 15 minutos (reduzido de 5 minutos para melhor performance)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchStats();
      }
    }, 15 * 60 * 1000); // 15 minutos

    return () => clearInterval(interval);
  }, [fetchStats, loading]);

  return {
    data,
    loading,
    error,
    refetch
  };
}