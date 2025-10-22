import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  const queryClient = useQueryClient();
  
  const fetchActivities = async () => {
    console.log('[useActivities] 🔄 Iniciando fetch de atividades...');
    
    if (!token) {
      console.log('[useActivities] ❌ Token não encontrado');
      throw new Error('Usuário não autenticado');
    }

    console.log('[useActivities] 📡 Fazendo requisição para:', `${API_BASE_URL}/api/regional-activities`);
    
    const response = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('[useActivities] ❌ Erro na resposta:', response.status, response.statusText);
      throw new Error('Erro ao carregar atividades');
    }

    const result = await response.json();
    const data = result.data || result;
    
    console.log('[useActivities] ✅ Dados recebidos:', {
      total: Array.isArray(data) ? data.length : 'não é array',
      timestamp: new Date().toISOString(),
      sample: Array.isArray(data) && data.length > 0 ? data[0] : null
    });
    
    // Log específico para atividades de "Famílias Embarcadas Decolagem"
    if (Array.isArray(data)) {
      const familiasActivities = data.filter(activity => {
        const fields = [
          activity.atividade_label,
          activity.titulo,
          activity.tipo,
          activity.categoria
        ].filter(Boolean);
        
        return fields.some(field => 
          field && field.toLowerCase().includes('famílias embarcadas decolagem')
        );
      });
      
      console.log('[useActivities] 👨‍👩‍👧‍👦 Atividades "Famílias Embarcadas Decolagem" encontradas:', {
        count: familiasActivities.length,
        activities: familiasActivities.map(a => ({
          id: a.id,
          label: a.atividade_label,
          quantidade: a.quantidade,
          regional: a.regional
        }))
      });
    }
    
    return data;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['activities'],
    queryFn: fetchActivities,
    enabled: !!token,
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: isSupabaseConfigured() ? false : 15000, // Polling mais frequente quando Supabase não está configurado
  });

  // Assinatura em tempo real via Supabase para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[useActivities] ⚠️ Supabase não configurado, usando polling');
      return;
    }

    console.log('[useActivities] 🔗 Configurando subscription em tempo real...');

    const channel = supabase
      .channel('activities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'regional_activities' }, (payload) => {
        console.log('[useActivities] 🔔 Mudança detectada na tabela regional_activities:', {
          eventType: payload.eventType,
          timestamp: new Date().toISOString(),
          record: payload.new || payload.old
        });
        
        // Invalidação instantânea e refetch para atualizações em tempo real
        queryClient.invalidateQueries({ queryKey: ['activities'] });
        queryClient.refetchQueries({ queryKey: ['activities'] });
      })
      .subscribe((status) => {
        console.log('[useActivities] 📡 Status da subscription:', status);
      });

    return () => {
      console.log('[useActivities] 🔌 Removendo subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Log quando os dados mudam
  useEffect(() => {
    if (data) {
      console.log('[useActivities] 📊 Dados atualizados:', {
        total: Array.isArray(data) ? data.length : 'não é array',
        timestamp: new Date().toISOString()
      });
    }
  }, [data]);

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
    console.log('[useRegionalActivities] 🔄 Iniciando fetch de atividades regionais...');
    
    if (!token) {
      console.log('[useRegionalActivities] ❌ Token não encontrado');
      throw new Error('Usuário não autenticado');
    }

    console.log('[useRegionalActivities] 📡 Fazendo requisição para:', `${API_BASE_URL}/api/regional-activities`);

    const response = await fetch(`${API_BASE_URL}/api/regional-activities`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('[useRegionalActivities] ❌ Erro na resposta:', response.status, response.statusText);
      throw new Error('Erro ao carregar atividades regionais');
    }

    const result = await response.json();
    const data = result.data || result;
    
    console.log('[useRegionalActivities] ✅ Dados recebidos:', {
      total: Array.isArray(data) ? data.length : 'não é array',
      timestamp: new Date().toISOString(),
      sample: Array.isArray(data) && data.length > 0 ? data[0] : null
    });
    
    return data;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['regional-activities'],
    queryFn: fetchRegionalActivities,
    enabled: !!token,
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: isSupabaseConfigured() ? false : 15000, // Polling mais frequente quando Supabase não está configurado
  });

  // Assinatura em tempo real via Supabase para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[useRegionalActivities] ⚠️ Supabase não configurado, usando polling');
      return;
    }

    console.log('[useRegionalActivities] 🔗 Configurando subscription em tempo real...');

    const channel = supabase
      .channel('regional_activities_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'regional_activities' }, (payload) => {
        console.log('[useRegionalActivities] 🔔 Mudança detectada na tabela regional_activities:', {
          eventType: payload.eventType,
          timestamp: new Date().toISOString(),
          record: payload.new || payload.old
        });
        
        // Invalidação instantânea e refetch para atualizações em tempo real
        queryClient.invalidateQueries({ queryKey: ['regional-activities'] });
        queryClient.refetchQueries({ queryKey: ['regional-activities'] });
      })
      .subscribe((status) => {
        console.log('[useRegionalActivities] 📡 Status da subscription:', status);
      });

    return () => {
      console.log('[useRegionalActivities] 🔌 Removendo subscription...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Log quando os dados mudam
  useEffect(() => {
    if (data) {
      console.log('[useRegionalActivities] 📊 Dados atualizados:', {
        total: Array.isArray(data) ? data.length : 'não é array',
        timestamp: new Date().toISOString()
      });
    }
  }, [data]);

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
  const queryClient = useQueryClient();
  
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

  const deleteCalendarEvent = async (eventId: string) => {
    if (!token) {
      throw new Error('Usuário não autenticado');
    }

    const response = await fetch(`${API_BASE_URL}/api/calendar-events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao excluir evento de calendário');
    }

    return true;
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', user?.regional || 'no-regional'],
    queryFn: fetchCalendarEvents,
    enabled: !!token,
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnMount: false, // Usar cache se disponível
    refetchOnWindowFocus: false, // Não refetch no foco da janela
    refetchOnReconnect: true, // Refetch ao reconectar
    refetchInterval: isSupabaseConfigured() ? false : 2000, // Polling a cada 2 segundos quando Supabase não está configurado
  });

  // Mutations para CREATE, UPDATE e DELETE com invalidação automática do cache
  const createMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      // Invalidar e refetch automático após criar
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      console.log('✅ [useCalendarEvents] Evento criado com sucesso, cache invalidado');
    },
    onError: (error) => {
      console.error('❌ [useCalendarEvents] Erro ao criar evento:', error);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ eventId, eventData }: { eventId: string; eventData: any }) => 
      updateCalendarEvent(eventId, eventData),
    onSuccess: () => {
      // Invalidar e refetch automático após atualizar
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      console.log('✅ [useCalendarEvents] Evento atualizado com sucesso, cache invalidado');
    },
    onError: (error) => {
      console.error('❌ [useCalendarEvents] Erro ao atualizar evento:', error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      // Invalidar e refetch automático após excluir
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      console.log('✅ [useCalendarEvents] Evento excluído com sucesso, cache invalidado');
    },
    onError: (error) => {
      console.error('❌ [useCalendarEvents] Erro ao excluir evento:', error);
    }
  });

  // Subscription em tempo real para calendar-events
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('[useCalendarEvents] ⚠️ Supabase não configurado, usando polling');
      return;
    }

    console.log('[useCalendarEvents] 🔗 Configurando subscription em tempo real...');

    const channel = supabase
      .channel('calendar_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, (payload) => {
        console.log('[useCalendarEvents] 🔔 Mudança detectada na tabela calendar_events:', {
          eventType: payload.eventType,
          timestamp: new Date().toISOString(),
          record: payload.new || payload.old
        });
        
        // Invalidação instantânea e refetch para atualizações em tempo real
        queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
        queryClient.refetchQueries({ queryKey: ['calendar-events'] });
      })
      .subscribe((status) => {
        console.log('[useCalendarEvents] 📡 Status da subscription calendar_events_changes:', status);
      });

    return () => {
      console.log('[useCalendarEvents] 🔌 Removendo subscription calendar_events_changes...');
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    data,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    // Mutations com loading states e error handling automático
    createEvent: createMutation.mutateAsync,
    updateEvent: (eventId: string, eventData: any) => updateMutation.mutateAsync({ eventId, eventData }),
    deleteEvent: deleteMutation.mutateAsync,
    // Estados das mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error?.message || null,
    updateError: updateMutation.error?.message || null,
    deleteError: deleteMutation.error?.message || null,
  };
};

export function useGoals() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      // Importar dinamicamente para evitar problemas de dependência circular
      const { GoalService } = await import('@/services/goalService');
      return await GoalService.getGoals();
    },
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
  });

  // Subscription em tempo real para goals
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('goals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, (_payload) => {
        // Invalidação instantânea e refetch
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.refetchQueries({ queryKey: ['goals'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

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

// Hooks específicos para programas com atualizações instantâneas
export function useMicrocredito() {
  const token = localStorage.getItem('auth_token');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['microcredito'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${API_BASE_URL}/api/microcredito`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do microcrédito');
      }

      const result = await response.json();
      return result.data || result;
    },
    enabled: !!token,
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: isSupabaseConfigured() ? false : 15000, // Polling mais frequente quando Supabase não está configurado
  });

  // Assinatura em tempo real via Supabase para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('microcredito_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emprestimos_microcredito' }, (_payload) => {
        // Invalidação instantânea e refetch para atualizações em tempo real
        queryClient.invalidateQueries({ queryKey: ['microcredito'] });
        queryClient.refetchQueries({ queryKey: ['microcredito'] });
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
}

export function useAsMaras() {
  const token = localStorage.getItem('auth_token');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['asmaras'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${API_BASE_URL}/api/asmaras`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do As Maras');
      }

      const result = await response.json();
      return result.data || result;
    },
    enabled: !!token,
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: isSupabaseConfigured() ? false : 15000, // Polling mais frequente quando Supabase não está configurado
  });

  // Assinatura em tempo real via Supabase para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('asmaras_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participantes_asmaras' }, (_payload) => {
        // Invalidação instantânea e refetch para atualizações em tempo real
        queryClient.invalidateQueries({ queryKey: ['asmaras'] });
        queryClient.refetchQueries({ queryKey: ['asmaras'] });
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
}

export function useDecolagem() {
  const token = localStorage.getItem('auth_token');
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['decolagem'],
    queryFn: async () => {
      if (!token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${API_BASE_URL}/api/decolagem`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do Decolagem');
      }

      const result = await response.json();
      return result.data || result;
    },
    enabled: !!token,
    staleTime: 0, // Dados sempre considerados stale para atualizações instantâneas
    gcTime: 5 * 60 * 1000, // 5 minutos de cache (reduzido)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    refetchInterval: isSupabaseConfigured() ? false : 15000, // Polling mais frequente quando Supabase não está configurado
  });

  // Assinatura em tempo real via Supabase para invalidar cache quando houver mudanças
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const channel = supabase
      .channel('decolagem_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'familias_decolagem' }, (_payload) => {
        // Invalidação instantânea e refetch para atualizações em tempo real
        queryClient.invalidateQueries({ queryKey: ['decolagem'] });
        queryClient.refetchQueries({ queryKey: ['decolagem'] });
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