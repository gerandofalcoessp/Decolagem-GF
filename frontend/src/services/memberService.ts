import { API_BASE_URL } from '@/utils/config';

export interface Member {
  id?: string;
  name: string;
  email: string;
  auth_user_id?: string;
  regional_id?: string;
  funcao?: string;
  area?: string;
  created_at?: string;
}

export interface CreateMemberData {
  name: string;
  email: string;
  regional_id: string | null;
  funcao?: string;
  area?: string;
}

export class MemberService {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Cria um novo usuário (usando endpoint de auth/users)
   */
  static async createMember(memberData: CreateMemberData): Promise<Member> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: memberData.email,
          nome: memberData.name,
          regional: memberData.regional_id,
          funcao: memberData.funcao,
          area: memberData.area,
          password: '123456', // Senha padrão temporária
          role: 'user',
          tipo: 'Colaborador',
          status: 'ativo'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar usuário');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao criar usuário');
    }
  }

  /**
   * Obtém todos os usuários (usando endpoint de auth/users)
   */
  static async getMembers(): Promise<Member[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar usuários');
      }

      return data.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar usuários');
    }
  }

  /**
   * Atualiza um usuário (usando endpoint de auth/users)
   */
  static async updateMember(id: string, memberData: Partial<CreateMemberData>): Promise<Member> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: memberData.name,
          regional: memberData.regional_id,
          funcao: memberData.funcao,
          area: memberData.area
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar usuário');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar usuário');
    }
  }

  /**
   * Deleta um usuário (usando endpoint de auth/users)
   */
  static async deleteMember(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar usuário');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao deletar usuário');
    }
  }
}