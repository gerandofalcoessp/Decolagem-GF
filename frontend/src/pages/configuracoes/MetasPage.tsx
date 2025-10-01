import { Target } from 'lucide-react';

export default function MetasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuração de Metas</h1>
          <p className="text-gray-600">Definir e gerenciar metas do sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Configuração de Metas em Desenvolvimento
        </h3>
        <p className="text-gray-600">
          Esta funcionalidade será implementada em breve.
        </p>
      </div>
    </div>
  );
}