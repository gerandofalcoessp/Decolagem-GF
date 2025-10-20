import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

import { API_BASE_URL } from '@/utils/config';

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

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get('content-type') || '';
      let result: any = null;
      let rawText: string | null = null;

      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (e) {
          rawText = await response.text().catch(() => '');
        }
      } else {
        rawText = await response.text().catch(() => '');
      }

      if (!response.ok) {
        const msg = (result && result.error) ? result.error : (rawText ? rawText : `Erro ${response.status}: ${response.statusText}`);
        throw new Error(msg);
      }

      if (!result) {
        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error('Resposta do servidor inválida: conteúdo não JSON');
        }
      }

      console.log(`📦 Dados recebidos de ${endpoint}:`, result);
      
      // Verificar se a resposta segue o padrão ApiResponse
      if (result.error) {
        throw new Error(result.error);
      }

      // Se tem propriedade 'data', usar ela; senão, usar a resposta diretamente
      const responseData = result.data !== undefined ? result.data : result;
      setData(responseData as T);
    } catch (err) {
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

      const contentType = response.headers.get('content-type') || '';
      let result: any = null;
      let rawText: string | null = null;

      if (contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (e) {
          rawText = await response.text().catch(() => '');
        }
      } else {
        rawText = await response.text().catch(() => '');
      }

      if (!response.ok) {
        const msg = (result && result.error) ? result.error : (rawText ? rawText : `Erro ${response.status}: ${response.statusText}`);
        throw new Error(msg);
      }

      if (!result) {
        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch {
          throw new Error('Resposta do servidor inválida: conteúdo não JSON');
        }
      }

      // Suporta tanto { data: ... } quanto resposta direta
      if (result.error) {
        throw new Error(result.error);
      }

      const dataOut = result.data !== undefined ? result.data : result;
      return dataOut as T;
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

    const response = await fetch(`${API_BASE_URL}/api/regional-activities`, {
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
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
  const queryClient = useQueryClient();
  
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: isSupabaseConfigured() ? false : 30000, // Reduzido de 10s para 30s quando Supabase não está configurado
  });

  // Assinatura em tempo real via Supabase para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('regional_activities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'regional_activities' }, (_payload) => {
        // Invalida e faz refetch das atividades regionais
        queryClient.invalidateQueries({ queryKey: ['regional-activities'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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
  
  const fetchCalendarEvents = async () => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const endpoint = isGlobal ? '/api/calendar-events?global=true' : '/api/calendar-events';
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao carregar eventos de calendário');
    }

    const result = await response.json();
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
    staleTime: 5 * 60 * 1000, // 5 minutos - dados considerados frescos
    gcTime: 15 * 60 * 1000, // 15 minutos de cache em memória
    refetchOnMount: false, // Usar cache se disponível
    refetchOnWindowFocus: false, // Não refetch no foco da janela
    refetchOnReconnect: true, // Refetch ao reconectar
  });

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
    staleTime: 10 * 60 * 1000, // 10 minutos - dados considerados frescos por mais tempo
    gcTime: 30 * 60 * 1000, // 30 minutos de cache
    refetchOnWindowFocus: false, // Não recarregar automaticamente ao focar na janela
    refetchOnMount: false, // Não recarregar sempre ao montar se há dados em cache
    refetchOnReconnect: true, // Refetch ao reconectar
  });

  return {
    data: data || [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

export function useMembers() {
  // DEPRECATED: Use useUsers() instead - this endpoint returns data from 'usuarios' table
  return useApi<any[]>('/api/regionals/users');
}

export function useUsers() {
  return useApi<{ users: any[] }>('/api/regionals/users');
}

export function useUsersWithMembers() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsersWithMembers = useCallback(async () => {
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

      // Os dados já vêm completos da tabela usuarios, não precisa combinar
      const userData = usersData.users || usersData;
      
      setData(userData);
    } catch (err) {
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