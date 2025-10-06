import { createClient } from '@supabase/supabase-js';

async function createRLSPoliciesDirect() {
  try {
    console.log('🔧 Criando políticas RLS para admin/super_admin...');
    
    const supabase = createClient(
      'https://ldfldwfvspclsnpgjgmv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE'
    );

    console.log('\n📋 As políticas RLS precisam ser criadas diretamente no Supabase Dashboard ou via SQL.');
    console.log('\n🔍 Estrutura identificada:');
    console.log('- Tabela "usuarios" tem campos "role" e "permissao" para identificar admin/super_admin');
    console.log('- Tabela "members" não tem campo role, mas está linkada via auth_user_id');
    console.log('- Tabela "goals" está linkada a members via member_id');
    
    console.log('\n📝 SQL para criar as políticas RLS:');
    console.log('\n-- 1. Função para verificar se usuário é admin:');
    console.log(`
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
    `);

    console.log('\n-- 2. Políticas para tabela GOALS:');
    console.log(`
-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_goals_select" ON goals;
DROP POLICY IF EXISTS "admin_full_access_goals_insert" ON goals;
DROP POLICY IF EXISTS "admin_full_access_goals_update" ON goals;
DROP POLICY IF EXISTS "admin_full_access_goals_delete" ON goals;

-- Criar novas políticas
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
    `);

    console.log('\n-- 3. Políticas para tabela MEMBERS:');
    console.log(`
-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_members_select" ON members;
DROP POLICY IF EXISTS "admin_full_access_members_insert" ON members;
DROP POLICY IF EXISTS "admin_full_access_members_update" ON members;
DROP POLICY IF EXISTS "admin_full_access_members_delete" ON members;

-- Criar novas políticas
CREATE POLICY "admin_full_access_members_select" ON members 
FOR SELECT USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_members_insert" ON members 
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "admin_full_access_members_update" ON members 
FOR UPDATE USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_members_delete" ON members 
FOR DELETE USING (is_admin_user());
    `);

    console.log('\n-- 4. Políticas para tabela USUARIOS:');
    console.log(`
-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "admin_full_access_usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "admin_full_access_usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "admin_full_access_usuarios_delete" ON usuarios;

-- Criar novas políticas
CREATE POLICY "admin_full_access_usuarios_select" ON usuarios 
FOR SELECT USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_usuarios_insert" ON usuarios 
FOR INSERT WITH CHECK (is_admin_user());

CREATE POLICY "admin_full_access_usuarios_update" ON usuarios 
FOR UPDATE USING (is_admin_user() OR auth_user_id = auth.uid());

CREATE POLICY "admin_full_access_usuarios_delete" ON usuarios 
FOR DELETE USING (is_admin_user());
    `);

    console.log('\n-- 5. Políticas para tabela ACTIVITIES:');
    console.log(`
-- Remover políticas existentes
DROP POLICY IF EXISTS "admin_full_access_activities_select" ON activities;
DROP POLICY IF EXISTS "admin_full_access_activities_insert" ON activities;
DROP POLICY IF EXISTS "admin_full_access_activities_update" ON activities;
DROP POLICY IF EXISTS "admin_full_access_activities_delete" ON activities;

-- Criar novas políticas
CREATE POLICY "admin_full_access_activities_select" ON activities 
FOR SELECT USING (true);

CREATE POLICY "admin_full_access_activities_insert" ON activities 
FOR INSERT WITH CHECK (true);

CREATE POLICY "admin_full_access_activities_update" ON activities 
FOR UPDATE USING (true);

CREATE POLICY "admin_full_access_activities_delete" ON activities 
FOR DELETE USING (is_admin_user());
    `);

    console.log('\n🚀 Para aplicar essas políticas:');
    console.log('1. Acesse o Supabase Dashboard');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute os comandos SQL acima na ordem');
    console.log('4. Teste o acesso com usuários admin e não-admin');

    // Vamos tentar testar o acesso atual
    console.log('\n🧪 Testando acesso atual...');
    
    // Buscar um usuário admin
    const { data: adminUser, error: adminError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('role', 'super_admin')
      .limit(1);
    
    if (!adminError && adminUser && adminUser.length > 0) {
      console.log('✅ Usuário admin encontrado:', adminUser[0].nome, '(', adminUser[0].email, ')');
      
      // Testar quantos goals o admin pode ver com service role
      const { data: allGoals, error: goalsError } = await supabase
        .from('goals')
        .select('*');
      
      if (!goalsError) {
        console.log(`📊 Total de goals no banco: ${allGoals?.length || 0}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createRLSPoliciesDirect();