import { FC } from 'react';
import { Plus, Search, Eye, Edit, Shield, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export type Usuario = {
  id: number;
  usuario: string;
  email: string;
  tipo: string;
  permissao: string;
  regional: string;
  status: string;
  criadoEm: string;
  senha?: string;
};

interface SenhasTabProps {
  // Filtros e estados
  searchUsuarios: string;
  setSearchUsuarios: React.Dispatch<React.SetStateAction<string>>;
  filterTipo: string;
  setFilterTipo: React.Dispatch<React.SetStateAction<string>>;
  filterStatus: string;
  setFilterStatus: React.Dispatch<React.SetStateAction<string>>;

  // Dados
  filteredUsuarios: Usuario[];

  // Ações do container
  setShowAddUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  setShowViewUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEditUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResetPasswordModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDeleteUserModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const SenhasTab: FC<SenhasTabProps> = ({
  searchUsuarios,
  setSearchUsuarios,
  filterTipo,
  setFilterTipo,
  filterStatus,
  setFilterStatus,
  filteredUsuarios,
  setShowAddUserModal,
  setSelectedUser,
  setShowViewUserModal,
  setShowEditUserModal,
  setShowResetPasswordModal,
  setShowDeleteUserModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Senhas - Uso Interno</h2>
          <p className="text-gray-600 mt-1">
            Sistema para uso interno da organização. O super admin pode visualizar senhas temporárias para repassar aos usuários. 
            Senhas são geradas automaticamente de forma segura.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddUserModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Criar Usuário
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por login ou nome..."
            value={searchUsuarios}
            onChange={(e) => setSearchUsuarios(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select 
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option>Todos</option>
          <option>Nacional</option>
          <option>Regional</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option>Todos</option>
          <option>Ativo</option>
          <option>Inativo</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Usuário</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Permissão</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Regional</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Criado em</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900">{usuario.usuario}</div>
                      <div className="text-sm text-gray-500">{usuario.email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {usuario.tipo}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {usuario.permissao}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{usuario.regional}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {usuario.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{usuario.criadoEm}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedUser(usuario);
                          setShowViewUserModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600" 
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(usuario);
                          setShowEditUserModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600" 
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(usuario);
                          setShowResetPasswordModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-orange-600" 
                        title="Resetar Senha"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(usuario);
                          setShowDeleteUserModal(true);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600" 
                        title="Excluir"
                      >
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

export default SenhasTab;