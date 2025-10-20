import { useQuery } from '@tanstack/react-query';
import { InstituicaoService, Instituicao } from '@/services/instituicaoService';

export function useInstituicoes() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['instituicoes'],
    queryFn: async () => {
      return await InstituicaoService.getInstituicoes();
    },
    staleTime: 30 * 60 * 1000, // 30 minutos - dados considerados frescos por mais tempo
    gcTime: 60 * 60 * 1000, // 1 hora de cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: 30 * 60 * 1000, // Polling a cada 30 minutos (reduzido de 15 minutos)
  });

  return {
    data: data || [],
    loading: isLoading,
    error: error?.message || null,
    refetch
  };
}