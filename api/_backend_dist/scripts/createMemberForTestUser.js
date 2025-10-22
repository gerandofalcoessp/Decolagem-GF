import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function createMemberForTestUser() {
    console.log('👤 Criando registro na tabela members para o usuário de teste...');
    try {
        // 1. Buscar o usuário de teste
        const { data: testUser, error: userError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', 'teste@decolagem.com')
            .single();
        if (userError || !testUser) {
            console.error('❌ Usuário de teste não encontrado:', userError);
            return;
        }
        console.log('✅ Usuário de teste encontrado:', testUser.id);
        // 2. Verificar se já existe um registro na tabela members
        const { data: existingMember, error: memberError } = await supabase
            .from('members')
            .select('*')
            .eq('id', testUser.id)
            .single();
        if (existingMember) {
            console.log('✅ Registro na tabela members já existe:', existingMember.id);
            return;
        }
        // 3. Criar registro na tabela members
        const { data: newMember, error: createError } = await supabase
            .from('members')
            .insert({
            id: testUser.id,
            auth_user_id: testUser.auth_user_id,
            name: testUser.nome || 'Usuário Teste',
            email: testUser.email,
            funcao: testUser.funcao || 'Coordenador',
            area: testUser.regional || 'Nacional',
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (createError) {
            console.error('❌ Erro ao criar registro na tabela members:', createError);
            return;
        }
        console.log('✅ Registro criado na tabela members:', newMember.id);
        // 4. Agora tentar associar as metas ao usuário
        const { data: updatedGoals, error: updateError } = await supabase
            .from('goals')
            .update({ member_id: testUser.id })
            .neq('member_id', testUser.id)
            .select();
        if (updateError) {
            console.error('❌ Erro ao atualizar metas:', updateError);
            return;
        }
        console.log(`✅ ${updatedGoals?.length || 0} metas foram atualizadas!`);
        // 5. Verificar quantas metas agora estão associadas ao usuário
        const { data: userGoals, error: userGoalsError } = await supabase
            .from('goals')
            .select('*')
            .eq('member_id', testUser.id);
        if (userGoalsError) {
            console.error('❌ Erro ao verificar metas do usuário:', userGoalsError);
            return;
        }
        console.log(`✅ Total de metas associadas ao usuário: ${userGoals?.length || 0}`);
        if (userGoals && userGoals.length > 0) {
            console.log('📋 Metas associadas:');
            userGoals.forEach((goal, index) => {
                console.log(`  ${index + 1}. ${goal.nome} (ID: ${goal.id})`);
            });
        }
    }
    catch (error) {
        console.error('❌ Erro durante o processo:', error);
    }
}
createMemberForTestUser();
