import 'dotenv/config';
import { supabaseAdmin } from '../services/supabaseClient';
async function createMemberEntriesForSuperAdmins() {
    console.log('🔧 Criando entradas na tabela members para super admins...\n');
    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin não configurado');
        return;
    }
    try {
        // 1. Buscar todos os super admins
        console.log('1. Buscando super admins existentes...');
        const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
        if (usersError) {
            console.error('❌ Erro ao buscar usuários:', usersError);
            return;
        }
        const superAdmins = users.users.filter(user => user.user_metadata?.role === 'super_admin');
        console.log(`✅ Encontrados ${superAdmins.length} super admins`);
        if (superAdmins.length === 0) {
            console.log('ℹ️  Nenhum super admin encontrado');
            return;
        }
        // 2. Verificar quais já têm entradas na tabela members
        console.log('\n2. Verificando entradas existentes na tabela members...');
        const superAdminIds = superAdmins.map(user => user.id);
        const { data: existingMembers, error: membersError } = await supabaseAdmin
            .from('members')
            .select('auth_user_id')
            .in('auth_user_id', superAdminIds);
        if (membersError) {
            console.error('❌ Erro ao verificar members existentes:', membersError);
            return;
        }
        const existingMemberIds = existingMembers?.map(m => m.auth_user_id) || [];
        const missingMembers = superAdmins.filter(user => !existingMemberIds.includes(user.id));
        console.log(`✅ ${existingMembers?.length || 0} super admins já têm entradas na tabela members`);
        console.log(`⚠️  ${missingMembers.length} super admins precisam de entradas na tabela members`);
        // 3. Criar entradas para super admins que não têm
        if (missingMembers.length > 0) {
            console.log('\n3. Criando entradas na tabela members...');
            for (const user of missingMembers) {
                console.log(`Criando entrada para: ${user.email} (${user.id})`);
                const memberData = {
                    auth_user_id: user.id,
                    name: user.user_metadata?.nome || user.email?.split('@')[0] || 'Super Admin',
                    email: user.email,
                    created_at: new Date().toISOString()
                };
                const { error: insertError } = await supabaseAdmin
                    .from('members')
                    .insert(memberData);
                if (insertError) {
                    console.error(`❌ Erro ao criar entrada para ${user.email}:`, insertError);
                }
                else {
                    console.log(`✅ Entrada criada para ${user.email}`);
                }
            }
        }
        // 4. Verificar se todas as entradas foram criadas
        console.log('\n4. Verificando resultado final...');
        const { data: finalMembers, error: finalError } = await supabaseAdmin
            .from('members')
            .select('auth_user_id, name, email')
            .in('auth_user_id', superAdminIds);
        if (finalError) {
            console.error('❌ Erro na verificação final:', finalError);
            return;
        }
        console.log(`✅ Total de super admins com entradas na tabela members: ${finalMembers?.length || 0}`);
        if (finalMembers) {
            finalMembers.forEach(member => {
                console.log(`  - ${member.nome} (${member.email}) - ${member.role}`);
            });
        }
        console.log('\n🎉 Processo concluído com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro durante o processo:', error);
    }
}
createMemberEntriesForSuperAdmins().catch(console.error);
