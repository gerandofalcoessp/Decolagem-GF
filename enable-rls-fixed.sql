-- Script para habilitar RLS corretamente na tabela regional_activities
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar status atual do RLS (sem forcerowsecurity)
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'regional_activities' 
AND schemaname = 'public';

-- 2. Habilitar RLS na tabela
ALTER TABLE public.regional_activities ENABLE ROW LEVEL SECURITY;

-- 3. Verificar políticas existentes
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'regional_activities' 
AND schemaname = 'public';

-- 4. Criar política para SELECT (se não existir)
DROP POLICY IF EXISTS "regional_activities_select_policy" ON public.regional_activities;
CREATE POLICY "regional_activities_select_policy" ON public.regional_activities
FOR SELECT USING (
  -- Permitir para criador da atividade
  member_id = (
    SELECT id FROM public.members 
    WHERE auth_user_id = auth.uid()
  )
  OR
  -- Permitir para super_admin e equipe_interna
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE auth_user_id = auth.uid() 
    AND funcao IN ('super_admin', 'equipe_interna')
  )
  OR
  -- Permitir para usuários da mesma regional
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE auth_user_id = auth.uid() 
    AND regional = regional_activities.regional
  )
);

-- 5. Criar política para INSERT (se não existir)
DROP POLICY IF EXISTS "regional_activities_insert_policy" ON public.regional_activities;
CREATE POLICY "regional_activities_insert_policy" ON public.regional_activities
FOR INSERT WITH CHECK (
  -- Permitir para usuários autenticados que são membros
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE auth_user_id = auth.uid()
  )
);

-- 6. Criar política para UPDATE (se não existir)
DROP POLICY IF EXISTS "regional_activities_update_policy" ON public.regional_activities;
CREATE POLICY "regional_activities_update_policy" ON public.regional_activities
FOR UPDATE USING (
  -- Permitir para criador da atividade
  member_id = (
    SELECT id FROM public.members 
    WHERE auth_user_id = auth.uid()
  )
  OR
  -- Permitir para super_admin e equipe_interna
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE auth_user_id = auth.uid() 
    AND funcao IN ('super_admin', 'equipe_interna')
  )
);

-- 7. Criar política para DELETE (ESTA É A MAIS IMPORTANTE!)
DROP POLICY IF EXISTS "regional_activities_delete_policy" ON public.regional_activities;
CREATE POLICY "regional_activities_delete_policy" ON public.regional_activities
FOR DELETE USING (
  -- Permitir para criador da atividade
  member_id = (
    SELECT id FROM public.members 
    WHERE auth_user_id = auth.uid()
  )
  OR
  -- Permitir para super_admin e equipe_interna
  EXISTS (
    SELECT 1 FROM public.members 
    WHERE auth_user_id = auth.uid() 
    AND funcao IN ('super_admin', 'equipe_interna')
  )
);

-- 8. Verificar se as políticas foram criadas
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'regional_activities' 
AND schemaname = 'public'
ORDER BY cmd, policyname;

-- 9. Verificar status final do RLS (sem forcerowsecurity)
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'regional_activities' 
AND schemaname = 'public';