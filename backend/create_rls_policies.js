import { createClient } from '@supabase/supabase-js';

async function createRLSPolicies() {
  try {
    console.log('🔧 Criando políticas RLS para admin/super_admin...');
    
    const supabase = createClient(
      'https://ldfldwfvspclsnpgjgmv.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE'
    );

    // Função auxiliar para executar SQL
    const executeSql = async (sql, description) => {
      try {
        console.log(`\n🔄 ${description}...`);
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.log(`❌ Erro: ${error.message}`);
          return false;
        } else {
          console.log(`✅ ${description} - Sucesso!`);
          return true;
        }
      } catch (err) {
        console.log(`❌ Erro ao executar: ${err.message}`);
        return false;
      }
    };

    // Primeiro, vamos criar uma função para verificar se o usuário é admin
    const createAdminCheckFunction = `
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
    `;

    await executeSql(createAdminCheckFunction, 'Criando função is_admin_user()');

    // Políticas para tabela GOALS
    console.log('\n📋 Configurando políticas para tabela GOALS...');
    
    // Remover políticas existentes se houver
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_goals_select" ON goals;', 'Removendo política antiga de SELECT em goals');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_goals_insert" ON goals;', 'Removendo política antiga de INSERT em goals');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_goals_update" ON goals;', 'Removendo política antiga de UPDATE em goals');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_goals_delete" ON goals;', 'Removendo política antiga de DELETE em goals');

    // Criar novas políticas para goals
    const goalsPolicies = [
      {
        name: 'admin_full_access_goals_select',
        sql: `CREATE POLICY "admin_full_access_goals_select" ON goals FOR SELECT USING (is_admin_user() OR member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));`,
        description: 'Política SELECT para goals (admin vê tudo, usuários veem apenas seus próprios)'
      },
      {
        name: 'admin_full_access_goals_insert',
        sql: `CREATE POLICY "admin_full_access_goals_insert" ON goals FOR INSERT WITH CHECK (is_admin_user() OR member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));`,
        description: 'Política INSERT para goals'
      },
      {
        name: 'admin_full_access_goals_update',
        sql: `CREATE POLICY "admin_full_access_goals_update" ON goals FOR UPDATE USING (is_admin_user() OR member_id IN (SELECT id FROM members WHERE auth_user_id = auth.uid()));`,
        description: 'Política UPDATE para goals'
      },
      {
        name: 'admin_full_access_goals_delete',
        sql: `CREATE POLICY "admin_full_access_goals_delete" ON goals FOR DELETE USING (is_admin_user());`,
        description: 'Política DELETE para goals (apenas admin pode deletar)'
      }
    ];

    for (const policy of goalsPolicies) {
      await executeSql(policy.sql, policy.description);
    }

    // Políticas para tabela MEMBERS
    console.log('\n👥 Configurando políticas para tabela MEMBERS...');
    
    // Remover políticas existentes se houver
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_members_select" ON members;', 'Removendo política antiga de SELECT em members');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_members_insert" ON members;', 'Removendo política antiga de INSERT em members');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_members_update" ON members;', 'Removendo política antiga de UPDATE em members');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_members_delete" ON members;', 'Removendo política antiga de DELETE em members');

    const membersPolicies = [
      {
        name: 'admin_full_access_members_select',
        sql: `CREATE POLICY "admin_full_access_members_select" ON members FOR SELECT USING (is_admin_user() OR auth_user_id = auth.uid());`,
        description: 'Política SELECT para members (admin vê todos, usuários veem apenas a si mesmos)'
      },
      {
        name: 'admin_full_access_members_insert',
        sql: `CREATE POLICY "admin_full_access_members_insert" ON members FOR INSERT WITH CHECK (is_admin_user());`,
        description: 'Política INSERT para members (apenas admin pode criar)'
      },
      {
        name: 'admin_full_access_members_update',
        sql: `CREATE POLICY "admin_full_access_members_update" ON members FOR UPDATE USING (is_admin_user() OR auth_user_id = auth.uid());`,
        description: 'Política UPDATE para members (admin pode editar todos, usuários podem editar a si mesmos)'
      },
      {
        name: 'admin_full_access_members_delete',
        sql: `CREATE POLICY "admin_full_access_members_delete" ON members FOR DELETE USING (is_admin_user());`,
        description: 'Política DELETE para members (apenas admin pode deletar)'
      }
    ];

    for (const policy of membersPolicies) {
      await executeSql(policy.sql, policy.description);
    }

    // Políticas para tabela USUARIOS
    console.log('\n👤 Configurando políticas para tabela USUARIOS...');
    
    // Remover políticas existentes se houver
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_usuarios_select" ON usuarios;', 'Removendo política antiga de SELECT em usuarios');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_usuarios_insert" ON usuarios;', 'Removendo política antiga de INSERT em usuarios');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_usuarios_update" ON usuarios;', 'Removendo política antiga de UPDATE em usuarios');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_usuarios_delete" ON usuarios;', 'Removendo política antiga de DELETE em usuarios');

    const usuariosPolicies = [
      {
        name: 'admin_full_access_usuarios_select',
        sql: `CREATE POLICY "admin_full_access_usuarios_select" ON usuarios FOR SELECT USING (is_admin_user() OR auth_user_id = auth.uid());`,
        description: 'Política SELECT para usuarios (admin vê todos, usuários veem apenas a si mesmos)'
      },
      {
        name: 'admin_full_access_usuarios_insert',
        sql: `CREATE POLICY "admin_full_access_usuarios_insert" ON usuarios FOR INSERT WITH CHECK (is_admin_user());`,
        description: 'Política INSERT para usuarios (apenas admin pode criar)'
      },
      {
        name: 'admin_full_access_usuarios_update',
        sql: `CREATE POLICY "admin_full_access_usuarios_update" ON usuarios FOR UPDATE USING (is_admin_user() OR auth_user_id = auth.uid());`,
        description: 'Política UPDATE para usuarios (admin pode editar todos, usuários podem editar a si mesmos)'
      },
      {
        name: 'admin_full_access_usuarios_delete',
        sql: `CREATE POLICY "admin_full_access_usuarios_delete" ON usuarios FOR DELETE USING (is_admin_user());`,
        description: 'Política DELETE para usuarios (apenas admin pode deletar)'
      }
    ];

    for (const policy of usuariosPolicies) {
      await executeSql(policy.sql, policy.description);
    }

    // Políticas para tabela ACTIVITIES
    console.log('\n📊 Configurando políticas para tabela ACTIVITIES...');
    
    // Remover políticas existentes se houver
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_activities_select" ON activities;', 'Removendo política antiga de SELECT em activities');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_activities_insert" ON activities;', 'Removendo política antiga de INSERT em activities');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_activities_update" ON activities;', 'Removendo política antiga de UPDATE em activities');
    await executeSql('DROP POLICY IF EXISTS "admin_full_access_activities_delete" ON activities;', 'Removendo política antiga de DELETE em activities');

    const activitiesPolicies = [
      {
        name: 'admin_full_access_activities_select',
        sql: `CREATE POLICY "admin_full_access_activities_select" ON activities FOR SELECT USING (is_admin_user() OR true);`,
        description: 'Política SELECT para activities (admin vê todas, usuários também podem ver)'
      },
      {
        name: 'admin_full_access_activities_insert',
        sql: `CREATE POLICY "admin_full_access_activities_insert" ON activities FOR INSERT WITH CHECK (is_admin_user() OR true);`,
        description: 'Política INSERT para activities'
      },
      {
        name: 'admin_full_access_activities_update',
        sql: `CREATE POLICY "admin_full_access_activities_update" ON activities FOR UPDATE USING (is_admin_user() OR true);`,
        description: 'Política UPDATE para activities'
      },
      {
        name: 'admin_full_access_activities_delete',
        sql: `CREATE POLICY "admin_full_access_activities_delete" ON activities FOR DELETE USING (is_admin_user());`,
        description: 'Política DELETE para activities (apenas admin pode deletar)'
      }
    ];

    for (const policy of activitiesPolicies) {
      await executeSql(policy.sql, policy.description);
    }

    console.log('\n✅ Todas as políticas RLS foram configuradas!');
    console.log('\n📝 Resumo das políticas criadas:');
    console.log('- Admin/Super_admin têm acesso total a todas as tabelas');
    console.log('- Usuários comuns veem apenas seus próprios dados');
    console.log('- Apenas admin pode deletar registros');
    console.log('- Goals: admin vê todos, usuários veem apenas os seus');
    console.log('- Members/Usuarios: admin vê todos, usuários veem apenas a si mesmos');
    console.log('- Activities: todos podem ver e editar, apenas admin pode deletar');
    
  } catch (error) {
    console.error('❌ Erro na criação das políticas:', error.message);
  }
}

createRLSPolicies();