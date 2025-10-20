import { API_BASE_URL } from '@/utils/config';

export interface Instituicao {
  id?: string;
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  regional: 'nacional' | 'centro_oeste' | 'mg_es' | 'nordeste_1' | 'nordeste_2' | 'norte' | 'rj' | 'sp' | 'sul' | 'comercial';
  programa: 'microcredito' | 'as_maras' | 'decolagem';
  observacoes?: string;
  nome_lider: string;
  status: 'ativa' | 'inativa' | 'evadida';
  evasao_motivo?: string;
  evasao_data?: string;
  evasao_registrado_em?: string;
  documentos?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateInstituicaoData {
  nome: string;
  cnpj: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  regional: 'nacional' | 'centro_oeste' | 'mg_es' | 'nordeste_1' | 'nordeste_2' | 'norte' | 'rj' | 'sp' | 'sul' | 'comercial';
  programa: 'microcredito' | 'as_maras' | 'decolagem';
  observacoes?: string;
  nome_lider: string;
  status?: 'ativa' | 'inativa' | 'evadida';
  documentos?: string[];
}

export interface UpdateInstituicaoData extends Partial<CreateInstituicaoData> {}

export interface EvasaoData {
  motivo: string;
  data: string;
  registrado_em?: string;
}

export interface InstituicaoStats {
  total: number;
  porPrograma: {
    as_maras: number;
    decolagem: number;
    microcredito: number;
  };
  porRegional: Record<string, number>;
  resumo: {
    ongsMaras: number;
    ongsDecolagem: number;
    ongsMicrocredito: number;
    totalPorArea: number;
    familiasEmbarcadas: number;
  };
}

export class InstituicaoService {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Cria uma nova instituição
   */
  static async createInstituicao(instituicaoData: CreateInstituicaoData): Promise<Instituicao> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instituicoes`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instituicaoData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar instituição');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao criar instituição');
    }
  }

  /**
   * Obtém todas as instituições
   */
  static async getInstituicoes(): Promise<Instituicao[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instituicoes`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar instituições');
      }

      return data.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar instituições');
    }
  }

  /**
   * Obtém uma instituição por ID
   */
  static async getInstituicaoById(id: string): Promise<Instituicao> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instituicoes/${id}`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar instituição');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar instituição');
    }
  }

  /**
   * Atualiza uma instituição
   */
  static async updateInstituicao(id: string, instituicaoData: UpdateInstituicaoData): Promise<Instituicao> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instituicoes/${id}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(instituicaoData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar instituição');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar instituição');
    }
  }

  /**
   * Deleta uma instituição
   */
  static async deleteInstituicao(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instituicoes/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar instituição');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao deletar instituição');
    }
  }

  /**
   * Marca uma instituição como evadida
   */
  static async marcarEvasao(id: string, evasaoData: EvasaoData): Promise<Instituicao> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/instituicoes/${id}/evasao`, {
        method: 'PATCH',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(evasaoData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao marcar evasão');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao marcar evasão');
    }
  }

  /**
   * Obtém estatísticas das instituições
   */
  static async getStats(): Promise<InstituicaoStats> {
    try {
      console.log('Making request to:', `${API_BASE_URL}/api/instituicoes/stats`);
      console.log('Auth headers:', this.getAuthHeaders());
      
      const response = await fetch(`${API_BASE_URL}/api/instituicoes/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
        },
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Stats result:', result);
      return result.data;
    } catch (error) {
      console.error('Error fetching institution stats:', error);
      throw error;
    }
  }

  /**
   * Força uma nova requisição de estatísticas sem cache
   */
  static async refreshStats(): Promise<InstituicaoStats> {
    return this.getStats();
  }
}