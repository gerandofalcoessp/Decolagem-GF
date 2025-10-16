const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function criarDadosExemplo() {
  console.log('🌱 Criando dados de exemplo para regional_activities e calendar_events...\n');
  
  try {
    // Primeiro, buscar ou criar um member para usar como referência
    let { data: members, error: membersError } = await supabase
      .from('members')
      .select('id')
      .limit(1);

    if (membersError || !members || members.length === 0) {
      console.log('📝 Criando member de exemplo...');
      
      const { data: newMember, error: createError } = await supabase
        .from('members')
        .insert({
          auth_user_id: '00000000-0000-0000-0000-000000000001',
          name: 'Usuário Exemplo',
          email: 'exemplo@decolagem.com',
          regional: 'sul'
        })
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Erro ao criar member:', createError.message);
        return;
      }

      members = [newMember];
    }

    const memberId = members[0].id;
    console.log(`📊 Usando member ID: ${memberId}`);

    // Dados de exemplo para regional_activities
    const atividadesRegionais = [
      {
        member_id: memberId,
        title: 'Reunião Regional Sul',
        description: 'Reunião mensal da regional sul para planejamento de atividades',
        activity_date: '2024-01-15',
        type: 'reuniao',
        regional: 'sul',
        status: 'concluida'
      },
      {
        member_id: memberId,
        title: 'Capacitação de Líderes',
        description: 'Treinamento para novos líderes comunitários',
        activity_date: '2024-01-20',
        type: 'capacitacao',
        regional: 'sudeste',
        status: 'concluida'
      },
      {
        member_id: memberId,
        title: 'Visita às Famílias',
        description: 'Visita domiciliar para acompanhamento das famílias',
        activity_date: '2024-01-25',
        type: 'visita',
        regional: 'nordeste',
        status: 'concluida'
      },
      {
        member_id: memberId,
        title: 'Workshop de Empreendedorismo',
        description: 'Oficina sobre desenvolvimento de pequenos negócios',
        activity_date: '2024-02-01',
        type: 'workshop',
        regional: 'norte',
        status: 'planejada'
      },
      {
        member_id: memberId,
        title: 'Assembleia Geral',
        description: 'Assembleia geral da regional centro-oeste',
        activity_date: '2024-02-10',
        type: 'assembleia',
        regional: 'centro-oeste',
        status: 'planejada'
      }
    ];

    // Inserir atividades regionais
    console.log('📋 Inserindo atividades regionais...');
    const { data: insertedActivities, error: activitiesError } = await supabase
      .from('regional_activities')
      .insert(atividadesRegionais)
      .select('*');

    if (activitiesError) {
      console.error('❌ Erro ao inserir atividades regionais:', activitiesError.message);
    } else {
      console.log(`✅ ${insertedActivities.length} atividades regionais inseridas!`);
    }

    // Dados de exemplo para calendar_events
    const eventosCalendario = [
      {
        titulo: 'Conferência Nacional Decolagem',
        descricao: 'Evento anual com todas as regionais',
        tipo: 'conferencia',
        data_inicio: '2024-03-15T09:00:00Z',
        data_fim: '2024-03-17T18:00:00Z',
        regional: 'nacional'
      },
      {
        titulo: 'Encontro Regional Sul',
        descricao: 'Encontro trimestral da regional sul',
        tipo: 'encontro',
        data_inicio: '2024-02-20T14:00:00Z',
        data_fim: '2024-02-20T17:00:00Z',
        regional: 'sul'
      },
      {
        titulo: 'Capacitação Online',
        descricao: 'Treinamento virtual para todos os membros',
        tipo: 'capacitacao',
        data_inicio: '2024-02-05T19:00:00Z',
        data_fim: '2024-02-05T21:00:00Z',
        regional: 'nacional'
      },
      {
        titulo: 'Reunião Coordenadores Nordeste',
        descricao: 'Reunião mensal dos coordenadores da regional nordeste',
        tipo: 'reuniao',
        data_inicio: '2024-02-12T15:00:00Z',
        data_fim: '2024-02-12T16:30:00Z',
        regional: 'nordeste'
      },
      {
        titulo: 'Workshop Sustentabilidade',
        descricao: 'Oficina sobre práticas sustentáveis nas comunidades',
        tipo: 'workshop',
        data_inicio: '2024-02-25T10:00:00Z',
        data_fim: '2024-02-25T12:00:00Z',
        regional: 'sudeste'
      }
    ];

    // Inserir eventos do calendário
    console.log('📅 Inserindo eventos do calendário...');
    const { data: insertedEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .insert(eventosCalendario)
      .select('*');

    if (eventsError) {
      console.error('❌ Erro ao inserir eventos do calendário:', eventsError.message);
    } else {
      console.log(`✅ ${insertedEvents.length} eventos do calendário inseridos!`);
    }

    // Verificar totais
    console.log('\n📊 Verificando totais inseridos...');
    
    const { count: activitiesCount } = await supabase
      .from('regional_activities')
      .select('*', { count: 'exact', head: true });
      
    const { count: eventsCount } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true });

    console.log(`📋 Total de atividades regionais: ${activitiesCount}`);
    console.log(`📅 Total de eventos do calendário: ${eventsCount}`);

    console.log('\n🎉 Dados de exemplo criados com sucesso!');

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

criarDadosExemplo();