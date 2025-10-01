import { FC } from 'react';
import { 
  User,
  Plus,
  Search,
  Edit,
  Trash2
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Membro = {
  id: number;
  nome: string;
  funcao: string;
  regional: string;
  status?: string;
};

interface MembrosTabProps {
  // Filtros e estados
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedFuncao: string;
  setSelectedFuncao: React.Dispatch<React.SetStateAction<string>>;
  selectedRegional: string;
  setSelectedRegional: React.Dispatch<React.SetStateAction<string>>;

  // Dados
  funcoes: string[];
  regionais: string[];
  filteredMembros: Membro[];

  // Ações do container
  setShowAddMemberModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowAddFuncaoModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingMember: React.Dispatch<React.SetStateAction<Membro | null>>;
  handleDeleteMember: (membro: Membro) => void;
}

const MembrosTab: FC<MembrosTabProps> = ({
  searchTerm,
  setSearchTerm,
  selectedFuncao,
  setSelectedFuncao,
  selectedRegional,
  setSelectedRegional,
  funcoes,
  regionais,
  filteredMembros,
  setShowAddMemberModal,
  setShowAddFuncaoModal,
  setEditingMember,
  handleDeleteMember,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Membros</h2>
          <p className="text-gray-600 mt-1">Gerencie todos os membros das equipes regionais</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddMemberModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedFuncao}
          onChange={(e) => {
            setSelectedFuncao(e.target.value);
            if (e.target.value === 'Outro') {
              setShowAddFuncaoModal(true);
            }
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option>Todas as funções</option>
          {funcoes.map((funcao) => (
            <option key={funcao} value={funcao}>
              {funcao}
            </option>
          ))}
        </select>
        <select
          value={selectedRegional}
          onChange={(e) => setSelectedRegional(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {regionais.map((regional) => (
            <option key={regional} value={regional}>
              {regional}
            </option>
          ))}
        </select>
      </div>

      {/* Tabela de Membros */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Nome</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Função</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Regional</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembros.map((membro) => (
                <tr key={membro.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{membro.nome}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        membro.funcao === 'Coordenador'
                          ? 'bg-blue-100 text-blue-800'
                          : membro.funcao === 'Líder Regional'
                          ? 'bg-green-100 text-green-800'
                          : membro.funcao === 'Diretor'
                          ? 'bg-purple-100 text-purple-800'
                          : membro.funcao === 'Gerente'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {membro.funcao}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{membro.regional}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button onClick={() => setEditingMember(membro)} className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteMember(membro)} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MembrosTab;