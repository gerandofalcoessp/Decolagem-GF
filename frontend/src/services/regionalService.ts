const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

export interface Regional {
  id: string;
  name: string;
  created_at: string;
}

class RegionalService {
  private async getAuthToken(): Promise<string | null> {
    const token = localStorage.getItem('auth_token');
    return token;
  }

  async getRegionals(): Promise<Regional[]> {
    const token = await this.getAuthToken();
    if (!token) throw new Error('Token não encontrado');

    const response = await fetch(`${API_BASE_URL}/api/regionals`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar regionais: ${response.statusText}`);
    }

    const result = await response.json();
    return result.data || [];
  }

  async getRegionalByName(name: string): Promise<Regional | null> {
    const regionals = await this.getRegionals();
    return regionals.find(r => r.name === name) || null;
  }

  // Mapeamento de nomes de regionais do frontend para nomes no banco
  mapRegionalName(frontendName: string): string {
    const mapping: Record<string, string> = {
      'Centro-Oeste': 'Centro-Oeste',
      'MG/ES': 'MG/ES',
      'Nordeste 1': 'Nordeste 1',
      'Nordeste 2': 'Nordeste 2',
      'Norte': 'Norte',
      'Rio de Janeiro': 'Rio de Janeiro',
      'São Paulo': 'São Paulo',
      'Sul': 'Sul',
      'Nacional': 'Nacional',
      'Comercial': 'Comercial'
    };
    
    return mapping[frontendName] || frontendName;
  }
}

export default new RegionalService();