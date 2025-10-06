import { useState, ComponentType, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Target, 
  MapPin, 
  Calendar, 
  Settings, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  Building2
} from 'lucide-react';
import { useAuthStore, useAuthActions, hasPermission } from '@/store/authStore';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import asMarasPng from '@/assets/logos/logo as maras.png';
import gfLogoSvg from '@/assets/logos/AF_Logo_Gerando-Falcoes-MONOCOR.svg';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface MenuItem {
  name: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  requiredRole?: 'super_admin' | 'equipe_interna';
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    name: 'Dashboard Geral',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Dashboard Metas',
    href: '/dashboard/metas',
    icon: Target,
  },
  {
    name: 'Regionais',
    href: '/regionais',
    icon: MapPin,
  },
  {
    name: 'Instituições',
    href: '/ongs',
    icon: Building2,
  },
  {
    name: 'Calendário',
    href: '/calendario',
    icon: Calendar,
  },
  {
    name: 'Configurações',
    href: '/configuracoes',
    icon: Settings,
    requiredRole: 'super_admin',
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuthActions();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = (menuName: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuName) 
        ? prev.filter(name => name !== menuName)
        : [...prev, menuName]
    );
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.requiredRole || hasPermission(user, item.requiredRole)
  );

  // Saudação e data formatada para o header
  const now = new Date();
  const hour = now.getHours();
  const firstName = user?.nome ? user.nome.split(' ')[0] : undefined;
  const greetingText = `${hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'}${firstName ? `, ${firstName}` : ''}`;
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  }).format(now);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-pink-500 to-pink-600 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-pink-400">
            <div className="flex-1 flex items-center justify-center">
              <img src={asMarasPng} alt="As Maras" className="w-[80px] h-16 object-contain filter invert brightness-0" />
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-pink-200 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const ItemIcon = item.icon;
              return (
                <div key={item.name}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleMenu(item.name)}
                        className={`
                          w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors
                          ${expandedMenus.includes(item.name) 
                            ? 'bg-pink-400 text-white' 
                            : 'text-white hover:bg-pink-400'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <ItemIcon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 transition-transform ${
                            expandedMenus.includes(item.name) ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      {expandedMenus.includes(item.name) && (
                        <div className="mt-1 ml-6 space-y-1">
                          {item.children
                            .filter(child => !child.requiredRole || hasPermission(user, child.requiredRole))
                            .map((child) => {
                              const ChildIcon = child.icon;
                              return (
                                <Link
                                  key={child.name}
                                  to={child.href}
                                  className={`
                                    flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors
                                    ${isActiveRoute(child.href)
                                      ? 'bg-pink-400 text-white border-r-2 border-white'
                                      : 'text-pink-100 hover:bg-pink-400 hover:text-white'
                                    }
                                  `}
                                  onClick={() => setSidebarOpen(false)}
                                >
                                  <ChildIcon className="w-4 h-4" />
                                  <span>{child.name}</span>
                                </Link>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      to={item.href}
                      className={`
                        flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                        ${isActiveRoute(item.href)
                          ? 'bg-pink-400 text-white border-r-2 border-white'
                          : 'text-white hover:bg-pink-400'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <ItemIcon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          {/* Footer */}
          <div className="px-3 py-2 border-t border-pink-300">
            <div className="flex items-center space-x-2 px-2 py-1">
              <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {user?.nome.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs leading-tight font-medium text-white truncate">
                  {user?.nome}
                </p>
                <p className="text-[10px] leading-tight text-pink-200 truncate">
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Equipe Interna'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            {/* Grupo à esquerda: menu + saudação/data */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {greetingText}
                </p>
                <p className="text-xs text-gray-500">
                  {formattedDate}
                </p>
              </div>
            </div>
            
            {/* Botão Sair à direita */}
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img src={gfLogoSvg} alt="Gerando Falcões" className="w-[120px] h-[120px]" />
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
      
      {/* Notification Components */}
      <ToastContainer />
      <ConfirmationDialog />
    </div>
  );
}