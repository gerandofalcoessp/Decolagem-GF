const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestActivityForFrontend() {
  try {
    console.log('🧪 Criando atividade de teste para visualização no frontend...');
    
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
    
    // 3. Criar uma atividade futura para aparecer na lista de próximas atividades
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2); // 2 dias no futuro
    
    const testActivity = {
      member_id: member.id,
      title: 'Reunião de Planejamento Estratégico',
      description: 'Reunião para definir as metas do próximo trimestre',
      activity_date: futureDate.toISOString(),
      type: 'reuniao',
      titulo: 'Reunião de Planejamento Estratégico',
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
    console.log('📅 Data da atividade:', futureDate.toLocaleString('pt-BR'));
    console.log('👤 Responsável:', responsavel.nome);
    console.log('📍 Esta atividade deve aparecer na lista de "Próximas Atividades" no dashboard');
    
    // 4. Verificar se a atividade foi criada corretamente com o join
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
      console.log('\n📋 Verificação da atividade criada:');
      console.log('- ID:', activityWithResponsavel.id);
      console.log('- Título:', activityWithResponsavel.title);
      console.log('- Responsável:', activityWithResponsavel.responsavel?.nome);
      console.log('- Regional:', activityWithResponsavel.responsavel?.regional);
      console.log('- Data:', new Date(activityWithResponsavel.activity_date).toLocaleString('pt-BR'));
    }
    
    console.log('\n🎯 Agora você pode verificar no frontend se o nome do responsável aparece na atividade!');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestActivityForFrontend();