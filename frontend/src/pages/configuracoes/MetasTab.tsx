import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { GoalService } from '@/services/goalService';
import { useNotificationStore } from '@/store/notificationStore';

// Tipagem simples para evitar acoplamento; container mantém estados e regras
interface MetasTabProps {
  metas: any[];
  setShowNewMetaModal: (value: boolean) => void;
  setEditingMeta: (meta: any) => void;
  setNewMeta: (updater: any) => void;
  setShowEditMetaModal: (value: boolean) => void;
  mesesDisponiveis: { value: string; label: string }[];
  regionaisDisponiveis: string[];
  metasLoading?: boolean;
  metasError?: any;
  refetchGoals?: () => Promise<any>;
}

export default function MetasTab({
  metas,
  setShowNewMetaModal,
  setEditingMeta,
  setNewMeta,
  setShowEditMetaModal,
  mesesDisponiveis,
  regionaisDisponiveis,
  metasLoading,
  metasError,
  refetchGoals,
}: MetasTabProps) {
  const { showError, showConfirmation } = useNotificationStore();
  
  const handleDelete = async (meta: any, index: number) => {
    const confirmed = await showConfirmation({
      title: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir a meta "${meta.nome}"?`,
      onConfirm: () => {},
      confirmText: 'Excluir',
      cancelText: 'Cancelar'
    });
    if (!confirmed) return;

    try {
      await GoalService.deleteGoal(meta.id);
      if (refetchGoals) await refetchGoals();
    } catch (error: any) {
      console.error('Erro ao excluir meta:', error);
      showError('Erro ao excluir meta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuração de Metas</h2>
          <p className="text-gray-600 mt-1 text-sm">Configure e gerencie as metas do programa</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewMetaModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Loading / Erro */}
      {metasLoading && (
        <Card>
          <div className="p-6 text-sm text-gray-600">Carregando metas...</div>
        </Card>
      )}
      {metasError && !metasLoading && (
        <Card>
          <div className="p-6 text-sm text-red-600">Erro ao carregar metas.</div>
        </Card>
      )}

      {/* Lista de Metas */}
      {!metasLoading && !metasError && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Metas do Programa</h3>
            {!metas || metas.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Plus className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 mb-2 text-sm">Nenhuma meta criada ainda</p>
                <p className="text-sm text-gray-500">Clique em "Nova Meta" para criar sua primeira meta</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metas.map((meta: any, index: number) => (
                  <div
                    key={meta.id ?? index}
                    className="flex flex-col p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105"
                  >
                    <div className="flex-1 mb-3">
                      <p className="font-medium text-gray-900 text-sm">{meta.nome}</p>
                      <p className="text-sm text-gray-600">
                        {meta.nome === 'Retenção' ? 'Porcentagem' : 'Quantidade'}: {meta.quantidade}
                        {meta.nome === 'Retenção' ? '%' : ''}
                      </p>
                      <p className="text-sm text-gray-600">
                        Período:{' '}
                        {Array.isArray(meta.mes)
                          ? meta.mes.includes('todo-ano')
                            ? 'Todo o ano'
                            : meta.mes
                                .map((m: string) => mesesDisponiveis.find((mes) => mes.value === m)?.label || m)
                                .join(', ')
                          : mesesDisponiveis.find((m) => m.value === meta.mes)?.label || meta.mes}
                        /{meta.ano}
                      </p>
                      <p className="text-sm text-gray-600">
                        Área:{' '}
                        {(() => {
                          // Garantir que regionais seja sempre um array
                          const regionaisArray = Array.isArray(meta.regionais) 
                            ? meta.regionais 
                            : (typeof meta.regionais === 'string' && meta.regionais.includes(','))
                              ? meta.regionais.split(',').map(r => r.trim())
                              : meta.regionais ? [meta.regionais] : [];
                          
                          // Se tem todas as regionais disponíveis, mostrar "Todas"
                          if (regionaisArray.length === regionaisDisponiveis.length) {
                            return 'Todas';
                          }
                          
                          // Caso contrário, mostrar as regionais separadas por vírgula
                          return regionaisArray.join(', ');
                        })()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                        onClick={() => {
                          setEditingMeta(meta);
                          setNewMeta({
                            nome: meta.nome,
                            nomePersonalizado: meta.nome === 'Outra' ? meta.nome : '',
                            quantidade: meta.quantidade,
                            mes: Array.isArray(meta.mes) ? meta.mes : [meta.mes],
                            ano: meta.ano,
                            regionais: [...meta.regionais],
                          });
                          setShowEditMetaModal(true);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        className="text-sm text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50"
                        onClick={() => handleDelete(meta, index)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}