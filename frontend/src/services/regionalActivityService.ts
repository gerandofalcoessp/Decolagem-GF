import { AuthService } from './authService';

import { API_BASE_URL } from '@/utils/config';

class RegionalActivityService {
  private async getValidAuthToken(): Promise<string | null> {
    let token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('Token de autenticação não encontrado');
    }

    // Verificar se o token ainda é válido fazendo uma requisição de teste
    try {
      const testResponse = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (testResponse.status === 401) {
        // Token expirado, tentar renovar
        console.log('🔄 Token expirado, tentando renovar...');
        
        try {
          const currentUser = await AuthService.getCurrentUser();
          if (currentUser && currentUser.session?.access_token) {
            token = currentUser.session.access_token;
            localStorage.setItem('auth_token', token);
            console.log('✅ Token renovado com sucesso');
          } else {
            throw new Error('Não foi possível renovar o token');
          }
        } catch (renewError) {
          console.error('❌ Erro ao renovar token:', renewError);
          // Limpar dados de autenticação inválidos
          AuthService.clearAuthData();
          throw new Error('Sessão expirada. Faça login novamente.');
        }
      }
    } catch (networkError) {
      console.warn('⚠️ Erro ao verificar token, continuando com token atual:', networkError);
    }

    return token;
  }

  /**
   * Deleta uma atividade regional
   */
  async deleteActivity(activityId: string): Promise<void> {
    try {
      const token = await this.getValidAuthToken();
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
          
          // Se for erro de JWT, tentar uma vez mais com token renovado
          if (response.status === 401 && errorMessage.includes('JWT')) {
            console.log('🔄 Erro JWT detectado, tentando novamente com token renovado...');
            const newToken = await this.getValidAuthToken();
            
            const retryResponse = await fetch(`${API_BASE_URL}/api/regional-activities/${activityId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (!retryResponse.ok) {
              const retryErrorData = await retryResponse.json().catch(() => ({}));
              throw new Error(retryErrorData.error || 'Erro ao deletar atividade após renovação do token');
            }
            
            // Sucesso na segunda tentativa
            console.log('✅ Atividade deletada com sucesso após renovação do token:', activityId);
            return;
          }
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