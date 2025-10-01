import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Target, 
  FileText, 
  Database,
  User,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Info,
  X
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface TabItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'membros', name: 'Membros', icon: Users },
  { id: 'senhas', name: 'Senhas', icon: Shield },
  { id: 'metas', name: 'Metas', icon: Target },
  { id: 'arquivos', name: 'Arquivos', icon: FileText },
  { id: 'sistema', name: 'Sistema', icon: Database },
];

// Mock data para membros
const mockMembros = [
  {
    id: 1,
    nome: 'Deise',
    funcao: 'Coordenador',
    regional: 'R. Centro-Oeste',
    status: 'ativo'
  },
  {
    id: 2,
    nome: 'Flávio',
    funcao: 'Líder Regional',
    regional: 'R. Centro-Oeste',
    status: 'ativo'
  },
  {
    id: 3,
    nome: 'Alcione',
    funcao: 'Coordenador',
    regional: 'R. MG/ES',
    status: 'ativo'
  },
  {
    id: 4,
    nome: 'Sérgio',
    funcao: 'Líder Regional',
    regional: 'R. MG/ES',
    status: 'ativo'
  },
  {
    id: 5,
    nome: 'Ana Maria',
    funcao: 'Consultor',
    regional: 'R. Nordeste 1',
    status: 'ativo'
  },
  {
    id: 6,
    nome: 'Carlos Eduardo',
    funcao: 'Diretor',
    regional: 'Nacional',
    status: 'ativo'
  },
  {
    id: 7,
    nome: 'Mariana Silva',
    funcao: 'Gerente',
    regional: 'Comercial',
    status: 'ativo'
  },
  {
    id: 8,
    nome: 'João Santos',
    funcao: 'Nacional',
    regional: 'Nacional',
    status: 'ativo'
  }
];

// Opções de funções
const funcoes = [
  'Comercial',
  'Nacional', 
  'Líder Regional',
  'Coordenador',
  'Consultor',
  'Diretor',
  'Gerente',
  'Outro'
];

// Opções de regionais
const regionais = [
  'Todas as áreas',
  'Nacional',
  'Comercial',
  'R. Centro-Oeste',
  'R. MG/ES',
  'R. Nordeste 1',
  'R. Nordeste 2',
  'R. Norte',
  'R. Rio de Janeiro',
  'R. Sul',
  'R. São Paulo'
];

// Mock data para usuários/senhas
const mockUsuarios = [
  {
    id: 1,
    usuario: 'Amanda Boliarini',
    email: 'amanda.boliarini@gerandofalcoes.com',
    tipo: 'Nacional',
    permissao: 'Super Admin',
    regional: '-',
    status: 'Ativo',
    criadoEm: '19/09/2025',
    senha: 'Admin@2025'
  },
  {
    id: 2,
    usuario: 'Lemaestro',
    email: 'diretor.operacoes',
    tipo: 'Nacional',
    permissao: 'Super Admin',
    regional: '-',
    status: 'Ativo',
    criadoEm: '11/08/2025',
    senha: 'Diretor123'
  },
  {
    id: 3,
    usuario: 'Nacional SP',
    email: 'nacionalsp',
    tipo: 'Nacional',
    permissao: 'Super Admin',
    regional: '-',
    status: 'Ativo',
    criadoEm: '25/06/2025',
    senha: 'NacionalSP@2025'
  },
  {
    id: 4,
    usuario: 'Léo Martins',
    email: 'lidernacional',
    tipo: 'Nacional',
    permissao: 'Super Admin',
    regional: '-',
    status: 'Ativo',
    criadoEm: '25/06/2025',
    senha: 'LeoMartins456'
  }
];

const MembrosTabLazy = lazy(() => import('./configuracoes/MembrosTab'));
const SenhasTabLazy = lazy(() => import('./configuracoes/SenhasTab'));
const ArquivosTabLazy = lazy(() => import('./configuracoes/ArquivosTab'));
const SistemaTabLazy = lazy(() => import('./configuracoes/SistemaTab'));
const MetasTabLazy = lazy(() => import('./configuracoes/MetasTab'));

// Prefetch dos módulos das abas para melhorar a performance de navegação
const prefetchTab = (id: string) => {
  switch (id) {
    case 'membros':
      import('./configuracoes/MembrosTab');
      break;
    case 'senhas':
      import('./configuracoes/SenhasTab');
      break;
    case 'metas':
      import('./configuracoes/MetasTab');
      break;
    case 'arquivos':
      import('./configuracoes/ArquivosTab');
      break;
    case 'sistema':
      import('./configuracoes/SistemaTab');
      break;
    default:
      break;
  }
};

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('membros');

  // Prefetch inicial de abas mais acessadas
  useEffect(() => {
    prefetchTab('senhas');
    prefetchTab('arquivos');
  }, []);

  // Prefetch baseado na aba ativa: pré-carrega a aba vizinha mais provável
  useEffect(() => {
    const order = ['membros', 'senhas', 'metas', 'arquivos', 'sistema'];
    const idx = order.indexOf(activeTab);
    if (idx !== -1) {
      const neighbor = order[idx + 1] ?? order[idx - 1];
      if (neighbor) prefetchTab(neighbor);
    }
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFuncao, setSelectedFuncao] = useState('Todas as funções');
  const [selectedRegional, setSelectedRegional] = useState('Todas as áreas');
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddFuncaoModal, setShowAddFuncaoModal] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [newFuncao, setNewFuncao] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [membros, setMembros] = useState(mockMembros);
  const [usuarios, setUsuarios] = useState(mockUsuarios);
  
  // Estados para aba Senhas
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showViewUserModal, setShowViewUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchUsuarios, setSearchUsuarios] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para aba Metas
  const [showNewMetaModal, setShowNewMetaModal] = useState(false);
  const [metas, setMetas] = useState<any[]>([]);
  const [newMeta, setNewMeta] = useState({
    nome: '',
    nomePersonalizado: '',
    quantidade: '',
    mes: [] as string[],
    ano: new Date().getFullYear().toString(),
    regionais: [] as string[]
  });
  const [editingMeta, setEditingMeta] = useState<any>(null);
  const [showEditMetaModal, setShowEditMetaModal] = useState(false);

  // Lista de regionais disponíveis
  const regionaisDisponiveis = [
    'Centro-Oeste',
    'MG/ES', 
    'Nordeste 1',
    'Nordeste 2',
    'Norte',
    'Rio de Janeiro',
    'São Paulo',
    'Sul',
    'Nacional',
    'Comercial'
  ];

  // Lista de meses
  const mesesDisponiveis = [
    { value: 'todo-ano', label: 'Todo o ano' },
    { value: '01', label: 'Janeiro' },
    { value: '02', label: 'Fevereiro' },
    { value: '03', label: 'Março' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Maio' },
    { value: '06', label: 'Junho' },
    { value: '07', label: 'Julho' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  // Filtrar membros baseado nos filtros ativos
  const filteredMembros = useMemo(() => {
    return membros.filter(membro => {
      const matchesSearch = membro.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFuncao = selectedFuncao === 'Todas as funções' || membro.funcao === selectedFuncao;
      const matchesRegional = selectedRegional === 'Todas as áreas' || membro.regional === selectedRegional;
      
      return matchesSearch && matchesFuncao && matchesRegional;
    });
  }, [membros, searchTerm, selectedFuncao, selectedRegional]);

  // Filtrar usuários baseado nos filtros ativos
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch = usuario.usuario.toLowerCase().includes(searchUsuarios.toLowerCase()) ||
                           usuario.email.toLowerCase().includes(searchUsuarios.toLowerCase());
      const matchesTipo = filterTipo === 'Todos' || usuario.tipo === filterTipo;
      const matchesStatus = filterStatus === 'Todos' || usuario.status === filterStatus;
      
      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [usuarios, searchUsuarios, filterTipo, filterStatus]);

  // Função para excluir membro
  const handleDeleteMember = (membro: any) => {
    setMemberToDelete(membro);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteMember = () => {
    if (memberToDelete) {
      setMembros(membros.filter(m => m.id !== memberToDelete.id));
      setShowDeleteConfirmModal(false);
      setMemberToDelete(null);
    }
  };

  // Função para resetar senha do usuário
  const handleResetPassword = () => {
    if (selectedUser && newPassword.trim()) {
      // Aqui você implementaria a lógica real de definir nova senha
      // Por enquanto, vamos simular o processo
      console.log(`Definindo nova senha para o usuário: ${selectedUser.usuario}`);
      
      // Atualizar a senha do usuário na lista
      setUsuarios(usuarios.map(user => 
        user.id === selectedUser.id 
          ? { ...user, senha: newPassword }
          : user
      ));
      
      // Fechar o modal e limpar estados
      setShowResetPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      setShowPassword(false);
      
      // Mostrar mensagem de sucesso
      alert(`Nova senha definida com sucesso para ${selectedUser.usuario}.`);
    } else {
      alert('Por favor, digite uma nova senha.');
    }
  };

  const renderMembrosTab = () => (
    <ErrorBoundary fallback={<div className="p-6 text-red-600">Falha ao carregar aba Membros.</div>}>
      <Suspense fallback={<div className="p-6 flex items-center gap-3 text-gray-500"><LoadingSpinner size="lg" color="gray" /><span>Carregando Membros...</span></div>}>
        <MembrosTabLazy
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedFuncao={selectedFuncao}
          setSelectedFuncao={setSelectedFuncao}
          selectedRegional={selectedRegional}
          setSelectedRegional={setSelectedRegional}
          funcoes={funcoes}
          regionais={regionais}
          filteredMembros={filteredMembros}
          setShowAddMemberModal={setShowAddMemberModal}
          setShowAddFuncaoModal={setShowAddFuncaoModal}
          setEditingMember={setEditingMember}
          handleDeleteMember={handleDeleteMember}
        />
      </Suspense>
    </ErrorBoundary>
  );

  const renderSenhasTab = () => (
    <ErrorBoundary fallback={<div className="p-6 text-red-600">Falha ao carregar aba Senhas.</div>}>
      <Suspense fallback={<div className="p-6 flex items-center gap-3 text-gray-500"><LoadingSpinner size="lg" color="gray" /><span>Carregando Senhas...</span></div>}>
        <SenhasTabLazy
          searchUsuarios={searchUsuarios}
          setSearchUsuarios={setSearchUsuarios}
          filterTipo={filterTipo}
          setFilterTipo={setFilterTipo}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filteredUsuarios={filteredUsuarios}
          setShowAddUserModal={setShowAddUserModal}
          setSelectedUser={setSelectedUser}
          setShowViewUserModal={setShowViewUserModal}
          setShowEditUserModal={setShowEditUserModal}
          setShowResetPasswordModal={setShowResetPasswordModal}
          setShowDeleteUserModal={setShowDeleteUserModal}
        />
      </Suspense>
    </ErrorBoundary>
  );

  const renderMetasTab = () => {
    return (
      <ErrorBoundary fallback={<div className="p-6 text-red-600">Falha ao carregar aba Metas.</div>}>
        <Suspense fallback={<div className="p-6 flex items-center gap-3 text-gray-500"><LoadingSpinner size="lg" color="gray" /><span>Carregando Metas...</span></div>}>
          <MetasTabLazy
            metas={metas}
            setMetas={setMetas}
            setShowNewMetaModal={setShowNewMetaModal}
            setEditingMeta={setEditingMeta}
            setNewMeta={setNewMeta}
            setShowEditMetaModal={setShowEditMetaModal}
            mesesDisponiveis={mesesDisponiveis}
            regionaisDisponiveis={regionaisDisponiveis}
          />
        </Suspense>
      </ErrorBoundary>
    );
  };

  const renderArquivosTab = () => (
    <ErrorBoundary fallback={<div className="p-6 text-red-600">Falha ao carregar aba Arquivos.</div>}>
      <Suspense fallback={<div className="p-6 flex items-center gap-3 text-gray-500"><LoadingSpinner size="lg" color="gray" /><span>Carregando Arquivos...</span></div>}>
        <ArquivosTabLazy />
      </Suspense>
    </ErrorBoundary>
  );

  const renderSistemaTab = () => (
    <ErrorBoundary fallback={<div className="p-6 text-red-600">Falha ao carregar aba Sistema.</div>}>
      <Suspense fallback={<div className="p-6 flex items-center gap-3 text-gray-500"><LoadingSpinner size="lg" color="gray" /><span>Carregando Sistema...</span></div>}>
        <SistemaTabLazy />
      </Suspense>
    </ErrorBoundary>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'membros':
        return renderMembrosTab();
      case 'senhas':
        return renderSenhasTab();
      case 'metas':
        return renderMetasTab();
      case 'arquivos':
        return renderArquivosTab();
      case 'sistema':
        return renderSistemaTab();
      default:
        return renderMembrosTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600">Painel administrativo do sistema</p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    onMouseEnter={() => prefetchTab(tab.id)}
                    onFocus={() => prefetchTab(tab.id)}
                    className={`
                      flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {renderTabContent()}
        </div>
      </div>

      {/* Modal para Adicionar Membro */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Adicionar Novo Membro</h3>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome completo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    if (e.target.value === 'Outro') {
                      setShowAddFuncaoModal(true);
                    }
                  }}
                >
                  <option value="">Selecione uma função</option>
                  {funcoes.map(funcao => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Selecione uma área</option>
                  {regionais.slice(1).map(regional => (
                    <option key={regional} value={regional}>{regional}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowAddMemberModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Adicionar Membro
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Nova Função */}
      {showAddFuncaoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Criar Nova Função</h3>
              <button 
                onClick={() => setShowAddFuncaoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Função</label>
                <input
                  type="text"
                  value={newFuncao}
                  onChange={(e) => setNewFuncao(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome da nova função"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowAddFuncaoModal(false);
                    setNewFuncao('');
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    if (newFuncao.trim()) {
                      // Aqui você adicionaria a nova função à lista
                      setShowAddFuncaoModal(false);
                      setNewFuncao('');
                    }
                  }}
                >
                  Criar Função
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Membro */}
      {editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar Membro</h3>
              <button 
                onClick={() => setEditingMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  defaultValue={editingMember.nome}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select 
                  defaultValue={editingMember.funcao}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => {
                    if (e.target.value === 'Outro') {
                      setShowAddFuncaoModal(true);
                    }
                  }}
                >
                  {funcoes.map(funcao => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select 
                  defaultValue={editingMember.regional}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {regionais.slice(1).map(regional => (
                    <option key={regional} value={regional}>{regional}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setEditingMember(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Excluir Membro */}
      {showDeleteConfirmModal && memberToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
              <button 
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setMemberToDelete(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Tem certeza que deseja excluir o membro <strong>{memberToDelete.nome}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não pode ser desfeita.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setMemberToDelete(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmDeleteMember}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Adicionar Usuário */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Criar Novo Usuário</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome do usuário"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Nacional</option>
                  <option>Regional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Usuário</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setShowAddUserModal(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Criar Usuário
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Visualizar Usuário */}
      {showViewUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detalhes do Usuário</h3>
              <button 
                onClick={() => {
                  setShowViewUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <p className="text-gray-900 mt-1">{selectedUser.usuario}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-gray-900 mt-1">{selectedUser.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Tipo</label>
                <p className="text-gray-900 mt-1">{selectedUser.tipo}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Permissão</label>
                <p className="text-gray-900 mt-1">{selectedUser.permissao}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Regional</label>
                <p className="text-gray-900 mt-1">{selectedUser.regional}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900 mt-1">{selectedUser.status}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-gray-900 font-mono">
                    {showPassword ? (selectedUser.senha || '123456') : '••••••••'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600"
                    title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Criado em</label>
                <p className="text-gray-900 mt-1">{selectedUser.criadoEm}</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <Button 
                onClick={() => {
                  setShowViewUserModal(false);
                  setSelectedUser(null);
                  setShowPassword(false);
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Usuário */}
      {showEditUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Editar Usuário</h3>
              <button 
                onClick={() => {
                  setShowEditUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário</label>
                <input
                  type="text"
                  defaultValue={selectedUser.usuario}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  defaultValue={selectedUser.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  defaultValue={selectedUser.tipo}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Nacional</option>
                  <option>Regional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                <select 
                  defaultValue={selectedUser.permissao}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Super Admin</option>
                  <option>Admin</option>
                  <option>Usuário</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    defaultValue={selectedUser.senha || '123456'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    placeholder="Digite a senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowEditUserModal(false);
                    setSelectedUser(null);
                    setShowPassword(false);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Resetar Senha */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-orange-600">Definir Nova Senha</h3>
              <button 
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setShowPassword(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                Definir nova senha para o usuário <strong>{selectedUser.usuario}</strong>:
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mt-3">
                Você deverá enviar esta senha para o usuário através dos canais apropriados.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                  setShowPassword(false);
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-orange-600 hover:bg-orange-700"
                onClick={handleResetPassword}
              >
                Definir Senha
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Excluir Usuário */}
      {showDeleteUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-600">Confirmar Exclusão</h3>
              <button 
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Tem certeza que deseja excluir o usuário <strong>{selectedUser.usuario}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Esta ação não pode ser desfeita e o usuário perderá acesso ao sistema.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowDeleteUserModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setUsuarios(usuarios.filter(u => u.id !== selectedUser.id));
                  setShowDeleteUserModal(false);
                  setSelectedUser(null);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Meta */}
      {showNewMetaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Nova Meta</h3>
              <button 
                onClick={() => {
                  setShowNewMetaModal(false);
                  setNewMeta({
                    nome: '',
                    nomePersonalizado: '',
                    quantidade: '',
                    mes: [],
                    ano: new Date().getFullYear().toString(),
                    regionais: []
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Nome da Meta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Meta
                </label>
                <select
                  value={newMeta.nome}
                  onChange={(e) => setNewMeta({...newMeta, nome: e.target.value, nomePersonalizado: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione o nome</option>
                  <option value="Ong Mara">Ong Mara</option>
                  <option value="Liga Mara Formadas">Liga Mara Formadas</option>
                  <option value="Ong Decolagem">Ong Decolagem</option>
                  <option value="Liga Decolagem">Liga Decolagem</option>
                  <option value="Formação Liga">Formação Liga</option>
                  <option value="Famílias atendidas">Famílias atendidas</option>
                  <option value="Imersão Ongs">Imersão Ongs</option>
                  <option value="Encontro líder Maras">Encontro líder Maras</option>
                  <option value="Processo seletivo">Processo seletivo</option>
                  <option value="Retenção">Retenção</option>
                  <option value="Inadimplência">Inadimplência</option>
                  <option value="NPS">NPS</option>
                  <option value="Outra">Outra</option>
                </select>
              </div>

              {/* Campo Meta Personalizada */}
              {newMeta.nome === 'Outra' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Meta Personalizada
                  </label>
                  <input
                    type="text"
                    value={newMeta.nomePersonalizado}
                    onChange={(e) => setNewMeta({...newMeta, nomePersonalizado: e.target.value})}
                    placeholder="Digite o nome da meta personalizada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Quantidade/Porcentagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newMeta.nome === 'Retenção' ? 'Porcentagem (%)' : 'Quantidade'}
                </label>
                <input
                  type="number"
                  value={newMeta.quantidade}
                  onChange={(e) => setNewMeta({...newMeta, quantidade: e.target.value})}
                  placeholder={newMeta.nome === 'Retenção' ? 'Ex: 85' : 'Ex: 300'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {newMeta.nome === 'Retenção' && (
                  <p className="text-xs text-gray-500 mt-1">Digite apenas o número (ex: 85 para 85%)</p>
                )}
              </div>

              {/* Mês e Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {mesesDisponiveis.map(mes => (
                        <label key={mes.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={mes.value === 'todo-ano' ? 
                              newMeta.mes.includes('todo-ano') : 
                              newMeta.mes.includes(mes.value)
                            }
                            onChange={(e) => {
                              if (mes.value === 'todo-ano') {
                                if (e.target.checked) {
                                  setNewMeta({...newMeta, mes: ['todo-ano']});
                                } else {
                                  setNewMeta({...newMeta, mes: []});
                                }
                              } else {
                                if (e.target.checked) {
                                  const novosMeses = newMeta.mes.filter(m => m !== 'todo-ano');
                                  setNewMeta({...newMeta, mes: [...novosMeses, mes.value]});
                                } else {
                                  setNewMeta({...newMeta, mes: newMeta.mes.filter(m => m !== mes.value)});
                                }
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{mes.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={newMeta.ano}
                    onChange={(e) => setNewMeta({...newMeta, ano: e.target.value})}
                    placeholder="2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Aplicar Meta para */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aplicar Meta para:
                </label>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMeta.regionais.length === regionaisDisponiveis.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewMeta({...newMeta, regionais: [...regionaisDisponiveis]});
                          } else {
                            setNewMeta({...newMeta, regionais: []});
                          }
                        }}
                        className="mr-2 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-sm font-medium">Todas</span>
                    </label>
                    {regionaisDisponiveis.map(regional => (
                      <label key={regional} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newMeta.regionais.includes(regional)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMeta({...newMeta, regionais: [...newMeta.regionais, regional]});
                            } else {
                              setNewMeta({...newMeta, regionais: newMeta.regionais.filter(r => r !== regional)});
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{regional}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowNewMetaModal(false);
                  setNewMeta({
                    nome: '',
                    nomePersonalizado: '',
                    quantidade: '',
                    mes: [],
                    ano: new Date().getFullYear().toString(),
                    regionais: []
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  const nomeValido = newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome;
                  if (nomeValido && newMeta.quantidade && newMeta.mes.length > 0 && newMeta.ano && newMeta.regionais.length > 0) {
                    const novaMeta = {
                      ...newMeta,
                      nome: nomeValido,
                      id: Date.now() // ID simples para identificação
                    };
                    setMetas([...metas, novaMeta]);
                    setShowNewMetaModal(false);
                    setNewMeta({
                      nome: '',
                      nomePersonalizado: '',
                      quantidade: '',
                      mes: [],
                      ano: new Date().getFullYear().toString(),
                      regionais: []
                    });
                  }
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white"
                disabled={
                  !(newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome) || 
                  !newMeta.quantidade || 
                  newMeta.mes.length === 0 || 
                  !newMeta.ano || 
                  newMeta.regionais.length === 0
                }
              >
                Salvar Meta
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Meta */}
      {showEditMetaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar Meta</h3>
              <button 
                onClick={() => {
                  setShowEditMetaModal(false);
                  setEditingMeta(null);
                  setNewMeta({
                    nome: '',
                    nomePersonalizado: '',
                    quantidade: '',
                    mes: [],
                    ano: new Date().getFullYear().toString(),
                    regionais: []
                  });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Nome da Meta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Meta
                </label>
                <select
                  value={newMeta.nome}
                  onChange={(e) => setNewMeta({...newMeta, nome: e.target.value, nomePersonalizado: ''})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione o nome</option>
                  <option value="Ong Mara">Ong Mara</option>
                  <option value="Liga Mara Formadas">Liga Mara Formadas</option>
                  <option value="Ong Decolagem">Ong Decolagem</option>
                  <option value="Liga Decolagem">Liga Decolagem</option>
                  <option value="Formação Liga">Formação Liga</option>
                  <option value="Famílias atendidas">Famílias atendidas</option>
                  <option value="Imersão Ongs">Imersão Ongs</option>
                  <option value="Encontro líder Maras">Encontro líder Maras</option>
                  <option value="Processo seletivo">Processo seletivo</option>
                  <option value="Retenção">Retenção</option>
                  <option value="Inadimplência">Inadimplência</option>
                  <option value="NPS">NPS</option>
                  <option value="Outra">Outra</option>
                </select>
              </div>

              {/* Campo Meta Personalizada */}
              {newMeta.nome === 'Outra' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Meta Personalizada
                  </label>
                  <input
                    type="text"
                    value={newMeta.nomePersonalizado}
                    onChange={(e) => setNewMeta({...newMeta, nomePersonalizado: e.target.value})}
                    placeholder="Digite o nome da meta personalizada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Quantidade/Porcentagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newMeta.nome === 'Retenção' ? 'Porcentagem (%)' : 'Quantidade'}
                </label>
                <input
                  type="number"
                  value={newMeta.quantidade}
                  onChange={(e) => setNewMeta({...newMeta, quantidade: e.target.value})}
                  placeholder={newMeta.nome === 'Retenção' ? 'Ex: 85' : 'Ex: 300'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {newMeta.nome === 'Retenção' && (
                  <p className="text-xs text-gray-500 mt-1">Digite apenas o número (ex: 85 para 85%)</p>
                )}
              </div>

              {/* Mês e Ano */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mês
                  </label>
                  <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <div className="space-y-2">
                      {mesesDisponiveis.map(mes => (
                        <label key={mes.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={mes.value === 'todo-ano' ? 
                              newMeta.mes.includes('todo-ano') : 
                              newMeta.mes.includes(mes.value)
                            }
                            onChange={(e) => {
                              if (mes.value === 'todo-ano') {
                                if (e.target.checked) {
                                  setNewMeta({...newMeta, mes: ['todo-ano']});
                                } else {
                                  setNewMeta({...newMeta, mes: []});
                                }
                              } else {
                                if (e.target.checked) {
                                  const novosMeses = newMeta.mes.filter(m => m !== 'todo-ano');
                                  setNewMeta({...newMeta, mes: [...novosMeses, mes.value]});
                                } else {
                                  setNewMeta({...newMeta, mes: newMeta.mes.filter(m => m !== mes.value)});
                                }
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{mes.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <input
                    type="number"
                    value={newMeta.ano}
                    onChange={(e) => setNewMeta({...newMeta, ano: e.target.value})}
                    placeholder="2025"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Aplicar Meta para */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aplicar Meta para:
                </label>
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newMeta.regionais.length === regionaisDisponiveis.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewMeta({...newMeta, regionais: [...regionaisDisponiveis]});
                          } else {
                            setNewMeta({...newMeta, regionais: []});
                          }
                        }}
                        className="mr-2 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-sm font-medium">Todas</span>
                    </label>
                    {regionaisDisponiveis.map(regional => (
                      <label key={regional} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newMeta.regionais.includes(regional)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMeta({...newMeta, regionais: [...newMeta.regionais, regional]});
                            } else {
                              setNewMeta({...newMeta, regionais: newMeta.regionais.filter(r => r !== regional)});
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{regional}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowEditMetaModal(false);
                  setEditingMeta(null);
                  setNewMeta({
                    nome: '',
                    nomePersonalizado: '',
                    quantidade: '',
                    mes: [],
                    ano: new Date().getFullYear().toString(),
                    regionais: []
                  });
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  const nomeValido = newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome;
                  if (nomeValido && newMeta.quantidade && newMeta.mes.length > 0 && newMeta.ano && newMeta.regionais.length > 0) {
                    const metasAtualizadas = metas.map(meta => 
                      meta.id === editingMeta.id ? {...newMeta, nome: nomeValido, id: editingMeta.id} : meta
                    );
                    setMetas(metasAtualizadas);
                    setShowEditMetaModal(false);
                    setEditingMeta(null);
                    setNewMeta({
                      nome: '',
                      nomePersonalizado: '',
                      quantidade: '',
                      mes: [],
                      ano: new Date().getFullYear().toString(),
                      regionais: []
                    });
                  }
                }}
                className="bg-pink-500 hover:bg-pink-600 text-white"
                disabled={
                  !(newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome) || 
                  !newMeta.quantidade || 
                  newMeta.mes.length === 0 || 
                  !newMeta.ano || 
                  newMeta.regionais.length === 0
                }
              >
                Salvar Alterações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}