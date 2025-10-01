import { UserCog } from 'lucide-react';

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600">Gerenciar usuários e permissões</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <UserCog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Gestão de Usuários em Desenvolvimento
        </h3>
        <p className="text-gray-600">
          Esta funcionalidade será implementada em breve.
        </p>
      </div>
    </div>
  );
}