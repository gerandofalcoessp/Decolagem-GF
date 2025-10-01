import { FC } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const SistemaTab: FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
        <p className="text-gray-600 mt-1">Configurações gerais e avançadas do sistema</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Organização</label>
                <input
                  type="text"
                  defaultValue="Gerando Falcões"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fuso Horário</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>America/Sao_Paulo (UTC-3)</option>
                  <option>America/Manaus (UTC-4)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Idioma do Sistema</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Português (Brasil)</option>
                  <option>English</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup e Segurança</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Backup Automático</p>
                  <p className="text-sm text-gray-600">Último backup: Hoje às 03:00</p>
                </div>
                <Button variant="outline" size="sm">Configurar</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Logs do Sistema</p>
                  <p className="text-sm text-gray-600">Visualizar logs de atividade</p>
                </div>
                <Button variant="outline" size="sm">Ver Logs</Button>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Auditoria</p>
                  <p className="text-sm text-gray-600">Relatório de ações dos usuários</p>
                </div>
                <Button variant="outline" size="sm">Gerar Relatório</Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SistemaTab;