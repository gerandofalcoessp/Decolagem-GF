import { FC } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Info, Upload, Download, FileText } from 'lucide-react';

const ArquivosTab: FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Arquivos</h2>
        <p className="text-gray-600 mt-1">Importe e exporte dados do sistema</p>
      </div>

      {/* Status do Sistema */}
      <Card>
        <div className="p-6 bg-green-50 border border-green-200">
          <div className="flex items-center space-x-3">
            <Info className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">
                <strong>Status do Sistema:</strong> Sistema funcionando - 1000 atividades carregadas
              </p>
              <p className="text-green-700">
                <strong>Regionais:</strong> 8 | <strong>Selecionada:</strong> Nenhuma
              </p>
              <p className="text-green-700">
                <strong>Centro-Oeste:</strong> 130 atividades
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Importação de Atividades */}
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Upload className="w-6 h-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Importação de Atividades</h3>
            </div>
            <p className="text-gray-600 mb-4">Importe atividades usando o template Excel com formatação correta</p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">1. Baixe o template Excel corrigido</span>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template Excel (.XLSX)
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">2. Selecione o arquivo Excel preenchido</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="text-xs text-gray-500">Nenhum arquivo escolhido</p>
              </div>
              
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Upload className="w-4 h-4 mr-2" />
                Importar Atividades
              </Button>
            </div>
          </div>
        </Card>

        {/* Exportação de Dados */}
        <Card>
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Download className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Exportação de Dados</h3>
            </div>
            <p className="text-gray-600 mb-4">Exporte os dados das atividades para Excel (.xlsx) ou HTML com formatação correta</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">Selecione a Regional</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Escolha uma regional...</option>
                  <option>Centro-Oeste</option>
                  <option>MG/ES</option>
                  <option>Nordeste 1</option>
                  <option>Nordeste 2</option>
                  <option>Todas as Regionais</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button className="bg-green-600 hover:bg-green-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar Excel (.XLSX)
                </Button>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Exportar Relatório HTML
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ArquivosTab;