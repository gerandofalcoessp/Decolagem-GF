import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { InstituicaoService, Instituicao } from '@/services/instituicaoService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export function useInstituicoes() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['instituicoes'],
    queryFn: async () => {
      return await InstituicaoService.getInstituicoes();
    },
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    // Removido refetchInterval para usar apenas realtime
  });

  // Subscription em tempo real para instituições
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('instituicoes_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'instituicoes' }, (_payload) => {
        // Invalidação instantânea e refetch
        queryClient.invalidateQueries({ queryKey: ['instituicoes'] });
        queryClient.refetchQueries({ queryKey: ['instituicoes'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    data: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch
  };
}