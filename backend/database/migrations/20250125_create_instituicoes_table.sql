-- Migração: Criar tabela instituicoes
-- Data: 2025-01-25
-- Descrição: Cria a tabela instituicoes para armazenar dados das ONGs/instituições

begin;

-- Enum para status das instituições
do $$ begin
  if not exists (select 1 from pg_type where typname = 'instituicao_status') then
    create type instituicao_status as enum ('ativa', 'inativa', 'evadida');
  end if;
end $$;

-- Enum para programas
do $$ begin
  if not exists (select 1 from pg_type where typname = 'programa_type') then
    create type programa_type as enum ('decolagem', 'as_maras', 'microcredito');
  end if;
end $$;

-- Enum para regionais
do $$ begin
  if not exists (select 1 from pg_type where typname = 'regional_type') then
    create type regional_type as enum ('nacional', 'centro_oeste', 'mg_es', 'nordeste_1', 'nordeste_2', 'norte', 'rj', 'sp', 'sul', 'comercial');
  end if;
end $$;

-- Tabela instituicoes
create table if not exists public.instituicoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cnpj text,
  endereco text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  email text,
  regional regional_type not null default 'nacional',
  programa programa_type not null default 'decolagem',
  observacoes text,
  nome_lider text,
  status instituicao_status not null default 'ativa',
  evasao_motivo text,
  evasao_data date,
  evasao_registrado_em timestamptz,
  documentos jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para melhor performance
create index if not exists idx_instituicoes_status on public.instituicoes(status);
create index if not exists idx_instituicoes_regional on public.instituicoes(regional);
create index if not exists idx_instituicoes_programa on public.instituicoes(programa);
create index if not exists idx_instituicoes_nome on public.instituicoes(nome);
create index if not exists idx_instituicoes_cnpj on public.instituicoes(cnpj);

-- Trigger para atualizar updated_at automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_instituicoes_updated_at
  before update on public.instituicoes
  for each row execute function update_updated_at_column();

-- RLS (Row Level Security)
alter table public.instituicoes enable row level security;

-- Políticas RLS - permitir acesso completo para usuários autenticados
-- (pode ser refinado posteriormente conforme necessidades de segurança)
drop policy if exists instituicoes_select_authenticated on public.instituicoes;
create policy instituicoes_select_authenticated on public.instituicoes
  for select to authenticated
  using (true);

drop policy if exists instituicoes_insert_authenticated on public.instituicoes;
create policy instituicoes_insert_authenticated on public.instituicoes
  for insert to authenticated
  with check (true);

drop policy if exists instituicoes_update_authenticated on public.instituicoes;
create policy instituicoes_update_authenticated on public.instituicoes
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists instituicoes_delete_authenticated on public.instituicoes;
create policy instituicoes_delete_authenticated on public.instituicoes
  for delete to authenticated
  using (true);

commit;