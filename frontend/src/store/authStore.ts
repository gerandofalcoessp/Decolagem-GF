import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  checkAuth: () => Promise<void>;
}

// Mock de usuários para desenvolvimento (será substituído pelo Supabase)
const mockUsers: User[] = [
  {
    id: '1',
    nome: 'Admin Sistema',
    email: 'admin@decolagem.com',
    role: 'super_admin',
    regional: 'nacional',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    nome: 'Equipe São Paulo',
    email: 'equipe.sp@decolagem.com',
    role: 'equipe_interna',
    regional: 'sp',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    nome: 'Equipe Rio de Janeiro',
    email: 'equipe.rj@decolagem.com',
    role: 'equipe_interna',
    regional: 'rj',
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          // Simulação de login (será substituído pelo Supabase)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Mock de validação
          const user = mockUsers.find(u => u.email === email);
          
          if (!user) {
            throw new Error('Usuário não encontrado');
          }
          
          // Mock de validação de senha (em produção será feito pelo Supabase)
          if (password !== '123456') {
            throw new Error('Senha incorreta');
          }
          
          set({ 
            user, 
            isAuthenticated: true, 
            isLoading: false 
          });
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false 
        });
        
        // Limpar localStorage
        localStorage.removeItem('auth-storage');
      },

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true 
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      checkAuth: async () => {
        const { user } = get();
        
        if (user) {
          // Verificar se o token ainda é válido (será implementado com Supabase)
          set({ isAuthenticated: true });
        } else {
          set({ isAuthenticated: false });
        }
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