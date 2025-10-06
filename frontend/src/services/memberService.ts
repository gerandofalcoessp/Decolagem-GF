const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

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
   * Cria um novo membro
   */
  static async createMember(memberData: CreateMemberData): Promise<Member> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar membro');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao criar membro');
    }
  }

  /**
   * Obtém todos os membros
   */
  static async getMembers(): Promise<Member[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar membros');
      }

      return data.data || [];
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar membros');
    }
  }

  /**
   * Atualiza um membro
   */
  static async updateMember(id: string, memberData: Partial<CreateMemberData>): Promise<Member> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar membro');
      }

      return data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar membro');
    }
  }

  /**
   * Deleta um membro
   */
  static async deleteMember(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/members/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar membro');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao deletar membro');
    }
  }
}