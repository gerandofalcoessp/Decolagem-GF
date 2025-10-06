const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreateActivityWithResponsavel() {
  try {
    console.log('🧪 Testando criação de atividade com responsável...');
    
    // 1. Buscar um usuário para ser o responsável
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id, nome, email, regional')
      .limit(1);
      
    if (usuariosError || !usuarios || usuarios.length === 0) {
      console.error('❌ Erro ao buscar usuários:', usuariosError);
      return;
    }
    
    const responsavel = usuarios[0];
    console.log('👤 Responsável encontrado:', responsavel.nome);
    
    // 2. Buscar um member para associar à atividade
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(1);
      
    if (membersError || !members || members.length === 0) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }
    
    const member = members[0];
    console.log('👥 Member encontrado:', member.id);
    
    // 3. Criar uma atividade de teste com responsável
    const testActivity = {
      member_id: member.id,
      title: 'Atividade de Teste com Responsável',
      description: 'Esta é uma atividade de teste para verificar o campo responsável',
      activity_date: new Date().toISOString(),
      type: 'reuniao',
      titulo: 'Atividade de Teste com Responsável',
      responsavel_id: responsavel.id
    };
    
    const { data: newActivity, error: createError } = await supabase
      .from('activities')
      .insert(testActivity)
      .select()
      .single();
      
    if (createError) {
      console.error('❌ Erro ao criar atividade:', createError);
      return;
    }
    
    console.log('✅ Atividade criada com sucesso:', newActivity.id);
    
    // 4. Buscar a atividade com join para verificar se o responsável aparece
    const { data: activityWithResponsavel, error: fetchError } = await supabase
      .from('activities')
      .select(`
        id,
        title,
        description,
        activity_date,
        type,
        titulo,
        responsavel_id,
        responsavel:usuarios!activities_responsavel_id_fkey (
          id,
          nome,
          email,
          regional,
          funcao,
          area
        )
      `)
      .eq('id', newActivity.id)
      .single();
      
    if (fetchError) {
      console.error('❌ Erro ao buscar atividade com responsável:', fetchError);
    } else {
      console.log('📋 Atividade com responsável:');
      console.log('- Título:', activityWithResponsavel.title);
      console.log('- Responsável:', activityWithResponsavel.responsavel?.nome);
      console.log('- Email do responsável:', activityWithResponsavel.responsavel?.email);
      console.log('- Regional do responsável:', activityWithResponsavel.responsavel?.regional);
    }
    
    // 5. Limpar dados de teste
    await supabase
      .from('activities')
      .delete()
      .eq('id', newActivity.id);
      
    console.log('🧹 Dados de teste removidos');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testCreateActivityWithResponsavel();