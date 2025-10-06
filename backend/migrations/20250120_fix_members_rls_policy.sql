-- Migration: Fix Members RLS Policy
-- Created at: 2025-01-20T00:00:00.000Z

-- Remove políticas existentes se houver
DROP POLICY IF EXISTS "members_insert_policy" ON members;
DROP POLICY IF EXISTS "members_select_policy" ON members;
DROP POLICY IF EXISTS "members_update_policy" ON members;
DROP POLICY IF EXISTS "members_delete_policy" ON members;

-- Criar políticas flexíveis para INSERT
CREATE POLICY "members_insert_flexible" ON members
  FOR INSERT
  WITH CHECK (
    -- Usuário pode criar membro para si mesmo
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode criar membro sem auth_user_id (admin)
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  );

-- Criar políticas flexíveis para SELECT
CREATE POLICY "members_select_flexible" ON members
  FOR SELECT
  USING (
    -- Usuário pode ver seus próprios membros
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode ver membros sem auth_user_id
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
    OR
    -- Usuário autenticado pode ver todos os membros (para admins)
    auth.uid() IS NOT NULL
  );

-- Criar políticas flexíveis para UPDATE
CREATE POLICY "members_update_flexible" ON members
  FOR UPDATE
  USING (
    -- Usuário pode atualizar seus próprios membros
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode atualizar membros sem auth_user_id
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  );

-- Criar políticas flexíveis para DELETE
CREATE POLICY "members_delete_flexible" ON members
  FOR DELETE
  USING (
    -- Usuário pode deletar seus próprios membros
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode deletar membros sem auth_user_id
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  );

-- Garantir que RLS está habilitado
ALTER TABLE members ENABLE ROW LEVEL SECURITY;