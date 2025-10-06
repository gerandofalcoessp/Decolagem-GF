-- Migration: Fix Admin Members RLS Policy
-- Created at: 2025-01-20T00:00:00.000Z
-- Description: Allow super_admin users to update any member

-- Função para verificar se o usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- Buscar o role do usuário no user_metadata
  SELECT (auth.jwt() ->> 'user_metadata')::json ->> 'role' INTO user_role;
  
  -- Retornar true se for super_admin
  RETURN user_role = 'super_admin';
END;
$$;

-- Remover políticas existentes
DROP POLICY IF EXISTS "members_insert_flexible" ON members;
DROP POLICY IF EXISTS "members_select_flexible" ON members;
DROP POLICY IF EXISTS "members_update_flexible" ON members;
DROP POLICY IF EXISTS "members_delete_flexible" ON members;

-- Criar políticas flexíveis para INSERT
CREATE POLICY "members_insert_admin_flexible" ON members
  FOR INSERT
  WITH CHECK (
    -- Super admin pode criar qualquer membro
    is_super_admin()
    OR
    -- Usuário pode criar membro para si mesmo
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode criar membro sem auth_user_id (admin)
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  );

-- Criar políticas flexíveis para SELECT
CREATE POLICY "members_select_admin_flexible" ON members
  FOR SELECT
  USING (
    -- Super admin pode ver todos os membros
    is_super_admin()
    OR
    -- Usuário pode ver seus próprios membros
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode ver membros sem auth_user_id
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  );

-- Criar políticas flexíveis para UPDATE
CREATE POLICY "members_update_admin_flexible" ON members
  FOR UPDATE
  USING (
    -- Super admin pode atualizar qualquer membro
    is_super_admin()
    OR
    -- Usuário pode atualizar seus próprios membros
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode atualizar membros sem auth_user_id
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  )
  WITH CHECK (
    -- Super admin pode atualizar qualquer membro
    is_super_admin()
    OR
    -- Manter o mesmo auth_user_id ou permitir null
    (auth.uid() = auth_user_id OR auth_user_id IS NULL)
  );

-- Criar políticas flexíveis para DELETE
CREATE POLICY "members_delete_admin_flexible" ON members
  FOR DELETE
  USING (
    -- Super admin pode deletar qualquer membro
    is_super_admin()
    OR
    -- Usuário pode deletar seus próprios membros
    auth.uid() = auth_user_id
    OR
    -- Usuário autenticado pode deletar membros sem auth_user_id
    (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
  );

-- Garantir que RLS está habilitado
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Comentário para documentar a mudança
COMMENT ON TABLE public.members IS 'Members table - allows super_admin users to manage all members, user-owned members and admin-created members (auth_user_id can be null) as of 2025-01-20';