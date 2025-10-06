import { FC } from 'react';
import { Plus, Search, Eye, Edit, Shield, Trash2, Ban, CheckCircle, Key } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export type Usuario = {
  id: number | string;
  auth_user_id?: string;
  usuario: string;
  email: string;
  tipo: string;
  permissao: string;
  regional: string;
  funcao?: string;
  area?: string;
  status: string;
  criadoEm: string;
  senha?: string;
  banned_until?: string | null;
};

interface SenhasTabProps {
  // Filtros e estados
  searchUsuarios: string;
  setSearchUsuarios: React.Dispatch<React.SetStateAction<string>>;
  filterTipo: string;
  setFilterTipo: React.Dispatch<React.SetStateAction<string>>;
  filterStatus: string;
  setFilterStatus: React.Dispatch<React.SetStateAction<string>>;
  filterFuncao: string;
  setFilterFuncao: React.Dispatch<React.SetStateAction<string>>;
  filterArea: string;
  setFilterArea: React.Dispatch<React.SetStateAction<string>>;

  // Dados
  filteredUsuarios: Usuario[];

  // Ações do container
  setShowAddUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedUser: React.Dispatch<React.SetStateAction<Usuario | null>>;
  setShowViewUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowEditUserModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowResetPasswordModal: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDeleteUserModal: React.Dispatch<React.SetStateAction<boolean>>;

  // Novas ações para bloqueio/desbloqueio
  onBlockUser?: (userId: string) => Promise<void>;
  onUnblockUser?: (userId: string) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onGeneratePassword?: (userId: string) => Promise<void>;
}

const SenhasTab: FC<SenhasTabProps> = ({
  searchUsuarios,
  setSearchUsuarios,
  filterTipo,
  setFilterTipo,
  filterStatus,
  setFilterStatus,
  filterFuncao,
  setFilterFuncao,
  filterArea,
  setFilterArea,
  filteredUsuarios,
  setShowAddUserModal,
  setSelectedUser,
  setShowViewUserModal,
  setShowEditUserModal,
  setShowResetPasswordModal,
  setShowDeleteUserModal,
  onBlockUser,
  onUnblockUser,
  onDeleteUser,
  onGeneratePassword,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Senhas - Uso Interno</h2>
          <p className="text-gray-600 mt-1 text-sm">
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
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por login ou nome..."
            value={searchUsuarios}
            onChange={(e) => setSearchUsuarios(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            spellCheck="false"
          />
        </div>
        <select 
          value={filterTipo}
          onChange={(e) => setFilterTipo(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option>Todos</option>
          <option>Nacional</option>
          <option>Regional</option>
        </select>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option>Todos</option>
          <option>Ativo</option>
          <option>Inativo</option>
        </select>
        <select 
          value={filterFuncao}
          onChange={(e) => setFilterFuncao(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">Todas as Funções</option>
          <option value="Comercial">Comercial</option>
          <option value="Nacional">Nacional</option>
          <option value="Líder Nacional">Líder Nacional</option>
          <option value="Diretor Operações">Diretor Operações</option>
          <option value="Líder Regional">Líder Regional</option>
          <option value="Coordenador">Coordenador</option>
          <option value="Consultor">Consultor</option>
          <option value="Analista">Analista</option>
          <option value="Assistente">Assistente</option>
          <option value="Gerente">Gerente</option>
          <option value="Diretor">Diretor</option>
          <option value="Outro">Outro</option>
        </select>
        <select 
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        >
          <option value="">Todas as Áreas</option>
          <option value="Administrativo">Administrativo</option>
          <option value="Financeiro">Financeiro</option>
          <option value="Operacional">Operacional</option>
          <option value="Comercial">Comercial</option>
          <option value="Técnico">Técnico</option>
          <option value="RH">Recursos Humanos</option>
        </select>
      </div>

      {/* Tabela de Usuários */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Usuário</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Tipo</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Permissão</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Função</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Área</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Criado em</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{usuario.usuario}</div>
                      <div className="text-xs text-gray-500">{usuario.email}</div>
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
                  <td className="py-3 px-4 text-gray-900 text-sm">{usuario.funcao || 'Não definido'}</td>
                  <td className="py-3 px-4 text-gray-900 text-sm">{usuario.area || usuario.regional || 'Não definido'}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {usuario.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-900 text-sm">{usuario.criadoEm}</td>
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
                        onClick={() => onGeneratePassword?.(usuario.auth_user_id!)}
                        className="p-1 text-gray-400 hover:text-purple-600" 
                        title="Gerar Nova Senha"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {usuario.status === 'Bloqueado' ? (
                        <button 
                          onClick={() => onUnblockUser?.(usuario.auth_user_id!)}
                          className="p-1 text-gray-400 hover:text-green-600" 
                          title="Desbloquear Usuário"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => onBlockUser?.(usuario.auth_user_id!)}
                          className="p-1 text-gray-400 hover:text-yellow-600" 
                          title="Bloquear Usuário"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteUser?.(usuario.auth_user_id!)}
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