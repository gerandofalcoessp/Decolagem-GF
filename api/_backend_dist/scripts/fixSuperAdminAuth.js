import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient';
async function fixSuperAdminAuth() {
    console.log('🔧 Corrigindo autenticação de super admin...\n');
    try {
        // 1. Criar a função is_super_admin diretamente
        console.log('1. Criando função is_super_admin...');
        const createFunctionSQL = `
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
    `;
        const { error: functionError } = await supabaseAdmin
            .rpc('exec_sql', { sql: createFunctionSQL });
        if (functionError) {
            console.error('❌ Erro ao criar função:', functionError.message);
            return;
        }
        console.log('✅ Função is_super_admin criada com sucesso!');
        // 2. Remover políticas antigas que podem estar conflitando
        console.log('\n2. Removendo políticas antigas...');
        const dropPoliciesSQL = `
      DROP POLICY IF EXISTS "members_insert_flexible" ON members;
      DROP POLICY IF EXISTS "members_select_flexible" ON members;
      DROP POLICY IF EXISTS "members_update_flexible" ON members;
      DROP POLICY IF EXISTS "members_delete_flexible" ON members;
      DROP POLICY IF EXISTS "members_insert_admin_flexible" ON members;
      DROP POLICY IF EXISTS "members_select_admin_flexible" ON members;
      DROP POLICY IF EXISTS "members_update_admin_flexible" ON members;
      DROP POLICY IF EXISTS "members_delete_admin_flexible" ON members;
    `;
        const { error: dropError } = await supabaseAdmin
            .rpc('exec_sql', { sql: dropPoliciesSQL });
        if (dropError) {
            console.error('❌ Erro ao remover políticas antigas:', dropError.message);
        }
        else {
            console.log('✅ Políticas antigas removidas!');
        }
        // 3. Criar novas políticas que permitem super admin fazer tudo
        console.log('\n3. Criando novas políticas RLS...');
        const createPoliciesSQL = `
      -- Política para INSERT
      CREATE POLICY "members_insert_super_admin" ON members
        FOR INSERT
        WITH CHECK (
          is_super_admin() OR 
          auth.uid() = auth_user_id OR 
          (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
        );

      -- Política para SELECT
      CREATE POLICY "members_select_super_admin" ON members
        FOR SELECT
        USING (
          is_super_admin() OR 
          auth.uid() = auth_user_id OR 
          (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
        );

      -- Política para UPDATE
      CREATE POLICY "members_update_super_admin" ON members
        FOR UPDATE
        USING (
          is_super_admin() OR 
          auth.uid() = auth_user_id OR 
          (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
        )
        WITH CHECK (
          is_super_admin() OR 
          (auth.uid() = auth_user_id OR auth_user_id IS NULL)
        );

      -- Política para DELETE
      CREATE POLICY "members_delete_super_admin" ON members
        FOR DELETE
        USING (
          is_super_admin() OR 
          auth.uid() = auth_user_id OR 
          (auth.uid() IS NOT NULL AND auth_user_id IS NULL)
        );
    `;
        const { error: policiesError } = await supabaseAdmin
            .rpc('exec_sql', { sql: createPoliciesSQL });
        if (policiesError) {
            console.error('❌ Erro ao criar políticas:', policiesError.message);
            return;
        }
        console.log('✅ Políticas RLS criadas com sucesso!');
        // 4. Garantir que RLS está habilitado
        console.log('\n4. Habilitando RLS na tabela members...');
        const enableRLSSQL = `ALTER TABLE members ENABLE ROW LEVEL SECURITY;`;
        const { error: rlsError } = await supabaseAdmin
            .rpc('exec_sql', { sql: enableRLSSQL });
        if (rlsError) {
            console.error('❌ Erro ao habilitar RLS:', rlsError.message);
        }
        else {
            console.log('✅ RLS habilitado na tabela members!');
        }
        // 5. Verificar se tudo foi criado corretamente
        console.log('\n5. Verificando configuração...');
        // Verificar função
        const { data: functionCheck, error: functionCheckError } = await supabaseAdmin
            .rpc('exec_sql', {
            sql: `SELECT proname FROM pg_proc WHERE proname = 'is_super_admin';`
        });
        if (functionCheckError) {
            console.error('❌ Erro ao verificar função:', functionCheckError.message);
        }
        else {
            console.log('✅ Função is_super_admin:', functionCheck.length > 0 ? 'Encontrada' : 'Não encontrada');
        }
        // Verificar políticas
        const { data: policiesCheck, error: policiesCheckError } = await supabaseAdmin
            .rpc('exec_sql', {
            sql: `
          SELECT policyname 
          FROM pg_policies 
          WHERE tablename = 'members' 
          AND policyname LIKE '%super_admin%';
        `
        });
        if (policiesCheckError) {
            console.error('❌ Erro ao verificar políticas:', policiesCheckError.message);
        }
        else {
            console.log(`✅ Políticas super admin encontradas:`, policiesCheck);
            if (Array.isArray(policiesCheck)) {
                policiesCheck.forEach(policy => {
                    console.log(`   - ${policy.policyname}`);
                });
            }
        }
        // 6. Testar a função com um usuário super admin
        console.log('\n6. Testando função is_super_admin...');
        const { data: testResult, error: testError } = await supabaseAdmin
            .rpc('is_super_admin');
        if (testError) {
            console.error('❌ Erro ao testar função:', testError.message);
        }
        else {
            console.log('✅ Teste da função is_super_admin:', testResult);
        }
        console.log('\n🎉 Correção da autenticação de super admin concluída!');
        console.log('📝 Próximos passos:');
        console.log('   1. Teste a criação de usuários no frontend');
        console.log('   2. Verifique se super admins podem editar membros');
        console.log('   3. Confirme que as permissões estão funcionando corretamente');
    }
    catch (error) {
        console.error('❌ Erro durante correção:', error);
    }
}
// Executar a correção
fixSuperAdminAuth().catch(console.error);
