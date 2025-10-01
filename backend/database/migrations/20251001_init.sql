-- Decolagem: migração inicial unificada (extensões, enum, tabelas, RLS e políticas)
begin;

-- Extensões necessárias para UUID
create extension if not exists pgcrypto;

-- Enum de status de metas
do $$ begin
  if not exists (select 1 from pg_type where typname = 'goal_status') then
    create type goal_status as enum ('pending', 'in_progress', 'done');
  end if;
end $$;

-- Tabelas
create table if not exists public.regionals (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique,
  regional_id uuid references public.regionals(id) on delete set null,
  name text,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text not null,
  description text,
  activity_date timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text not null,
  status goal_status not null default 'pending',
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  path text not null,
  mime_type text,
  size integer,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_members_auth_user_id on public.members(auth_user_id);
create index if not exists idx_members_regional_id on public.members(regional_id);
create index if not exists idx_activities_member_id on public.activities(member_id);
create index if not exists idx_goals_member_id on public.goals(member_id);
create index if not exists idx_files_member_id on public.files(member_id);

-- RLS
alter table public.regionals enable row level security;
alter table public.members enable row level security;
alter table public.activities enable row level security;
alter table public.goals enable row level security;
alter table public.files enable row level security;

-- Políticas
-- Regionals: leitura para qualquer usuário autenticado
DROP POLICY IF EXISTS regionals_select_authenticated ON public.regionals;
CREATE POLICY regionals_select_authenticated ON public.regionals
  FOR SELECT TO authenticated
  USING (true);

-- Members: cada usuário só pode acessar o próprio registro
DROP POLICY IF EXISTS members_select_own ON public.members;
CREATE POLICY members_select_own ON public.members
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS members_insert_self ON public.members;
CREATE POLICY members_insert_self ON public.members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS members_update_own ON public.members;
CREATE POLICY members_update_own ON public.members
  FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS members_delete_own ON public.members;
CREATE POLICY members_delete_own ON public.members
  FOR DELETE TO authenticated
  USING (auth.uid() = auth_user_id);

-- Activities: CRUD apenas via vínculo com o member do usuário
DROP POLICY IF EXISTS activities_select_own ON public.activities;
CREATE POLICY activities_select_own ON public.activities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.activities.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS activities_insert_own ON public.activities;
CREATE POLICY activities_insert_own ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.activities.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS activities_update_own ON public.activities;
CREATE POLICY activities_update_own ON public.activities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.activities.member_id
        AND m.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.activities.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS activities_delete_own ON public.activities;
CREATE POLICY activities_delete_own ON public.activities
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.activities.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

-- Goals: CRUD apenas via vínculo com o member do usuário
DROP POLICY IF EXISTS goals_select_own ON public.goals;
CREATE POLICY goals_select_own ON public.goals
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.goals.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS goals_insert_own ON public.goals;
CREATE POLICY goals_insert_own ON public.goals
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.goals.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS goals_update_own ON public.goals;
CREATE POLICY goals_update_own ON public.goals
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.goals.member_id
        AND m.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.goals.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS goals_delete_own ON public.goals;
CREATE POLICY goals_delete_own ON public.goals
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.goals.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

-- Files: CRUD apenas via vínculo com o member do usuário
DROP POLICY IF EXISTS files_select_own ON public.files;
CREATE POLICY files_select_own ON public.files
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.files.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS files_insert_own ON public.files;
CREATE POLICY files_insert_own ON public.files
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.files.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS files_update_own ON public.files;
CREATE POLICY files_update_own ON public.files
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.files.member_id
        AND m.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.files.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS files_delete_own ON public.files;
CREATE POLICY files_delete_own ON public.files
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.members m
      WHERE m.id = public.files.member_id
        AND m.auth_user_id = auth.uid()
    )
  );

commit;