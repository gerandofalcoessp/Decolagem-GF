import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient';
import { AuthService } from '../services/authService';
async function debugSuperAdminPermissions() {
    console.log('🔍 Debugando permissões de super admin...\n');
    try {
        // 1. Listar todos os usuários para encontrar super admins
        console.log('1. Listando usuários...');
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
            console.error('❌ Erro ao listar usuários:', usersError.message);
            return;
        }
        console.log(`✅ Total de usuários encontrados: ${users.users.length}`);
        // Filtrar super admins
        const superAdmins = users.users.filter(user => user.user_metadata?.role === 'super_admin');
        console.log(`✅ Super admins encontrados: ${superAdmins.length}`);
        if (superAdmins.length === 0) {
            console.log('❌ Nenhum super admin encontrado!');
            return;
        }
        // 2. Para cada super admin, testar a função getMemberData
        for (const superAdmin of superAdmins) {
            console.log(`\n2. Testando super admin: ${superAdmin.email}`);
            console.log(`   ID: ${superAdmin.id}`);
            console.log(`   Role no user_metadata: ${superAdmin.user_metadata?.role}`);
            console.log(`   Nome: ${superAdmin.user_metadata?.nome}`);
            // Testar getMemberData
            console.log('   Testando AuthService.getMemberData...');
            const memberData = await AuthService.getMemberData(superAdmin.id);
            if (!memberData) {
                console.log('   ❌ getMemberData retornou null');
                // Verificar se existe entrada na tabela members
                const { data: memberCheck, error: memberCheckError } = await supabaseAdmin
                    .from('members')
                    .select('*')
                    .eq('auth_user_id', superAdmin.id)
                    .single();
                if (memberCheckError) {
                    console.log(`   ❌ Erro ao buscar member: ${memberCheckError.message}`);
                    console.log('   ⚠️  Este usuário não tem entrada na tabela members!');
                }
                else {
                    console.log('   ✅ Member encontrado na tabela:', {
                        id: memberCheck.id,
                        name: memberCheck.name,
                        email: memberCheck.email
                    });
                }
            }
            else {
                console.log('   ✅ getMemberData retornou:', {
                    id: memberData.id,
                    name: memberData.name,
                    email: memberData.email,
                    role: memberData.role
                });
                // Verificar se o role está correto
                if (memberData.role !== 'super_admin') {
                    console.log(`   ❌ Role incorreto! Esperado: 'super_admin', Encontrado: '${memberData.role}'`);
                }
                else {
                    console.log('   ✅ Role correto: super_admin');
                }
            }
        }
        // 3. Testar a função is_super_admin do banco
        console.log('\n3. Testando função is_super_admin do banco...');
        for (const superAdmin of superAdmins) {
            console.log(`\n   Testando para usuário: ${superAdmin.email}`);
            // Simular o contexto do usuário usando SQL
            const { data: testResult, error: testError } = await supabaseAdmin
                .rpc('exec_sql', {
                sql: `
            -- Simular o contexto do usuário
            SELECT 
              '${superAdmin.user_metadata?.role}' as user_role_metadata,
              is_super_admin() as is_super_admin_result;
          `
            });
            if (testError) {
                console.log(`   ❌ Erro ao testar função: ${testError.message}`);
            }
            else {
                console.log('   ✅ Resultado do teste:', testResult);
            }
        }
        // 4. Verificar se a função is_super_admin está funcionando corretamente
        console.log('\n4. Verificando implementação da função is_super_admin...');
        const { data: functionCode, error: functionError } = await supabaseAdmin
            .rpc('exec_sql', {
            sql: `
          SELECT prosrc as function_code
          FROM pg_proc 
          WHERE proname = 'is_super_admin';
        `
        });
        if (functionError) {
            console.log('❌ Erro ao buscar código da função:', functionError.message);
        }
        else {
            console.log('✅ Código da função is_super_admin:');
            console.log(functionCode[0]?.function_code || 'Função não encontrada');
        }
    }
    catch (error) {
        console.error('❌ Erro durante debug:', error);
    }
}
// Executar o debug
debugSuperAdminPermissions().catch(console.error);
