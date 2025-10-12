const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDeleteAfterRLSFix() {
  console.log('🔍 Testando exclusão da atividade após correção do RLS...\n');

  try {
    // 1. Primeiro, vamos verificar se o RLS está funcionando
    console.log('1. Verificando se RLS está ativo...');
    
    // Tentar acessar sem autenticação (deve falhar)
    const { data: unauthData, error: unauthError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(1);
    
    if (unauthError) {
      console.log('✅ RLS está funcionando - acesso não autenticado foi bloqueado');
      console.log('   Erro:', unauthError.message);
    } else {
      console.log('⚠️  RLS pode não estar funcionando - acesso não autenticado permitido');
      console.log('   Dados retornados:', unauthData?.length || 0, 'registros');
    }

    // 2. Fazer login como Deise
    console.log('\n2. Fazendo login como Deise...');
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'coord.regional.co@gerandofalcoes.com',
      password: 'senha123'
    });

    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }

    console.log('✅ Login realizado com sucesso');
    console.log('   User ID:', authData.user.id);
    console.log('   Email:', authData.user.email);

    // 3. Verificar se consegue ver as atividades
    console.log('\n3. Verificando acesso às atividades...');
    
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('title', 'Atendidos Diretos Decolagem');

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError.message);
      return;
    }

    console.log('✅ Atividades encontradas:', activities.length);
    
    if (activities.length === 0) {
      console.log('⚠️  Atividade "Atendidos Diretos Decolagem" não encontrada');
      return;
    }

    const activity = activities[0];
    console.log('   ID da atividade:', activity.id);
    console.log('   Título:', activity.title);
    console.log('   Criador (member_id):', activity.member_id);
    console.log('   Regional:', activity.regional);

    // 4. Verificar se Deise é a criadora
    console.log('\n4. Verificando se Deise é a criadora...');
    
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (memberError) {
      console.error('❌ Erro ao buscar dados do membro:', memberError.message);
      return;
    }

    console.log('✅ Dados do membro encontrados');
    console.log('   Member ID:', member.id);
    console.log('   Nome:', member.name);
    console.log('   Regional:', member.regional);
    console.log('   Área:', member.area);

    const isCreator = activity.member_id === member.id;
    console.log('   É o criador da atividade?', isCreator ? '✅ SIM' : '❌ NÃO');

    // 5. Tentar excluir a atividade
    console.log('\n5. Tentando excluir a atividade...');
    
    const { error: deleteError } = await supabase
      .from('regional_activities')
      .delete()
      .eq('id', activity.id);

    if (deleteError) {
      console.error('❌ Erro ao excluir atividade:', deleteError.message);
      console.log('   Código do erro:', deleteError.code);
      console.log('   Detalhes:', deleteError.details);
      
      // Verificar se é um erro de RLS
      if (deleteError.message.includes('policy') || deleteError.code === '42501') {
        console.log('\n🔍 Possível problema com política RLS:');
        console.log('   - Verificar se a política DELETE está correta');
        console.log('   - Verificar se member_id corresponde ao auth.uid()');
        console.log('   - Verificar se o usuário tem role adequado');
      }
    } else {
      console.log('✅ Atividade excluída com sucesso!');
      
      // Verificar se realmente foi excluída
      const { data: checkData, error: checkError } = await supabase
        .from('regional_activities')
        .select('*')
        .eq('id', activity.id);
      
      if (checkError) {
        console.log('   Erro ao verificar exclusão:', checkError.message);
      } else if (checkData.length === 0) {
        console.log('   ✅ Confirmado: atividade foi removida do banco');
      } else {
        console.log('   ⚠️  Atividade ainda existe no banco');
      }
    }

    // 6. Recriar a atividade para próximos testes (se foi excluída)
    if (!deleteError) {
      console.log('\n6. Recriando atividade para próximos testes...');
      
      const { data: newActivity, error: createError } = await supabase
        .from('regional_activities')
        .insert({
          title: activity.title,
          description: activity.description,
          activity_date: activity.activity_date,
          member_id: activity.member_id,
          regional: activity.regional,
          status: activity.status
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao recriar atividade:', createError.message);
      } else {
        console.log('✅ Atividade recriada com ID:', newActivity.id);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o teste
testDeleteAfterRLSFix()
  .then(() => {
    console.log('\n🏁 Teste concluído');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });