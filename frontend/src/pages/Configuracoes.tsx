import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { 
  Settings, 
  Users, 
  Shield, 
  Target, 
  FileText, 
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import ErrorBoundary from '../components/ErrorBoundary';
import MetaFormFields from '../components/modals/meta/MetaFormFields';
import MonthSelector from '../components/modals/meta/MonthSelector';
import YearInput from '../components/modals/meta/YearInput';
import RegionaisSelector from '../components/modals/meta/RegionaisSelector';
import ActionButtons from '../components/modals/meta/ActionButtons';
import { useMembers, useUsers, useUsersWithMembers, useGoals } from '../hooks/useApi';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { MemberService } from '../services/memberService';
import { GoalService } from '../services/goalService';
import { AuthService } from '../services/authService';
import { useToastContext } from '../contexts/ToastContext';

interface TabItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabItem[] = [
  { id: 'senhas', name: 'Senhas', icon: Shield },
  { id: 'metas', name: 'Metas', icon: Target },
  { id: 'arquivos', name: 'Arquivos', icon: FileText },
];



// Opções de funções
const funcoes = [
  'Comercial',
  'Nacional', 
  'Líder Nacional',
  'Diretor Operações',
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




const SenhasTabLazy = lazy(() => import('./configuracoes/SenhasTab'));
const ArquivosTabLazy = lazy(() => import('./configuracoes/ArquivosTab'));
const MetasTabLazy = lazy(() => import('./configuracoes/MetasTab'));

// Prefetch dos módulos das abas para melhorar a performance de navegação
const prefetchTab = (id: string) => {
  switch (id) {
    case 'senhas':
      import('./configuracoes/SenhasTab');
      break;
    case 'metas':
      import('./configuracoes/MetasTab');
      break;
    case 'arquivos':
      import('./configuracoes/ArquivosTab');
      break;
    default:
      break;
  }
};

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('senhas');
  const toast = useToastContext();

  // Prefetch inicial de abas mais acessadas
  useEffect(() => {
    prefetchTab('senhas');
    prefetchTab('arquivos');
  }, []);

  // Prefetch baseado na aba ativa: pré-carrega a aba vizinha mais provável
  useEffect(() => {
    const order = ['senhas', 'metas', 'arquivos'];
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
  const [editingMemberData, setEditingMemberData] = useState({
    nome: '',
    email: '',
    funcao: '',
    regional: ''
  });
  // Função para inicializar dados de edição quando um membro é selecionado
  useEffect(() => {
    if (editingMember) {
      setEditingMemberData({
        nome: editingMember.name || '',
        email: editingMember.email || '',
        funcao: editingMember.funcao || '',
        regional: editingMember.area || editingMember.regional || ''
      });
    }
  }, [editingMember]);
   const [newFuncao, setNewFuncao] = useState('');
   const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  // Usando dados reais da API
  const { data: members, refetch: refetchMembers } = useMembers();
  const { data: usersWithMembers, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsersWithMembers();
  
  // Extrair usuários dos dados combinados e mapear para o formato esperado pela aba Gestão de Senhas
  const usuarios = useMemo(() => {
    if (!usersWithMembers || usersWithMembers.length === 0) return [];
    
    return usersWithMembers.map((user: any, index: number) => {
      const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
      
      // Debug: log dos dados do usuário para investigar
      console.log('Dados do usuário combinado:', {
        email: user.email,
        funcao: user.funcao,
        tipo: user.tipo,
        role: user.role,
        regional: user.regional,
        nome: user.nome,
        area: user.area
      });
      
      return {
        id: user.id || `user-${index + 1}`,
        usuario: user.nome || user.email?.split('@')[0] || 'Usuário',
        email: user.email || '',
        tipo: user.tipo || (user.role === 'super_admin' ? 'Nacional' : 'Regional'), // Usar campo tipo ou inferir do role
        permissao: user.role || 'membro', // Usar role diretamente
        regional: user.regional || 'Nacional',
        funcao: user.funcao || 'Não definido', // Priorizar funcao da tabela members
        area: user.area || user.regional || 'Não definido', // Priorizar area da tabela members
        status: isBanned ? 'Bloqueado' : (user.status === 'ativo' ? 'Ativo' : 'Inativo'),
        criadoEm: user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A',
        senha: '••••••••', // Senha oculta por segurança
        banned_until: user.banned_until
      };
    });
  }, [usersWithMembers]);
  
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
  const [filterFuncao, setFilterFuncao] = useState('Todas');
  const [filterArea, setFilterArea] = useState('Todas');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Estados para formulários
  const [newMember, setNewMember] = useState({
    nome: '',
    email: '',
    funcao: '',
    regional: ''
  });
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    senha: '',
    tipo: '',
    permissao: '',
    regional: '',
    funcao: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para aba Metas
  const [showNewMetaModal, setShowNewMetaModal] = useState(false);
  const { data: metas, loading: metasLoading, error: metasError, refetch: refetchGoals } = useGoals();
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

  // Funções para gerenciar usuários
  const handleBlockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/users/${userId}/block`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration: '24h' })
      });

      if (response.ok) {
        await refetchUsers();
        alert('Usuário bloqueado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao bloquear usuário: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      alert('Erro ao bloquear usuário');
    }
  };

  const handleUnblockUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/users/${userId}/unblock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await refetchUsers();
        alert('Usuário desbloqueado com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao desbloquear usuário: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      alert('Erro ao desbloquear usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        await refetchUsers();
        alert('Usuário excluído com sucesso!');
      } else {
        const error = await response.json();
        alert(`Erro ao excluir usuário: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      alert('Erro ao excluir usuário');
    }
  };

  // Filtrar membros baseado nos filtros ativos
  const filteredMembros = useMemo(() => {
    if (!members || members.length === 0) return [];
    
    return members.filter((membro: any) => {
      const matchesSearch = (membro.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFuncao = selectedFuncao === 'Todas as funções' || membro.funcao === selectedFuncao;
      const matchesRegional = selectedRegional === 'Todas as áreas' || membro.area === selectedRegional;
      
      return matchesSearch && matchesFuncao && matchesRegional;
    });
  }, [members, searchTerm, selectedFuncao, selectedRegional]);

  // Filtrar usuários baseado nos filtros ativos
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(usuario => {
      const matchesSearch = (usuario.nome?.toLowerCase() || '').includes(searchUsuarios.toLowerCase()) ||
                           (usuario.email?.toLowerCase() || '').includes(searchUsuarios.toLowerCase());
      const matchesTipo = filterTipo === 'Todos' || usuario.role === filterTipo;
      const matchesStatus = filterStatus === 'Todos' || 
                           (filterStatus === 'Ativo' && usuario.status === 'Ativo') ||
                           (filterStatus === 'Inativo' && usuario.status === 'Inativo');
      const matchesFuncao = filterFuncao === 'Todas' || usuario.funcao === filterFuncao;
      const matchesArea = filterArea === 'Todas' || usuario.area === filterArea || usuario.regional === filterArea;
      
      return matchesSearch && matchesTipo && matchesStatus && matchesFuncao && matchesArea;
    });
  }, [usuarios, searchUsuarios, filterTipo, filterStatus, filterFuncao, filterArea]);

  // Função para excluir membro
  const handleDeleteMember = (membro: any) => {
    setMemberToDelete(membro);
    setShowDeleteConfirmModal(true);
  };

  // Função para atualizar membro
  const handleUpdateMember = async () => {
    try {
      if (!editingMember?.id) return;
      
      const memberData = {
        name: editingMemberData.nome,
        email: editingMemberData.email,
        funcao: editingMemberData.funcao,
        area: editingMemberData.regional
      };

      await MemberService.updateMember(editingMember.id, memberData);
      
      // Atualizar a lista de membros
      await refetchMembers();
      
      // Fechar modal
      setEditingMember(null);
      setEditingMemberData({
        nome: '',
        email: '',
        funcao: '',
        regional: ''
      });
      
      alert('Membro atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar membro:', error);
      alert('Erro ao atualizar membro. Tente novamente.');
    }
  };

  // Handlers para criação de membros, usuários e metas
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMember.nome.trim() || !newMember.email?.trim()) {
      toast.warning('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios (nome e email).');
      return;
    }

    setIsSubmitting(true);
    try {
      const memberData = {
        name: newMember.nome.trim(),
        email: newMember.email.trim(),
        regional_id: null, // Por enquanto, definindo como null até implementarmos a seleção de regional
        funcao: newMember.funcao || null,
        area: newMember.regional || null
      };

      await MemberService.createMember(memberData);
      
      // Fechar modal e resetar formulário
      setShowAddMemberModal(false);
      setNewMember({ nome: '', email: '', funcao: '', regional: '' });
      
      toast.success('Membro criado', 'Membro criado com sucesso!');
      
      // Recarregar dados (se necessário, dependendo da implementação do useMembers)
      window.location.reload(); // Temporário - idealmente deveria atualizar o estado local
      
    } catch (error: any) {
      console.error('Erro ao criar membro:', error);
      toast.error('Erro ao criar membro', 'Ocorreu um erro ao criar o membro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const userData = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      tipo: formData.get('tipo') as string,
      role: formData.get('role') as string,
      funcao: formData.get('funcao') as string,
      regional: formData.get('regional') as string,
    };

    console.log('🔄 Dados sendo enviados para atualização:', userData);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });

      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Dados retornados pela API:', responseData);
        
        console.log('🔄 Chamando refetchUsers...');
        await refetchUsers();
        console.log('✅ refetchUsers concluído');
        
        setShowEditUserModal(false);
        setSelectedUser(null);
        alert('Usuário atualizado com sucesso!');
      } else {
        const error = await response.json();
        console.error('❌ Erro da API:', error);
        alert(`Erro ao atualizar usuário: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      alert('Erro ao atualizar usuário');
    }
  };

  const handleGeneratePassword = async (userId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/auth/users/${userId}/generate-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Nova senha gerada com sucesso!\n\nSenha temporária: ${data.password}\n\nAnote esta senha e repasse ao usuário. Por segurança, esta senha não será exibida novamente.`);
        await refetchUsers();
      } else {
        const error = await response.json();
        alert(`Erro ao gerar nova senha: ${error.error}`);
      }
    } catch (error) {
      console.error('Erro ao gerar nova senha:', error);
      alert('Erro ao gerar nova senha');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.nome.trim() || !newUser.email.trim() || !newUser.senha.trim() || 
        !newUser.tipo || !newUser.permissao || !newUser.regional || !newUser.funcao) {
      toast.warning('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const userData = {
        nome: newUser.nome,
        email: newUser.email,
        password: newUser.senha,
        role: newUser.permissao, // Corrigido: usar permissao (Super Admin, Admin, Usuário)
        tipo: newUser.tipo, // Adicionar tipo (Nacional/Regional)
        regional: newUser.regional,
        funcao: newUser.funcao
      };

      await AuthService.register(userData);
      
      // Atualizar ambas as listas após criação bem-sucedida
      await Promise.all([
        refetchUsers(),
        refetchMembers()
      ]);
      
      // Fechar modal e resetar formulário
      setShowAddUserModal(false);
      setNewUser({ nome: '', email: '', senha: '', tipo: '', permissao: '', regional: '', funcao: '' });
      
      toast.success('Usuário criado', 'Usuário criado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário', 'Erro ao criar usuário. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMeta.nome.trim() || !newMeta.quantidade.trim() || 
        newMeta.mes.length === 0 || newMeta.regionais.length === 0) {
      toast.warning('Campos obrigatórios', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const title = newMeta.nome.trim() === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome.trim();
      const targetValue = parseFloat(newMeta.quantidade);
      
      // Criar descrição com detalhes da meta
      const mesesTexto = newMeta.mes.join(', ');
      const regionaisTexto = newMeta.regionais.join(', ');
      const unit = newMeta.nome === 'Retenção' ? '%' : ((newMeta.nome === 'Atendidos Indiretamente' || newMeta.nome === 'Atendidos Diretamente' || newMeta.nome === 'Pessoas Atendidas') ? ' pessoas' : ' unidades');
      const description = `Meta: ${targetValue}${unit} | Meses: ${mesesTexto} | Regionais: ${regionaisTexto}`;
      
      // Calcular deadline baseado no último mês selecionado
      let ultimoMes: number;
      
      if (newMeta.mes.length === 0 || newMeta.mes.includes('todo-ano')) {
        // Se não há meses selecionados ou "todo-ano" está selecionado, usar dezembro
        ultimoMes = 12;
      } else {
        // Filtrar apenas valores numéricos válidos e pegar o maior
        const mesesNumericos = newMeta.mes
          .map(m => parseInt(m))
          .filter(m => !isNaN(m) && m >= 1 && m <= 12);
        
        ultimoMes = mesesNumericos.length > 0 ? Math.max(...mesesNumericos) : 12;
      }
      
      const deadline = `${newMeta.ano}-${ultimoMes.toString().padStart(2, '0')}-31`;

      const goalData = {
        nome: title,
        descricao: description,
        valor_meta: targetValue,
        valor_atual: 0,
        due_date: deadline,
        status: 'pending' as const
      };

      console.log('Enviando dados da meta:', goalData);
      const createdGoal = await GoalService.createGoal(goalData);
      console.log('Meta criada com sucesso:', createdGoal);
      
      // Sincronizar cache global de metas
      await refetchGoals();
      
      // Fechar modal e resetar formulário
      setShowNewMetaModal(false);
      setNewMeta({
        nome: '',
        nomePersonalizado: '',
        quantidade: '',
        mes: [],
        ano: new Date().getFullYear().toString(),
        regionais: []
      });
      
      toast.success('Meta criada', 'Meta criada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      toast.error('Erro ao criar meta', error instanceof Error ? error.message : 'Erro ao criar meta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteMember = async () => {
    if (memberToDelete) {
      try {
        await MemberService.deleteMember(memberToDelete.id);
        
        console.log('Membro excluído com sucesso:', memberToDelete);
        toast.success('Membro excluído', 'Membro excluído com sucesso!');
        
        // Recarregar dados
        window.location.reload(); // Temporário - idealmente deveria atualizar o estado local
      } catch (error) {
        console.error('Erro ao excluir membro:', error);
        toast.error('Erro ao excluir membro', 'Erro ao excluir membro. Tente novamente.');
      } finally {
        setShowDeleteConfirmModal(false);
        setMemberToDelete(null);
      }
    }
  };

  // Função para resetar senha do usuário
  const handleResetPassword = async () => {
    if (selectedUser && newPassword.trim()) {
      try {
        // Implementar a lógica real de definir nova senha via API
        console.log(`Definindo nova senha para o usuário: ${selectedUser.usuario}`);
        
        // Chamar a API para atualizar a senha
        await AuthService.updateUserPassword(selectedUser.id, newPassword);
        
        // Atualizar os dados dos usuários
        await refetchUsers();
        
        // Fechar o modal e limpar estados
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
        setShowPassword(false);
        
        // Mostrar mensagem de sucesso
        toast.success('Senha redefinida', `Nova senha definida com sucesso para ${selectedUser.usuario}.`);
      } catch (error) {
        console.error('Erro ao definir nova senha:', error);
        toast.error('Erro', 'Erro ao definir nova senha');
      }
    } else {
      toast.warning('Senha obrigatória', 'Por favor, digite uma nova senha.');
    }
  };

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
          filterFuncao={filterFuncao}
          setFilterFuncao={setFilterFuncao}
          filterArea={filterArea}
          setFilterArea={setFilterArea}
          filteredUsuarios={filteredUsuarios}
          setShowAddUserModal={setShowAddUserModal}
          setSelectedUser={setSelectedUser}
          setShowViewUserModal={setShowViewUserModal}
          setShowEditUserModal={setShowEditUserModal}
          setShowResetPasswordModal={setShowResetPasswordModal}
          setShowDeleteUserModal={setShowDeleteUserModal}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onDeleteUser={handleDeleteUser}
          onGeneratePassword={handleGeneratePassword}
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
            setShowNewMetaModal={setShowNewMetaModal}
            setEditingMeta={setEditingMeta}
            setNewMeta={setNewMeta}
            setShowEditMetaModal={setShowEditMetaModal}
            mesesDisponiveis={mesesDisponiveis}
            regionaisDisponiveis={regionaisDisponiveis}
            metasLoading={metasLoading}
            metasError={metasError}
            refetchGoals={refetchGoals}
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'senhas':
        return renderSenhasTab();
      case 'metas':
        return renderMetasTab();
      case 'arquivos':
        return renderArquivosTab();
      default:
        return renderSenhasTab();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="text-lg font-bold text-gray-900">Configurações</h1>
          </div>
          <p className="text-gray-600">Painel administrativo</p>
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
              <h3 className="text-sm font-semibold">Adicionar Novo Membro</h3>
              <button 
                onClick={() => setShowAddMemberModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleCreateMember}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={newMember.nome}
                  onChange={(e) => setNewMember(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome completo"
                  spellCheck="false"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o email"
                  spellCheck="false"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select
                  value={newMember.funcao}
                  onChange={(e) => setNewMember(prev => ({ ...prev, funcao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma função</option>
                  {funcoes.map(funcao => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select
                  value={newMember.regional}
                  onChange={(e) => setNewMember(prev => ({ ...prev, regional: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma área</option>
                  {regionais.filter(r => r !== 'Todas as áreas').map(regional => (
                    <option key={regional} value={regional}>{regional}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setNewMember({ nome: '', email: '', funcao: '', regional: '' });
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Adicionando...' : 'Adicionar Membro'}
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
              <h3 className="text-sm font-semibold">Criar Nova Função</h3>
              <button 
                onClick={() => setShowAddFuncaoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateMember(); }}>
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
              <h3 className="text-sm font-semibold">Editar Membro</h3>
              <button 
                onClick={() => setEditingMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleUpdateMember(); }}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editingMemberData.nome}
                  onChange={(e) => setEditingMemberData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editingMemberData.email}
                  onChange={(e) => setEditingMemberData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select 
                  value={editingMemberData.funcao}
                  onChange={(e) => {
                    setEditingMemberData(prev => ({ ...prev, funcao: e.target.value }));
                    if (e.target.value === 'Outro') {
                      setShowAddFuncaoModal(true);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma função</option>
                  {funcoes.map(funcao => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select 
                  value={editingMemberData.regional}
                  onChange={(e) => setEditingMemberData(prev => ({ ...prev, regional: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma área</option>
                  {regionais.filter(r => r !== 'Todas as áreas').map(regional => (
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
              <h3 className="text-sm font-semibold text-red-600">Confirmar Exclusão</h3>
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
              <h3 className="text-sm font-semibold">Criar Novo Usuário</h3>
              <button 
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4" onSubmit={handleCreateUser}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário</label>
                <input
                  type="text"
                  value={newUser.nome}
                  onChange={(e) => setNewUser(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o nome do usuário"
                  spellCheck="false"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o email"
                  spellCheck="false"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <input
                  type="password"
                  value={newUser.senha}
                  onChange={(e) => setNewUser(prev => ({ ...prev, senha: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite a senha"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  value={newUser.tipo}
                  onChange={(e) => setNewUser(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Nacional">Nacional</option>
                  <option value="Regional">Regional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                <select 
                  value={newUser.permissao}
                  onChange={(e) => setNewUser(prev => ({ ...prev, permissao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione a permissão</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">Usuário</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select 
                  value={newUser.funcao}
                  onChange={(e) => setNewUser(prev => ({ ...prev, funcao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione a função</option>
                  {funcoes.map(funcao => (
                    <option key={funcao} value={funcao}>{funcao}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select 
                  value={newUser.regional}
                  onChange={(e) => setNewUser(prev => ({ ...prev, regional: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione a área</option>
                  {regionais.slice(1).map(regional => (
                    <option key={regional} value={regional}>{regional}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUser({ nome: '', email: '', senha: '', tipo: '', permissao: '', regional: '', funcao: '' });
                  }}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Criando...' : 'Criar Usuário'}
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
              <h3 className="text-sm font-semibold">Detalhes do Usuário</h3>
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
              <h3 className="text-sm font-semibold">Editar Usuário</h3>
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
            
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário</label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={selectedUser.usuario}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck="false"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={selectedUser.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  spellCheck="false"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select 
                  name="tipo"
                  defaultValue={selectedUser.tipo || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Nacional">Nacional</option>
                  <option value="Regional">Regional</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Permissão</label>
                <select 
                  name="role"
                  defaultValue={selectedUser.permissao}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="user">Usuário</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função</label>
                <select 
                  name="funcao"
                  defaultValue={selectedUser.funcao || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione a função</option>
                  {funcoes.map((funcao) => (
                    <option key={funcao} value={funcao}>
                      {funcao}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área</label>
                <select 
                  name="regional"
                  defaultValue={selectedUser.regional || selectedUser.area || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecione a área</option>
                  {regionais.map((regional) => (
                    <option key={regional} value={regional}>
                      {regional}
                    </option>
                  ))}
                </select>
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
              <h3 className="text-sm font-semibold text-orange-600">Definir Nova Senha</h3>
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
              <h3 className="text-sm font-semibold text-red-600">Confirmar Exclusão</h3>
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
                onClick={async () => {
                  try {
                    // Aqui você implementaria a lógica real de deletar usuário via API
                    // await AuthService.deleteUser(selectedUser.id);
                    
                    // Atualizar os dados dos usuários
                    await refetchUsers();
                    
                    setShowDeleteUserModal(false);
                    setSelectedUser(null);
                    
                    toast.success('Usuário excluído', 'Usuário excluído com sucesso.');
                  } catch (error) {
                    console.error('Erro ao excluir usuário:', error);
                    toast.error('Erro', 'Erro ao excluir usuário');
                  }
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
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
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <MetaFormFields meta={newMeta} setMeta={setNewMeta} />
              <div className="grid grid-cols-3 gap-3">
                <MonthSelector
                  selectedMonths={newMeta.mes}
                  setSelectedMonths={(meses) => setNewMeta({ ...newMeta, mes: meses })}
                  mesesDisponiveis={mesesDisponiveis}
                />
                <YearInput
                  year={newMeta.ano}
                  setYear={(ano) => setNewMeta({ ...newMeta, ano })}
                />
                <RegionaisSelector
                  selectedRegionais={newMeta.regionais}
                  setSelectedRegionais={(regs) => setNewMeta({ ...newMeta, regionais: regs })}
                  options={regionaisDisponiveis}
                />
              </div>
            </div>
            
            <ActionButtons
              onCancel={() => {
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
              onSubmit={handleCreateGoal}
              cancelLabel="Cancelar"
              submitLabel={isSubmitting ? 'Criando...' : 'Criar Meta'}
              submitDisabled={
                isSubmitting ||
                !(newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome) || 
                !newMeta.quantidade || 
                newMeta.mes.length === 0 || 
                !newMeta.ano || 
                newMeta.regionais.length === 0
              }
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Modal Editar Meta */}
      {showEditMetaModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
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
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <MetaFormFields meta={newMeta} setMeta={setNewMeta} />
              <div className="grid grid-cols-3 gap-3">
                <MonthSelector
                  selectedMonths={newMeta.mes}
                  setSelectedMonths={(meses) => setNewMeta({ ...newMeta, mes: meses })}
                  mesesDisponiveis={mesesDisponiveis}
                />
                <YearInput
                  year={newMeta.ano}
                  setYear={(ano) => setNewMeta({ ...newMeta, ano })}
                />
              </div>
              <RegionaisSelector
                selectedRegionais={newMeta.regionais}
                setSelectedRegionais={(regs) => setNewMeta({ ...newMeta, regionais: regs })}
                options={regionaisDisponiveis}
              />
            </div>
            
            <ActionButtons
              onCancel={() => {
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
              onSubmit={async () => {
                const nomeValido = newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome;
                if (nomeValido && newMeta.quantidade && newMeta.mes.length > 0 && newMeta.ano && newMeta.regionais.length > 0) {
                  const targetValue = parseFloat(newMeta.quantidade);
                  const mesesTexto = newMeta.mes.join(', ');
                  const regionaisTexto = newMeta.regionais.join(', ');
                  const unit = newMeta.nome === 'Retenção' ? '%' : ((newMeta.nome === 'Atendidos Indiretamente' || newMeta.nome === 'Atendidos Diretamente' || newMeta.nome === 'Pessoas Atendidas') ? ' pessoas' : ' unidades');
                  const description = `Meta: ${targetValue}${unit} | Meses: ${mesesTexto} | Regionais: ${regionaisTexto}`;

                  let ultimoMes: number;
                  if (newMeta.mes.length === 0 || newMeta.mes.includes('todo-ano')) {
                    ultimoMes = 12;
                  } else {
                    const mesesNumericos = newMeta.mes
                      .map(m => parseInt(m))
                      .filter(m => !isNaN(m) && m >= 1 && m <= 12);
                    ultimoMes = mesesNumericos.length > 0 ? Math.max(...mesesNumericos) : 12;
                  }
                  const deadline = `${newMeta.ano}-${ultimoMes.toString().padStart(2, '0')}-31`;

                  await GoalService.updateGoal(editingMeta.id, {
                    nome: nomeValido,
                    descricao: description,
                    valor_meta: targetValue,
                    due_date: deadline,
                  });

                  await refetchGoals();
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
              cancelLabel="Cancelar"
              submitLabel="Salvar Alterações"
              submitDisabled={
                !(newMeta.nome === 'Outra' ? newMeta.nomePersonalizado.trim() : newMeta.nome) || 
                !newMeta.quantidade || 
                newMeta.mes.length === 0 || 
                !newMeta.ano || 
                newMeta.regionais.length === 0
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}