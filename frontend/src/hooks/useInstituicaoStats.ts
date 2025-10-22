import { useState, useEffect, useCallback } from 'react';
import { InstituicaoService, InstituicaoStats } from '@/services/instituicaoService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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

  // Subscription de realtime para tabelas que impactam as estatísticas
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.warn('[useInstituicaoStats] Supabase não configurado, pulando subscription realtime');
      return;
    }

    const channel = supabase
      .channel('instituicao-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'instituicoes' },
        (payload) => {
          console.log('[useInstituicaoStats] mudança em instituicoes detectada:', payload.eventType);
          // Recarregar estatísticas imediatamente
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'regional_activities' },
        (payload) => {
          console.log('[useInstituicaoStats] mudança em regional_activities detectada:', payload.eventType);
          // Recarregar estatísticas imediatamente
          fetchStats();
        }
      )
      .subscribe((status) => {
        console.log('[useInstituicaoStats] channel status:', status);
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn('[useInstituicaoStats] erro ao remover canal realtime:', err);
      }
    };
  }, [fetchStats]);

  return {
    data,
    loading,
    error,
    refetch
  };
}