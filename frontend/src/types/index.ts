// Tipos de usuário e autenticação
export type UserRole = 'super_admin' | 'equipe_interna';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  funcao?: string;
  regional?: Regional;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Tipos de regional
export type Regional = 
  | 'nacional' 
  | 'comercial' 
  | 'centro_oeste' 
  | 'mg_es' 
  | 'nordeste_1' 
  | 'nordeste_2' 
  | 'norte' 
  | 'rj' 
  | 'sp' 
  | 'sul';

// Tipos de programa
export type Programa = 'as_maras' | 'microcredito' | 'decolagem';

// Tipos de status
export type Status = 'ativo' | 'inativo';

// Tipos de atividade
export type TipoAtividade = 
  | 'formacao_ligas' 
  | 'encontros' 
  | 'imersao' 
  | 'seletivas' 
  | 'retencao' 
  | 'inadimplencia' 
  | 'nps' 
  | 'outros'
  | 'ong_mara'
  | 'ong_decolagem'
  | 'encontro_lider_maras'
  | 'familia_atendida'
  // Novos tipos adicionados
  | 'ligas_maras_formadas'
  | 'familias_embarcadas_decolagem'
  | 'diagnosticos_realizados';

// Interface para ONG
export interface ONG {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  regional: Regional;
  programa: Programa;
  status: Status;
  motivo_inativacao?: string;
  data_inativacao?: string;
  evasao?: {
    motivo: string;
    data: string;
    registradoEm: string;
  };
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Interface para Participante
export interface Participante {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ong_id?: string;
  ong?: ONG;
  programa: Programa;
  status: Status;
  motivo_inativacao?: string;
  data_inativacao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Interface para Liga Maras
export interface LigaMaras {
  id: string;
  nome: string;
  ong_id: string;
  ong?: ONG;
  fundadora_id?: string;
  fundadora?: Participante;
  presidente_id?: string;
  presidente?: Participante;
  tesoureira_id?: string;
  tesoureira?: Participante;
  data_formacao?: string;
  status: Status;
  progresso: number; // 0-100
  membros?: ParticipanteLiga[];
  created_at: string;
  updated_at: string;
}

// Interface para membros da Liga Maras
export interface ParticipanteLiga {
  id: string;
  liga_id: string;
  participante_id: string;
  participante?: Participante;
  cargo?: string;
  data_entrada: string;
  created_at: string;
}

// Interface para Diagnóstico Decolagem
export interface DiagnosticoDecolagem {
  id: string;
  participante_id: string;
  participante?: Participante;
  pergunta_1?: string;
  resposta_1?: string;
  pergunta_2?: string;
  resposta_2?: string;
  pergunta_3?: string;
  resposta_3?: string;
  pergunta_4?: string;
  resposta_4?: string;
  pergunta_5?: string;
  resposta_5?: string;
  pergunta_6?: string;
  resposta_6?: string;
  pergunta_7?: string;
  resposta_7?: string;
  pergunta_8?: string;
  resposta_8?: string;
  pergunta_9?: string;
  resposta_9?: string;
  pergunta_10?: string;
  resposta_10?: string;
  pontuacao_total?: number;
  data_diagnostico: string;
  created_at: string;
  updated_at: string;
}

// Interface para Microcrédito
export interface Microcredito {
  id: string;
  participante_id: string;
  participante?: Participante;
  valor_solicitado?: number;
  valor_aprovado?: number;
  status: string;
  data_solicitacao: string;
  data_aprovacao?: string;
  data_vencimento?: string;
  taxa_juros?: number;
  parcelas?: number;
  valor_parcela?: number;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// Interface para Metas
export interface Meta {
  id: string;
  nome: string;
  descricao?: string;
  valor_meta: number;
  valor_atual: number;
  regional?: Regional;
  programa?: Programa;
  mes?: number;
  ano?: number;
  created_at: string;
  updated_at: string;
}

// Interface para Indicadores
export interface Indicador {
  id: string;
  nome: string;
  valor: number;
  unidade?: string;
  programa?: Programa;
  regional?: Regional;
  data_referencia: string;
  created_at: string;
}

// Interface para Atividades
export interface Atividade {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: TipoAtividade;
  data_inicio: string;
  data_fim?: string;
  local?: string;
  regional?: Regional;
  programa?: Programa;
  responsavel_id?: string;
  responsavel?: User;
  participantes_esperados?: number;
  participantes_confirmados: number;
  quantidade?: number;
  status: string;
  observacoes?: string;
  // Novo: até 2 evidências de imagens
  evidencias?: Evidencia[];
  created_at: string;
  updated_at: string;
}

// Interface para Produtos
export interface Produto {
  id: string;
  nome: string;
  descricao?: string;
  categoria?: string;
  preco?: number;
  participante_id?: string;
  participante?: Participante;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

// Interface para Vendas
export interface Venda {
  id: string;
  produto_id: string;
  produto?: Produto;
  participante_id: string;
  participante?: Participante;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  data_venda: string;
  observacoes?: string;
  created_at: string;
}

// Interface para Relatórios de Impacto
export interface RelatorioImpacto {
  id: string;
  participante_id: string;
  participante?: Participante;
  programa: Programa;
  periodo_inicio?: string;
  periodo_fim?: string;
  renda_antes?: number;
  renda_depois?: number;
  pessoas_impactadas?: number;
  observacoes?: string;
  data_relatorio: string;
  created_at: string;
}

// Tipos para formulários
export interface LoginForm {
  email: string;
  senha: string;
}

export interface ParticipanteForm {
  nome: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  ong_id?: string;
  programa: Programa;
  observacoes?: string;
}

export interface ONGForm {
  nome: string;
  cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  regional: Regional;
  programa: Programa;
  observacoes?: string;
  // Novos campos
  nome_lider?: string;
  documentos?: (File | string)[]; // Pode ser File objects (novos uploads) ou strings (dados existentes)
}

// Tipos para filtros
export interface FiltrosDashboard {
  regional?: Regional;
  programa?: Programa;
  mes?: number;
  ano?: number;
  equipe?: string;
  atividade?: TipoAtividade;
}

// Tipos para estatísticas do dashboard
export interface EstatisticasDashboard {
  ongs_programa: number;
  ongs_maras: number;
  ongs_decolagem: number;
  ligas_formadas: number;
  total_maras: number;
  total_familias: number;
  retencao: number;
  inadimplencia: number;
  nps: number;
}

// Tipos para gráficos
export interface DadosGrafico {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Tipos para API Response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipos para erros
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Novo: tipo para evidências de atividade
export interface Evidencia {
  id: string;
  filename: string;
  mimeType: 'image/jpeg' | 'image/jpg' | 'image/png' | 'image/webp';
  size: number; // bytes
  url?: string; // data URL para preview local
  created_at: string;
}

// Tipo específico para o form do EventModal
export interface EventForm {
  atividade: TipoAtividade | '';
  atividadeLabel: string;
  atividadeCustomLabel: string;
  responsavel: string;
  descricao: string;
  dataAtividade: string;
  regional: Regional;
  local: string;
  estados: string[];
  programa: Programa | '';
  instituicaoId: string;
  evidencias: Evidencia[];
  quantidade: number | undefined;
}