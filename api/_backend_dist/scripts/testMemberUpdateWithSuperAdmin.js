import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient';
import { createClient } from '@supabase/supabase-js';
async function testMemberUpdateWithSuperAdmin() {
    console.log('🧪 Testando atualização de membro com super admin...\n');
    try {
        // 1. Buscar um usuário super admin
        console.log('1. Buscando usuário super admin...');
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
            console.error('❌ Erro ao buscar usuários:', usersError.message);
            return;
        }
        const superAdminUser = users.users.find(u => u.user_metadata?.role === 'super_admin' ||
            u.email?.includes('admin') ||
            u.email?.includes('flavio'));
        if (!superAdminUser) {
            console.log('❌ Nenhum usuário super admin encontrado');
            return;
        }
        console.log('✅ Super admin encontrado:', superAdminUser.email);
        // 2. Criar cliente Supabase com service role para simular usuário autenticado
        console.log('\n2. Configurando cliente com contexto de usuário...');
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Variáveis de ambiente do Supabase não configuradas');
            return;
        }
        const supabaseWithAuth = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
        console.log('✅ Cliente Supabase configurado');
        // 3. Buscar um membro para testar
        console.log('\n3. Buscando membro para testar...');
        const { data: members, error: membersError } = await supabaseAdmin
            .from('members')
            .select('*')
            .limit(1);
        if (membersError || !members || members.length === 0) {
            console.error('❌ Erro ao buscar membros ou nenhum membro encontrado');
            return;
        }
        const testMember = members[0];
        console.log('✅ Membro encontrado para teste:', {
            id: testMember.id,
            name: testMember.name,
            email: testMember.email,
            auth_user_id: testMember.auth_user_id
        });
        // 4. Testar verificação da função is_super_admin com o usuário super admin
        console.log('\n4. Testando função is_super_admin...');
        const { data: adminCheckResult, error: adminCheckError } = await supabaseAdmin
            .rpc('is_super_admin', {}, {
            headers: {
                'x-user-id': superAdminUser.id
            }
        });
        if (adminCheckError) {
            console.error('❌ Erro ao verificar is_super_admin:', adminCheckError.message);
        }
        else {
            console.log('✅ Resultado is_super_admin:', adminCheckResult);
        }
        // 5. Tentar atualizar o membro usando RPC personalizada que simula contexto de usuário
        console.log('\n5. Testando atualização com contexto de super admin...');
        const originalName = testMember.name;
        const newName = `${originalName} - Teste Admin ${Date.now()}`;
        // Usar uma query SQL direta para simular o contexto do usuário
        const updateQuery = `
      SELECT auth.uid() as current_user_id, 
             (SELECT raw_user_meta_data->>'role' FROM auth.users WHERE id = auth.uid()) as user_role,
             is_super_admin() as is_admin;
      
      UPDATE members 
      SET name = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
        // Primeiro, vamos testar com admin direto
        const { data: updateResult, error: updateError } = await supabaseAdmin
            .from('members')
            .update({ name: newName })
            .eq('id', testMember.id)
            .select('*');
        if (updateError) {
            console.error('❌ Erro ao atualizar membro:', updateError.message);
            console.error('Código:', updateError.code);
            console.error('Detalhes:', updateError.details);
        }
        else {
            console.log('✅ Membro atualizado com sucesso usando admin!');
            console.log('- Dados retornados:', updateResult);
            console.log('- Quantidade de registros:', updateResult?.length || 0);
            if (updateResult && updateResult.length > 0) {
                console.log('- Nome atualizado de:', originalName);
                console.log('- Nome atualizado para:', updateResult[0].name);
                // 6. Reverter a alteração
                console.log('\n6. Revertendo alteração...');
                const { data: revertResult, error: revertError } = await supabaseAdmin
                    .from('members')
                    .update({ name: originalName })
                    .eq('id', testMember.id)
                    .select('*');
                if (revertError) {
                    console.error('❌ Erro ao reverter:', revertError.message);
                }
                else {
                    console.log('✅ Alteração revertida com sucesso');
                }
            }
        }
        // 7. Testar com RPC que simula contexto de usuário autenticado
        console.log('\n7. Testando com RPC personalizada...');
        const { data: rpcResult, error: rpcError } = await supabaseAdmin
            .rpc('exec_sql', {
            sql: `
          -- Simular contexto de usuário autenticado
          SET LOCAL "request.jwt.claims" = '{"sub": "${superAdminUser.id}", "role": "authenticated"}';
          
          -- Verificar se é super admin
          SELECT is_super_admin() as is_admin;
          
          -- Tentar atualizar
          UPDATE members 
          SET name = '${newName}' 
          WHERE id = '${testMember.id}'
          RETURNING id, name, email, auth_user_id;
        `
        });
        if (rpcError) {
            console.error('❌ Erro no RPC:', rpcError.message);
        }
        else {
            console.log('✅ Resultado do RPC:', rpcResult);
        }
    }
    catch (error) {
        console.error('❌ Erro geral:', error);
    }
}
// Executar o script
testMemberUpdateWithSuperAdmin();
export default testMemberUpdateWithSuperAdmin;
