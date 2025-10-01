import type { TipoAtividade, Programa } from '@/types';

export const REGIONAL_LABELS: Record<string, string> = {
  todas: 'Todas as Regionais',
  nacional: 'Nacional',
  comercial: 'Comercial',
  centro_oeste: 'Centro-Oeste',
  mg_es: 'MG/ES',
  nordeste_1: 'Nordeste 1',
  nordeste_2: 'Nordeste 2',
  norte: 'Norte',
  rj: 'RJ',
  sp: 'SP',
  sul: 'Sul',
};

export const DEPARTAMENTO_LABELS: Record<string, string> = {
  todos: 'Todos os Departamentos',
  regionais: 'Regionais',
  comercial: 'Comercial',
  nacional: 'Nacional',
};

export const ATIVIDADE_OPTIONS: { value: TipoAtividade; label: string }[] = [
  { value: 'formacao_ligas', label: 'Formação maras' },
  { value: 'formacao_ligas', label: 'Formação líder mara' },
  { value: 'formacao_ligas', label: 'Formação Liga' },
  { value: 'imersao', label: 'Imersão Maras' },
  { value: 'seletivas', label: 'Processo seletivo' },
  { value: 'outros', label: 'Visita Ong' },
  { value: 'nps', label: 'NPS' },
  { value: 'ong_mara', label: 'ONG Mara' },
  { value: 'ong_decolagem', label: 'ONG Decolagem' },
  { value: 'inadimplencia', label: 'Inadimplência' },
  { value: 'encontro_lider_maras', label: 'Encontro Líder Maras' },
  { value: 'familia_atendida', label: 'Família Atendida' },
  { value: 'outros', label: 'OUTRA' },
];

export const TYPE_COLOR_CLASSES: Record<TipoAtividade, string> = {
  encontros: 'bg-blue-500',
  formacao_ligas: 'bg-teal-500',
  imersao: 'bg-violet-500',
  seletivas: 'bg-green-500',
  retencao: 'bg-amber-500',
  inadimplencia: 'bg-red-500',
  nps: 'bg-indigo-500',
  outros: 'bg-gray-500',
  ong_mara: 'bg-pink-500',
  ong_decolagem: 'bg-purple-500',
  encontro_lider_maras: 'bg-blue-600',
  familia_atendida: 'bg-emerald-600',
};

export const REGIONAL_COLOR_CLASSES: Record<string, string> = {
  nacional: 'bg-purple-500',
  comercial: 'bg-orange-500',
  centro_oeste: 'bg-blue-500',
  mg_es: 'bg-green-500',
  nordeste_1: 'bg-yellow-500',
  nordeste_2: 'bg-pink-500',
  norte: 'bg-cyan-500',
  rj: 'bg-red-500',
  sp: 'bg-indigo-500',
  sul: 'bg-emerald-500',
};

// Estados por regional (UFs)
export const REGIONAL_STATES: Record<string, string[]> = {
  nacional: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
  comercial: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
  centro_oeste: ['DF','GO','MT','MS'],
  mg_es: ['MG','ES'],
  nordeste_1: ['CE','PB','RN','MA','PI'],
  nordeste_2: ['BA','SE','PE','AL'],
  norte: ['AC','AP','AM','PA','RO','RR','TO'],
  rj: ['RJ'],
  sp: ['SP'],
  sul: ['RS','PR','SC'],
};

// Labels completos dos estados por UF
export const STATE_LABELS: Record<string, string> = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins',
};

// Labels de Programas e opções centralizados
export const PROGRAMA_LABELS: Record<Programa, string> = {
  as_maras: 'As Maras',
  microcredito: 'Microcrédito',
  decolagem: 'Decolagem',
};

export const PROGRAMA_OPTIONS: { value: Programa; label: string }[] = [
  { value: 'as_maras', label: PROGRAMA_LABELS.as_maras },
  { value: 'microcredito', label: PROGRAMA_LABELS.microcredito },
  { value: 'decolagem', label: PROGRAMA_LABELS.decolagem },
];