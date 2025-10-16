const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function getExistingMemberId() {
  console.log('🔍 Buscando member_id de atividades existentes...');
  
  // Buscar uma atividade existente para pegar um member_id válido
  const { data: activities, error } = await supabase
    .from('regional_activities')
    .select('member_id, title, regional, type')
    .limit(5);

  if (error) {
    console.error('❌ Erro ao buscar atividades:', error);
    return;
  }

  if (!activities || activities.length === 0) {
    console.log('❌ Nenhuma atividade encontrada');
    return;
  }

  console.log('✅ Atividades encontradas:', activities.length);
  
  // Pegar o primeiro member_id válido
  const validMemberId = activities[0].member_id;
  console.log('📋 Usando member_id:', validMemberId);
  
  // Agora testar o salvamento com um member_id válido
  const npsNacionalData = {
    title: 'NPS Nacional - Teste Automatizado',
    description: 'Teste de atividade NPS nacional para verificar se aparece corretamente no card nacional',
    type: 'nps',
    activity_date: new Date().toISOString().split('T')[0],
    regional: 'nacional',
    programa: JSON.stringify(['lideranca']),
    estados: JSON.stringify(['Todos os Estados']),
    quantidade: 90,
    atividade_label: 'NPS',
    regionais_nps: JSON.stringify(['nacional']),
    member_id: validMemberId,
    evidences: JSON.stringify([])
  };

  console.log('\n📝 Inserindo atividade NPS nacional...');

  const { data, error: insertError } = await supabase
    .from('regional_activities')
    .insert(npsNacionalData)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erro ao inserir atividade NPS nacional:', insertError);
  } else {
    console.log('✅ Atividade NPS nacional inserida com sucesso!');
    console.log('  ID da atividade:', data.id);
    console.log('  Título:', data.title);
    console.log('  Regional:', data.regional);
    console.log('  Tipo:', data.type);
    console.log('  Regionais NPS:', data.regionais_nps);
    
    // Verificar se agora existem atividades NPS nacionais
    const { data: nacionais, error: nacionalError } = await supabase
      .from('regional_activities')
      .select('id, title, regional, type, regionais_nps, created_at')
      .eq('type', 'nps')
      .eq('regional', 'nacional')
      .order('created_at', { ascending: false });
      
    if (nacionalError) {
      console.error('❌ Erro ao verificar atividades nacionais:', nacionalError);
    } else {
      console.log('\n📊 Total de atividades NPS nacionais:', nacionais.length);
      nacionais.forEach((activity, index) => {
        console.log(`\n📋 NPS Nacional ${index + 1}:`);
        console.log('  ID:', activity.id);
        console.log('  Título:', activity.title);
        console.log('  Regional:', activity.regional);
        console.log('  Regionais NPS:', activity.regionais_nps);
        console.log('  Data criação:', activity.created_at);
      });
    }
  }
}

getExistingMemberId().catch(console.error);