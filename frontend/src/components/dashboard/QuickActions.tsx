import { Link } from 'react-router-dom';
import { 
  UserPlus, 
  CreditCard, 
  FileText, 
  Calendar,
  Target,
  Settings,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth, hasPermission } from '@/store/authStore';

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  requiredRole?: 'super_admin' | 'equipe_interna';
}

const quickActions: QuickAction[] = [
  {
    title: 'Nova Participante',
    description: 'Cadastrar participante',
    href: '/programas/as-maras?action=new',
    icon: UserPlus,
    color: 'bg-primary-50 text-primary-600 hover:bg-primary-100',
  },
  {
    title: 'Microcrédito',
    description: 'Solicitar empréstimo',
    href: '/programas/microcredito?action=new',
    icon: CreditCard,
    color: 'bg-green-50 text-green-600 hover:bg-green-100',
  },
  {
    title: 'Diagnóstico',
    description: 'Criar diagnóstico',
    href: '/programas/decolagem?action=new',
    icon: FileText,
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    title: 'Agendar Atividade',
    description: 'Nova atividade',
    href: '/calendario?action=new',
    icon: Calendar,
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  },
  {
    title: 'Definir Meta',
    description: 'Criar nova meta',
    href: '/configuracoes/metas?action=new',
    icon: Target,
    color: 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100',
    requiredRole: 'super_admin',
  },
  {
    title: 'Configurações',
    description: 'Gerenciar sistema',
    href: '/configuracoes',
    icon: Settings,
    color: 'bg-gray-50 text-gray-600 hover:bg-gray-100',
    requiredRole: 'super_admin',
  },
];

export default function QuickActions() {
  const { user } = useAuth();

  const filteredActions = quickActions.filter(action => 
    !action.requiredRole || hasPermission(user, action.requiredRole)
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Ações Rápidas
        </h3>
        <Plus className="w-5 h-5 text-gray-400" />
      </div>

      {/* Actions Grid */}
      <div className="space-y-3">
        {filteredActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link
              key={action.title}
              to={action.href}
              className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${action.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                    {action.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </Link>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                Precisa de ajuda?
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Consulte o manual do usuário ou entre em contato com o suporte.
              </p>
              <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                Ver documentação →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}