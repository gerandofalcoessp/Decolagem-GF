import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient.js';

async function checkRLSPolicies() {
  console.log('🔍 Verificando políticas RLS...\n');

  try {
    // 1. Verificar se RLS está habilitado na tabela members
    console.log('1. Verificando se RLS está habilitado...');
    const { data: rlsStatus, error: rlsError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, rowsecurity 
          FROM pg_tables 
          WHERE tablename = 'members' AND schemaname = 'public';
        `
      });

    if (rlsError) {
      console.error('❌ Erro ao verificar RLS:', rlsError.message);
    } else {
      console.log('✅ Status RLS:', rlsStatus);
    }

    // 2. Listar todas as políticas da tabela members
    console.log('\n2. Listando políticas da tabela members...');
    const { data: policies, error: policiesError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'members' AND schemaname = 'public'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.error('❌ Erro ao listar políticas:', policiesError.message);
    } else {
      console.log('✅ Políticas encontradas:', policies);
    }

    // 3. Verificar se a função is_super_admin existe
    console.log('\n3. Verificando função is_super_admin...');
    const { data: functionExists, error: functionError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT 
            proname,
            prosrc,
            prorettype::regtype as return_type
          FROM pg_proc 
          WHERE proname = 'is_super_admin';
        `
      });

    if (functionError) {
      console.error('❌ Erro ao verificar função:', functionError.message);
    } else {
      console.log('✅ Função is_super_admin:', functionExists);
    }

    // 4. Testar a função is_super_admin com diferentes contextos
    console.log('\n4. Testando função is_super_admin...');
    
    // Teste sem contexto de usuário
    const { data: testNoUser, error: errorNoUser } = await supabaseAdmin
      .rpc('is_super_admin');

    if (errorNoUser) {
      console.error('❌ Erro ao testar sem usuário:', errorNoUser.message);
    } else {
      console.log('✅ Teste sem usuário:', testNoUser);
    }

    // 5. Buscar um usuário super admin para testar
    console.log('\n5. Buscando usuário super admin...');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }

    const superAdminUser = users.users.find(u => 
      u.user_metadata?.role === 'super_admin' || 
      u.email?.includes('flavio')
    );

    if (superAdminUser) {
      console.log('✅ Super admin encontrado:', superAdminUser.email);
      console.log('- ID:', superAdminUser.id);
      console.log('- Role:', superAdminUser.user_metadata?.role);

      // Testar função com contexto de super admin
      const { data: testWithAdmin, error: errorWithAdmin } = await supabaseAdmin
        .rpc('exec_sql', {
          sql: `
            -- Simular contexto de usuário autenticado
            SET LOCAL "request.jwt.claims" = '{"sub": "${superAdminUser.id}", "role": "authenticated"}';
            
            -- Testar função
            SELECT 
              auth.uid() as current_user_id,
              (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as user_role,
              is_super_admin() as is_admin;
          `
        });

      if (errorWithAdmin) {
        console.error('❌ Erro ao testar com admin:', errorWithAdmin.message);
      } else {
        console.log('✅ Teste com super admin:', testWithAdmin);
      }
    }

    // 6. Verificar se existem políticas antigas que podem estar conflitando
    console.log('\n6. Verificando políticas antigas...');
    const { data: oldPolicies, error: oldPoliciesError } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          SELECT policyname, cmd, qual
          FROM pg_policies 
          WHERE tablename = 'members' 
          AND schemaname = 'public'
          AND policyname LIKE '%update%'
          ORDER BY policyname;
        `
      });

    if (oldPoliciesError) {
      console.error('❌ Erro ao verificar políticas antigas:', oldPoliciesError.message);
    } else {
      console.log('✅ Políticas de update:', oldPolicies);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar o script
checkRLSPolicies();

export default checkRLSPolicies;