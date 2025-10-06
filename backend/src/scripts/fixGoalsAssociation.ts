import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixGoalsAssociation() {
  console.log('🔧 Corrigindo associação das metas...');

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

    // 2. Buscar todas as metas
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log(`📊 Total de metas encontradas: ${allGoals?.length || 0}`);

    if (!allGoals || allGoals.length === 0) {
      console.log('❌ Nenhuma meta encontrada no banco de dados');
      return;
    }

    // 3. Atualizar todas as metas para associar ao usuário correto
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

    // 4. Verificar quantas metas agora estão associadas ao usuário
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

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

fixGoalsAssociation();