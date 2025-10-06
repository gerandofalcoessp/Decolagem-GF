-- =====================================================
-- POLÍTICAS RLS PARA ADMIN/SUPER_ADMIN
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- =====================================================

-- 1. FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM usuarios 
    WHERE auth_user_id = auth.uid() 
    AND (role = 'admin' OR role = 'super_admin' OR permissao = 'admin' OR permissao = 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. POLÍTICAS PARA TABELA GOALS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_goals_select" ON goals;
DROP POLICY IF EXISTS "admin_full_access_goals_insert" ON goals;
DROP POLICY IF EXISTS "admin_full_access_goals_update" ON goals;
DROP POLICY IF EXISTS "admin_full_access_goals_delete" ON goals;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON goals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON goals;
DROP POLICY IF EXISTS "Enable update for users based on member_id" ON goals;
DROP POLICY IF EXISTS "Enable delete for users based on member_id" ON goals;

-- Criar novas políticas para GOALS
CREATE POLICY "admin_full_access_goals_select" ON goals 
FOR SELECT USING (
  is_admin_user() OR 
  member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
);

CREATE POLICY "admin_full_access_goals_insert" ON goals 
FOR INSERT WITH CHECK (
  is_admin_user() OR 
  member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
);

CREATE POLICY "admin_full_access_goals_update" ON goals 
FOR UPDATE USING (
  is_admin_user() OR 
  member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid())
);

CREATE POLICY "admin_full_access_goals_delete" ON goals 
FOR DELETE USING (is_admin_user());

-- =====================================================
-- 3. POLÍTICAS PARA TABELA MEMBERS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_members_select" ON members;
DROP POLICY IF EXISTS "admin_full_access_members_insert" ON members;
DROP POLICY IF EXISTS "admin_full_access_members_update" ON members;
DROP POLICY IF EXISTS "admin_full_access_members_delete" ON members;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON members;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON members;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON members;
DROP POLICY IF EXISTS "Enable delete for users based on auth_user_id" ON members;

-- Criar novas políticas para MEMBERS
CREATE POLICY "admin_full_access_members_select" ON members 
FOR SELECT USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_members_insert" ON members 
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "admin_full_access_members_update" ON members 
FOR UPDATE USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_members_delete" ON members 
FOR DELETE USING (is_admin_user());

-- =====================================================
-- 4. POLÍTICAS PARA TABELA USUARIOS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "admin_full_access_usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "admin_full_access_usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "admin_full_access_usuarios_delete" ON usuarios;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON usuarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON usuarios;
DROP POLICY IF EXISTS "Enable update for users based on auth_user_id" ON usuarios;
DROP POLICY IF EXISTS "Enable delete for users based on auth_user_id" ON usuarios;

-- Criar novas políticas para USUARIOS
CREATE POLICY "admin_full_access_usuarios_select" ON usuarios 
FOR SELECT USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_usuarios_insert" ON usuarios 
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "admin_full_access_usuarios_update" ON usuarios 
FOR UPDATE USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_usuarios_delete" ON usuarios 
FOR DELETE USING (is_admin_user());

-- =====================================================
-- 5. POLÍTICAS PARA TABELA ACTIVITIES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_activities_select" ON activities;
DROP POLICY IF EXISTS "admin_full_access_activities_insert" ON activities;
DROP POLICY IF EXISTS "admin_full_access_activities_update" ON activities;
DROP POLICY IF EXISTS "admin_full_access_activities_delete" ON activities;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Enable read access for all users" ON activities;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON activities;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON activities;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON activities;

-- Criar novas políticas para ACTIVITIES
CREATE POLICY "admin_full_access_activities_select" ON activities 
FOR SELECT USING (true);

CREATE POLICY "admin_full_access_activities_insert" ON activities 
FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_full_access_activities_update" ON activities 
FOR UPDATE USING (true);

CREATE POLICY "admin_full_access_activities_delete" ON activities 
FOR DELETE USING (is_admin_user());

-- =====================================================
-- 6. VERIFICAR SE RLS ESTÁ HABILITADO NAS TABELAS
-- =====================================================

-- Habilitar RLS se não estiver habilitado
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se a função foi criada
SELECT proname FROM pg_proc WHERE proname = 'is_admin_user';

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('goals', 'members', 'usuarios', 'activities')
ORDER BY tablename, policyname;

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('goals', 'members', 'usuarios', 'activities');