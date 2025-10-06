import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export interface RegionalLeader {
  nome: string;
  email: string;
  funcao: string;
}

export interface RegionalData {
  regional: string;
  totalMembros: number;
  liderRegional?: RegionalLeader;
  coordenadores: RegionalLeader[];
  consultores: RegionalLeader[];
  liderNacional?: RegionalLeader;
}

export interface UseRegionalDataReturn {
  data: RegionalData[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useRegionalData(): UseRegionalDataReturn {
  const [data, setData] = useState<RegionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegionalData = useCallback(async () => {
    console.log('🔄 Buscando dados regionais...');
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      // Usar novo endpoint sem restrição de super_admin
      const response = await fetch(`${API_BASE_URL}/api/regionals/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const users = data.users || [];

      if (!Array.isArray(users)) {
        console.error('❌ Dados de usuários inválidos:', data);
        throw new Error('Dados de usuários inválidos');
      }

      // Agrupar usuários por região
      const regionaisMap = new Map<string, RegionalData>();

      // Encontrar líder nacional (independente da região)// Identificar líder nacional
      const liderNacional = users.find(user => 
        user.funcao?.toLowerCase() === 'nacional'
      );

      // Criar card Comercial automaticamente
      regionaisMap.set('Comercial', {
        regional: 'Comercial',
        totalMembros: 0,
        coordenadores: [],
        consultores: [],
        liderNacional: liderNacional ? {
          nome: liderNacional.nome || liderNacional.email,
          email: liderNacional.email,
          funcao: liderNacional.funcao || 'Nacional',
        } : undefined,
      });

      // Processar cada usuário
      users.forEach((user, index) => {
        console.log(`👤 Usuário ${index + 1}:`, {
          nome: user.nome,
          email: user.email,
          regional: user.regional,
          funcao: user.funcao,
          role: user.role,
          tipo: user.tipo
        });
        
        // Incluir usuários mesmo sem regional definida (para capturar possíveis casos especiais)
        let regional = user.regional || 'Sem Regional';
        
        // Normalizar nomes de regionais que começam com "R. "
        if (regional.startsWith('R. ')) {
          regional = regional.substring(3); // Remove "R. " do início
        }
        
        // Para usuários nacionais, líder nacional e diretor operações, colocá-los no card Nacional
        if (user.funcao?.toLowerCase() === 'nacional' || 
            user.funcao?.toLowerCase() === 'líder nacional' ||
            user.funcao?.toLowerCase() === 'diretor operações') {
          if (!regionaisMap.has('Nacional')) {
            regionaisMap.set('Nacional', {
              regional: 'Nacional',
              totalMembros: 0,
              coordenadores: [],
              consultores: [],
            });
          }
          const nacionalData = regionaisMap.get('Nacional')!;
          nacionalData.totalMembros++;
          
          // Adicionar usuário nacional como coordenador para aparecer na lista
          nacionalData.coordenadores.push({
            nome: user.nome || user.email,
            email: user.email,
            funcao: user.funcao,
          });
          return; // Pular o processamento normal
        }
        
        // Pular apenas se não houver informação útil
        if (!regional && !user.funcao) return;
        
        // Criar entrada para a região se não existir
        if (!regionaisMap.has(regional)) {
          regionaisMap.set(regional, {
            regional,
            totalMembros: 0,
            coordenadores: [],
            consultores: [],
          });
        }

        const regionalData = regionaisMap.get(regional)!;
        
        // Contar membro
        regionalData.totalMembros++;

        // Classificar por função
        if (user.funcao) {
          const funcaoLower = user.funcao.toLowerCase();
          const leader: RegionalLeader = {
            nome: user.nome || user.email,
            email: user.email,
            funcao: user.funcao,
          };



          switch (funcaoLower) {
            case 'líder regional':
            case 'lider regional':
              regionalData.liderRegional = leader;
              console.log('👑 Líder Regional atribuído:', leader.nome, 'para', regional);
              break;
            case 'coordenador':
              regionalData.coordenadores.push(leader);
              break;
            case 'consultor':
              regionalData.consultores.push(leader);
              break;
            case 'nacional':
            case 'líder nacional':
            case 'diretor operações':
              // Usuários nacionais já foram processados acima
              break;
          }
        }

        // Adicionar líder nacional apenas ao card Nacional, não aos regionais
        if (liderNacional && regional === 'Nacional') {
          regionalData.liderNacional = {
            nome: liderNacional.nome || liderNacional.email,
            email: liderNacional.email,
            funcao: liderNacional.funcao || 'Nacional',
          };
        }
      });

      // Converter Map para Array
      const regionaisArray = Array.from(regionaisMap.values());

      console.log('📊 Dados regionais processados:', regionaisArray);
      setData(regionaisArray);
    } catch (err) {
      console.error('❌ Erro ao buscar dados regionais:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchRegionalData();
    } else {
      setLoading(false);
      setError('Usuário não autenticado');
    }
  }, [fetchRegionalData]);

  return {
    data,
    loading,
    error,
    refetch: fetchRegionalData,
  };
}