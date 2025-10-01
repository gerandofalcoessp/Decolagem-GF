import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import DashboardMetasPage from '@/pages/dashboard/DashboardMetasPage';
import CalendarioPage from '@/pages/calendario/CalendarioPage';
import RegionalCalendarioPage from '@/pages/regionais/RegionalCalendarioPage';

// Programas
import AsMarasPage from '@/pages/programas/AsMarasPage';
import MicrocreditoPage from '@/pages/programas/MicrocreditoPage';
import DecolagemPage from '@/pages/programas/DecolagemPage';

// Regionais
import RegionaisPage from '@/pages/regionais/RegionaisPage';

// ONGs
import OngCadastroPage from '@/pages/ongs/OngCadastroPage';

// Configurações
import Configuracoes from '@/pages/Configuracoes';

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Rotas de autenticação */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <LoginPage />
            </AuthLayout>
          )
        }
      />

      {/* Rotas protegidas */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                {/* Dashboard */}
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/metas" element={<DashboardMetasPage />} />
                
                {/* Calendário */}
                <Route path="/calendario" element={<CalendarioPage />} />
                
                {/* Programas */}
                <Route path="/programas/as-maras" element={<AsMarasPage />} />
                <Route path="/programas/microcredito" element={<MicrocreditoPage />} />
                <Route path="/programas/decolagem" element={<DecolagemPage />} />
                
                {/* Regionais */}
                <Route path="/regionais" element={<RegionaisPage />} />
                <Route path="/regionais/calendario" element={<RegionalCalendarioPage />} />

                {/* ONGs */}
                <Route path="/ongs/cadastrar" element={<OngCadastroPage />} />
                
                {/* Configurações (apenas Super Admin) */}
                <Route 
                  path="/configuracoes" 
                  element={
                    <ProtectedRoute requiredRole="super_admin">
                      <Configuracoes />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Redirect padrão */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 */}
                <Route 
                  path="*" 
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                        <p className="text-gray-600 mb-8">Página não encontrada</p>
                        <button
                          onClick={() => window.history.back()}
                          className="btn-primary"
                        >
                          Voltar
                        </button>
                      </div>
                    </div>
                  } 
                />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;