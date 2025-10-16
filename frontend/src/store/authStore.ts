import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '../types';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
  register: (userData: {
    email: string;
    password: string;
    nome: string;
    role: string;
    regional: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await AuthService.login(email, password);
          const user = AuthService.mapToFrontendUser(response);
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao fazer login';
          set({ isLoading: false, error: errorMessage });
        }
      },

      logout: () => {
        AuthService.logout();
        set({
          user: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        try {
          logger.debug('🔐 AuthStore: Iniciando checkAuth');
          set({ isLoading: true });
          
          logger.debug('📡 AuthStore: Chamando AuthService.getCurrentUser');
          const response = await AuthService.getCurrentUser();
          
          if (response) {
            logger.debug('✅ AuthStore: Usuário encontrado:', response);
            const user = AuthService.mapToFrontendUser(response);
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            logger.debug('❌ AuthStore: Nenhum usuário encontrado');
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          logger.error('💥 AuthStore: Erro ao verificar autenticação:', error);
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      register: async (userData: {
        email: string;
        password: string;
        nome: string;
        role: string;
        regional: string;
      }) => {
        try {
          set({ isLoading: true, error: null });
          await AuthService.register(userData);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar usuário';
          set({ isLoading: false, error: errorMessage });
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true, error: null });
          await AuthService.resetPassword(email);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao solicitar recuperação de senha';
          set({ isLoading: false, error: errorMessage });
        }
      },

      updatePassword: async (newPassword: string) => {
        try {
          set({ isLoading: true, error: null });
          await AuthService.updatePassword(newPassword);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar senha';
          set({ isLoading: false, error: errorMessage });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Hooks auxiliares
export const useAuth = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  return { user, isAuthenticated, isLoading };
};

export const useAuthActions = () => {
  const { login, logout, setUser, setLoading, checkAuth } = useAuthStore();
  return { login, logout, setUser, setLoading, checkAuth };
};

// Função para verificar permissões
export const hasPermission = (user: User | null, requiredRole?: UserRole): boolean => {
  if (!user) return false;
  
  if (!requiredRole) return true;
  
  // Super admin tem acesso a tudo
  if (user.role === 'super_admin') return true;
  
  // Verificar role específica
  return user.role === requiredRole;
};

// Função para verificar se pode acessar regional
export const canAccessRegional = (user: User | null, regional?: string): boolean => {
  if (!user) return false;
  
  // Super admin pode acessar todas as regionais
  if (user.role === 'super_admin') return true;
  
  // Se não especificou regional, pode acessar
  if (!regional) return true;
  
  // Verificar se a regional do usuário corresponde
  return user.regional === regional;
};