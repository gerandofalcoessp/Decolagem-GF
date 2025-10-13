import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

interface ApiResponse<T> {
  data: T;
  error?: string;
}

interface UseApiOptions {
  immediate?: boolean;
}

export function useApi<T>(endpoint: string, options: UseApiOptions = { immediate: true }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    console.log(`🔄 Fazendo fetch para: ${endpoint}`);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas requisições. Aguarde um momento e tente novamente.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📦 Dados recebidos de ${endpoint}:`, result);
      
      // Verificar se a resposta segue o padrão ApiResponse
      if (result.error) {
        throw new Error(result.error);
      }

      // Se tem propriedade 'data', usar ela; senão, usar a resposta diretamente
      const responseData = result.data !== undefined ? result.data : result;
      console.log(`✅ Dados processados para ${endpoint}:`, responseData);
      setData(responseData as T);
    } catch (err) {
      console.error(`❌ Erro ao fazer fetch para ${endpoint}:`, err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const postData = async (body: any) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Usuário não autenticado');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Muitas requisições. Aguarde um momento e tente novamente.');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (options.immediate && token) {
      fetchData();
    }
  }, [endpoint, options.immediate, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    postData,
  };
}

// Hooks específicos para cada endpoint
export const useActivities = () => {
  const token = localStorage.getItem('auth_token');
  
  const fetchActivities = async () => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/api/atividades`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar atividades');
    }

    const result = await response.json();
    return result.data || result; // Suporta tanto { data: [...] } quanto [...]
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    enabled: !!token,
  });

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};

// Hook para atividades regionais
export const useRegionalActivities = () => {
  const token = localStorage.getItem('auth_token');
  
  const fetchRegionalActivities = async () => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar atividades regionais');
    }

    const result = await response.json();
    return result.data || result;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['regional-activities'],
    queryFn: fetchRegionalActivities,
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
    gcTime: 10 * 60 * 1000, // 10 minutos de cache
    refetchOnWindowFocus: false, // Não recarregar automaticamente ao focar na janela
  });

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch,
  };
};

// Hook para eventos de calendário
export const useCalendarEvents = (isGlobal = false) => {
  const token = localStorage.getItem('auth_token');
  const { user } = useAuthStore();
  
  console.log('🚀 useCalendarEvents: Hook chamado');
  console.log('🔑 useCalendarEvents: Token presente:', !!token);
  console.log('👤 useCalendarEvents: Usuário regional:', user?.regional);
  console.log('🌍 useCalendarEvents: Modo global:', isGlobal);
  
  const fetchCalendarEvents = async () => {
    if (!token) {
      console.log('❌ useCalendarEvents: Token não encontrado');
      throw new Error('Usuário não autenticado');
    }

    const endpoint = isGlobal ? '/api/calendar-events?global=true' : '/api/calendar-events';
    console.log('🔄 useCalendarEvents: Fazendo requisição para', endpoint);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ useCalendarEvents: Erro na resposta:', response.status, response.statusText);
      throw new Error('Erro ao carregar eventos de calendário');
    }

    const result = await response.json();
    console.log('📥 useCalendarEvents: Resposta da API recebida:', result);
    console.log('📊 useCalendarEvents: Número de eventos:', result.data?.length || result?.length || 0);
    
    // Log detalhado dos eventos
    const events = result.data || result;
    if (events && events.length > 0) {
      console.log('🔍 useCalendarEvents: Detalhes dos eventos:');
      events.forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.titulo} - Regional: ${event.regional}`);
      });
    } else {
      console.log('✅ useCalendarEvents: Nenhum evento retornado pela API');
    }
    
    return result.data || result;
  };

  const createCalendarEvent = async (eventData: any) => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/api/calendar-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar evento de calendário');
    }

    const result = await response.json();
    return result.data || result;
  };

  const updateCalendarEvent = async (eventId: string, eventData: any) => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/api/calendar-events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao atualizar evento de calendário');
    }

    const result = await response.json();
    return result.data || result;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', user?.regional || 'no-regional'],
    queryFn: fetchCalendarEvents,
    enabled: !!token,
    staleTime: 0, // Sempre considerar dados como obsoletos
    gcTime: 0, // React Query v4: Não manter cache (era cacheTime)
    refetchOnMount: 'always', // Sempre refetch ao montar
    refetchOnWindowFocus: false, // Não refetch no foco da janela
    refetchOnReconnect: true, // Refetch ao reconectar
  });

  console.log('📊 useCalendarEvents: React Query state:');
  console.log('  - queryKey:', ['calendar-events', user?.regional || 'no-regional']);
  console.log('  - data:', data);
  console.log('  - isLoading:', isLoading);
  console.log('  - error:', error);
  console.log('  - enabled:', !!token);

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
  };
};

export function useGoals() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      // Importar dinamicamente para evitar problemas de dependência circular
      const { GoalService } = await import('@/services/goalService');
      return await GoalService.getGoals();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos por mais tempo
    gcTime: 10 * 60 * 1000, // 10 minutos de cache
    refetchOnWindowFocus: false, // Não recarregar automaticamente ao focar na janela
    refetchOnMount: false, // Não recarregar sempre ao montar se há dados em cache
  });

  return {
    data: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useMembers() {
  return useApi<any[]>('/api/members');
}

export function useUsers() {
  return useApi<{ users: any[] }>('/api/regionals/users');
}

export function useUsersWithMembers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersWithMembers = useCallback(async () => {
    console.log('🔄 Buscando usuários da tabela usuarios...');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Agora buscar apenas do endpoint /auth/users que já retorna dados da tabela usuarios
      const usersResponse = await fetch(`${API_BASE_URL}/api/regionals/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error(`Erro ao buscar usuários: ${usersResponse.status}`);
      }

      const usersData = await usersResponse.json();
      console.log('📥 Dados dos usuários recebidos da tabela usuarios:', usersData);

      // Os dados já vêm completos da tabela usuarios, não precisa combinar
      const userData = usersData.users || usersData;
      
      console.log('✅ Dados dos usuários processados:', userData);
      setData(userData);
    } catch (err) {
      console.error('❌ Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersWithMembers();
  }, [fetchUsersWithMembers]);

  return {
    data,
    loading,
    error,
    refetch: fetchUsersWithMembers,
  };
}

// Hooks específicos para programas
export function useMicrocredito() {
  return useApi<any[]>('/api/microcredito');
}

export function useAsMaras() {
  // Corrige o endpoint para corresponder ao backend (/asmaras)
  return useApi<any[]>('/api/asmaras');
}

export function useDecolagem() {
  return useApi<any[]>('/api/decolagem');
}

export async function fetchUsers(token: string) {
  const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
  const usersResponse = await fetch(`${API_BASE_URL}/api/regionals/users`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!usersResponse.ok) {
    const body = await usersResponse.json().catch(() => ({}));
    const msg = body?.error ? `${usersResponse.status} - ${body.error}` : `${usersResponse.status}`;
    throw new Error(`Erro ao buscar usuários: ${msg}`);
  }
  return usersResponse.json();
}