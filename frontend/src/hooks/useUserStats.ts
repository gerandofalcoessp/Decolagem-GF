import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export interface UserStats {
  lideresRegionais: number;
  coordenadores: number;
  consultores: number;
  totalMembros: number;
  totalNacional: number; // Usuários com função "Nacional"
}

export function useUserStats() {
  const [data, setData] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserStats = useCallback(async () => {
    console.log('🔄 Buscando estatísticas dos usuários...');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Buscar apenas dados dos usuários da tabela usuarios
      const usersResponse = await fetch(`${API_BASE_URL}/auth/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!usersResponse.ok) {
        throw new Error(`Erro ao buscar usuários: ${usersResponse.status}`);
      }

      const usersData = await usersResponse.json();
      console.log('📥 Dados dos usuários recebidos:', usersData);

      const users = usersData.users || usersData;

      // Calcular estatísticas baseadas apenas na tabela usuarios
      const stats: UserStats = {
        lideresRegionais: 0,
        coordenadores: 0,
        consultores: 0,
        totalMembros: 0,
        totalNacional: 0
      };

      // Contar por função nos usuários
      if (Array.isArray(users)) {
        users.forEach(user => {
          if (user.funcao) {
            switch (user.funcao.toLowerCase()) {
              case 'líder regional':
              case 'lider regional':
                stats.lideresRegionais++;
                break;
              case 'coordenador':
                stats.coordenadores++;
                break;
              case 'consultor':
                stats.consultores++;
                break;
              case 'nacional':
                stats.totalNacional++;
                break;
            }
          }
        });
        
        // Total de membros é o total de usuários
        stats.totalMembros = users.length;
      }

      console.log('📊 Estatísticas calculadas:', stats);
      setData(stats);
    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUserStats();
    } else {
      setLoading(false);
      setError('Usuário não autenticado');
    }
  }, [fetchUserStats]);

  return {
    data,
    loading,
    error,
    refetch: fetchUserStats,
  };
}