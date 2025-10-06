import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findExistingMemberForTestUser() {
  console.log('🔍 Procurando registro existente na tabela members...');

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

    console.log('✅ Usuário de teste encontrado:');
    console.log('  ID:', testUser.id);
    console.log('  Auth User ID:', testUser.auth_user_id);
    console.log('  Email:', testUser.email);

    // 2. Buscar registro na tabela members com o mesmo auth_user_id
    const { data: existingMember, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', testUser.auth_user_id)
      .single();

    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError);
      return;
    }

    if (existingMember) {
      console.log('✅ Registro existente na tabela members:');
      console.log('  ID:', existingMember.id);
      console.log('  Auth User ID:', existingMember.auth_user_id);
      console.log('  Name:', existingMember.name);
      console.log('  Email:', existingMember.email);

      // 3. Agora tentar associar as metas ao member_id correto
      console.log('🔄 Atualizando metas para usar o member_id correto...');
      
      const { data: updatedGoals, error: updateError } = await supabase
        .from('goals')
        .update({ member_id: existingMember.id })
        .neq('member_id', existingMember.id)
        .select();

      if (updateError) {
        console.error('❌ Erro ao atualizar metas:', updateError);
        return;
      }

      console.log(`✅ ${updatedGoals?.length || 0} metas foram atualizadas!`);

      // 4. Verificar quantas metas agora estão associadas ao usuário
      const { data: userGoals, error: userGoalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('member_id', existingMember.id);

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

  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
  }
}

findExistingMemberForTestUser();