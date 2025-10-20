import { API_BASE_URL } from '@/utils/config';

export interface Goal {
  id?: string;
  nome: string;
  descricao?: string;
  valor_meta?: number;
  valor_atual?: number;
  due_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  member_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para compatibilidade com o frontend
export interface FrontendGoal {
  id?: string;
  nome: string;
  descricao?: string;
  quantidade?: string;
  mes?: string | string[];
  ano?: string;
  regionais?: string[];
  // Campos para DashboardMetasPage
  titulo?: string;
  valorMeta?: number;
  valorAtual?: number;
  dataInicio?: string;
  dataFim?: string;
  status?: string;
  equipe?: string;
  regional?: string;
}

export interface CreateGoalData {
  nome: string;
  descricao?: string;
  valor_meta?: number;
  valor_atual?: number;
  due_date?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export class GoalService {
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Converte dados do backend para formato do frontend
   */
  private static adaptGoalToFrontend(goal: Goal): FrontendGoal {
    // Valores padrão para campos obrigatórios
    let mes: string[] = ['todo-ano']; // Meta anual por padrão
    let regionais: string[] = ['SP']; // SP como padrão
    let ano = new Date().getFullYear().toString();
    
    // Se há due_date, extrair o ano e mês
    if (goal.due_date) {
      const dueDate = new Date(goal.due_date);
      ano = dueDate.getFullYear().toString();
      mes = [(dueDate.getMonth() + 1).toString().padStart(2, '0')];
    }
    
    // Tentar extrair informações da descrição se disponível
    if (goal.descricao) {
      // Extrair meses da descrição (formato flexível)
      const mesesMatch = goal.descricao.match(/(?:mês|meses|período):\s*([^|,\n]+)/i);
      if (mesesMatch) {
        const mesesStr = mesesMatch[1].trim().toLowerCase();
        if (mesesStr.includes('todo') || mesesStr.includes('ano')) {
          mes = ['todo-ano'];
        } else {
          // Mapear nomes dos meses para números
          const mesesMap: { [key: string]: string } = {
            'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
            'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
            'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12',
            'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
            'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
            'set': '09', 'out': '10', 'nov': '11', 'dez': '12'
          };
          
          const mesesEncontrados = mesesStr.split(/[,;]/).map(m => {
            const mesLimpo = m.trim().toLowerCase();
            return mesesMap[mesLimpo] || mesLimpo;
          }).filter(Boolean);
          
          if (mesesEncontrados.length > 0) {
            mes = mesesEncontrados;
          }
        }
      }
      
      // Extrair regionais da descrição
      const regionaisMatch = goal.descricao.match(/(?:regional|regionais|área|áreas):\s*([^|\n]+)/i);
      if (regionaisMatch) {
        const regionaisStr = regionaisMatch[1].trim();
        
        // Mapear os valores encontrados para as chaves corretas do REGIONAL_LABELS
        const mapeamentoAreas: Record<string, string> = {
          'nacional': 'nacional',
          'comercial': 'comercial',
          'centro-oeste': 'centro_oeste',
          'centro oeste': 'centro_oeste',
          'mg/es': 'mg_es',
          'mg es': 'mg_es',
          'minas gerais': 'mg_es',
          'espirito santo': 'mg_es',
          'nordeste 1': 'nordeste_1',
          'nordeste1': 'nordeste_1',
          'nordeste 2': 'nordeste_2',
          'nordeste2': 'nordeste_2',
          'norte': 'norte',
          'rj': 'rj',
          'rio de janeiro': 'rj',
          'sp': 'sp',
          'são paulo': 'sp',
          'sao paulo': 'sp',
          'sul': 'sul'
        };
        
        if (regionaisStr.toLowerCase().includes('todas')) {
          // Quando é "todas", mapear para todas as regionais específicas
          regionais = ['centro_oeste', 'mg_es', 'nordeste_1', 'nordeste_2', 'norte', 'rj', 'sp', 'sul', 'nacional', 'comercial'];
        } else if (regionaisStr.toLowerCase().trim() === 'nacional') {
          // Quando é especificamente "nacional", manter como nacional
          regionais = ['nacional'];
        } else {
          // Processar múltiplas regionais separadas por vírgula
          const areasArray = regionaisStr.split(',').map(area => area.trim());
          regionais = areasArray.map(area => {
            const areaLimpa = area.toLowerCase().trim();
            return mapeamentoAreas[areaLimpa] || areaLimpa;
          }).filter(area => area); // Remove valores vazios
        }
      }
    }

    return {
      id: goal.id,
      nome: goal.nome || 'Meta sem nome',
      descricao: goal.descricao,
      quantidade: goal.valor_meta?.toString() || '0',
      mes: mes,
      ano: ano,
      regionais: regionais,
      // Campos para DashboardMetasPage
      titulo: goal.nome || 'Meta sem nome',
      valorMeta: goal.valor_meta || 0,
      valorAtual: goal.valor_atual || 0,
      dataInicio: goal.created_at,
      dataFim: goal.due_date,
      status: goal.status === 'completed' ? 'concluida' : 
              goal.status === 'in_progress' ? 'em_andamento' : 'pendente',
      equipe: 'Equipe Nacional', // Valor padrão
      regional: regionais.join(', ') // Mostrar todas as regionais separadas por vírgula
    };
  }

  /**
   * Cria uma nova meta
   */
  static async createGoal(goalData: CreateGoalData): Promise<FrontendGoal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar meta');
      }

      return this.adaptGoalToFrontend(data.data);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao criar meta');
    }
  }

  /**
   * Obtém todas as metas
   */
  static async getGoals(): Promise<FrontendGoal[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals`, {
        headers: this.getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao buscar metas');
      }

      const goals: Goal[] = data.data || [];
      return goals.map(goal => this.adaptGoalToFrontend(goal));
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao buscar metas');
    }
  }

  /**
   * Atualiza uma meta
   */
  static async updateGoal(id: string, goalData: Partial<CreateGoalData>): Promise<FrontendGoal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(goalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao atualizar meta');
      }

      return this.adaptGoalToFrontend(data.data);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao atualizar meta');
    }
  }

  /**
   * Deleta uma meta
   */
  static async deleteGoal(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar meta');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Erro ao deletar meta');
    }
  }
}