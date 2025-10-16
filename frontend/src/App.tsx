import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Critical pages (loaded immediately)
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';

// Lazy loaded pages for better performance
const DashboardMetasPage = lazy(() => import('@/pages/dashboard/DashboardMetasPage'));
const CalendarioPage = lazy(() => import('@/pages/calendario/CalendarioPage'));
const RegionalCalendarioPage = lazy(() => import('@/pages/regionais/RegionalCalendarioPage'));

// Programas - lazy loaded
const AsMarasPage = lazy(() => import('@/pages/programas/AsMarasPage'));
const MicrocreditoPage = lazy(() => import('@/pages/programas/MicrocreditoPage'));
const DecolagemPage = lazy(() => import('@/pages/programas/DecolagemPage'));

// Regionais - lazy loaded
const RegionaisPage = lazy(() => import('@/pages/regionais/RegionaisPage'));
const GestaoAtividadesRegionaisPage = lazy(() => import('@/pages/regionais/GestaoAtividadesRegionaisPage'));
const EditarAtividadeRegionalPage = lazy(() => import('@/pages/regionais/EditarAtividadeRegionalPage'));

// ONGs - lazy loaded
const OngCadastroPage = lazy(() => import('@/pages/ongs/OngCadastroPage'));
const OngListPage = lazy(() => import('@/pages/ongs/OngListPage'));
const OngDetalhesPage = lazy(() => import('@/pages/ongs/OngDetalhesPage'));

// Configurações - lazy loaded
const Configuracoes = lazy(() => import('@/pages/Configuracoes'));

// Components
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function App() {
  const { user, isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    console.log('🚀 App: Iniciando verificação de autenticação');
    checkAuth();
  }, [checkAuth]);

  console.log('🔍 App: Estado atual - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);

  if (isLoading) {
    console.log('⏳ App: Mostrando tela de loading');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  console.log('✅ App: Renderizando rotas principais');

  return (
    <Routes>
      {/* Rotas de autenticação */}
      <Route
        path="/login"
        element={
          isAuthenticated && user ? (
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
              <Suspense fallback={<LoadingSpinner size="lg" />}>
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
                  <Route path="/regionais/gestao-atividades" element={<GestaoAtividadesRegionaisPage />} />
                  <Route path="/regionais/atividades/editar/:id" element={<EditarAtividadeRegionalPage />} />

                  {/* ONGs */}
                  <Route path="/ongs" element={<OngListPage />} />
                  <Route path="/ongs/cadastrar" element={<OngCadastroPage />} />
                  <Route path="/ongs/editar/:id" element={<OngCadastroPage />} />
                  <Route path="/ongs/detalhes/:id" element={<OngDetalhesPage />} />
                  
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
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;