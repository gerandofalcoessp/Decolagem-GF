const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');

class RegionalActivityService {
  private async getAuthToken(): Promise<string | null> {
    const token = localStorage.getItem('auth_token');
    return token;
  }

  /**
   * Deleta uma atividade regional
   */
  async deleteActivity(activityId: string): Promise<void> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Token de autenticação não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/api/regional-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao deletar atividade';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // Se não conseguir fazer parse do JSON de erro, usar mensagem padrão
          console.warn('Erro ao fazer parse do JSON de erro:', jsonError);
        }
        throw new Error(errorMessage);
      }

      // Tentar fazer parse da resposta de sucesso, mas não falhar se não conseguir
      try {
        const result = await response.json();
        console.log('✅ Atividade deletada com sucesso:', activityId, result);
      } catch (jsonError) {
        // Se não conseguir fazer parse do JSON de sucesso, apenas logar o sucesso
        console.log('✅ Atividade deletada com sucesso:', activityId);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar atividade:', error);
      throw new Error(error instanceof Error ? error.message : 'Erro ao deletar atividade');
    }
  }
}

export default new RegionalActivityService();