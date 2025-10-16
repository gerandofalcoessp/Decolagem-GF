const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testNPSNacional() {
  console.log('🧪 Testando salvamento de atividade NPS nacional...');
  
  // Simular dados de uma atividade NPS nacional
  const npsNacionalData = {
    title: 'NPS Nacional - Teste',
    description: 'Teste de atividade NPS nacional para verificar se aparece em todas as atividades',
    type: 'nps',
    activity_date: new Date().toISOString().split('T')[0],
    regional: 'nacional',
    programa: JSON.stringify(['lideranca']),
    estados: JSON.stringify(['Todos os Estados']),
    quantidade: 90,
    atividade_label: 'NPS',
    regionais_nps: JSON.stringify(['nacional']),
    member_id: '00000000-0000-0000-0000-000000000000', // ID fictício para teste
    evidences: JSON.stringify([])
  };

  console.log('📝 Dados da atividade NPS nacional:', npsNacionalData);

  // Inserir no banco
  const { data, error } = await supabase
    .from('regional_activities')
    .insert(npsNacionalData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao inserir atividade NPS nacional:', error);
  } else {
    console.log('✅ Atividade NPS nacional inserida com sucesso:', data);
    
    // Verificar se a atividade foi salva corretamente
    const { data: verificacao, error: errorVerificacao } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('id', data.id)
      .single();
      
    if (errorVerificacao) {
      console.error('❌ Erro ao verificar atividade:', errorVerificacao);
    } else {
      console.log('🔍 Verificação da atividade salva:');
      console.log('  ID:', verificacao.id);
      console.log('  Título:', verificacao.title);
      console.log('  Regional:', verificacao.regional);
      console.log('  Tipo:', verificacao.type);
      console.log('  Regionais NPS:', verificacao.regionais_nps);
    }
  }
  
  // Buscar todas as atividades NPS nacionais
  const { data: todasNacionais, error: errorTodas } = await supabase
    .from('regional_activities')
    .select('*')
    .eq('type', 'nps')
    .eq('regional', 'nacional')
    .order('created_at', { ascending: false });
    
  if (errorTodas) {
    console.error('❌ Erro ao buscar atividades NPS nacionais:', errorTodas);
  } else {
    console.log('\n📊 Total de atividades NPS nacionais no banco:', todasNacionais.length);
    todasNacionais.forEach((activity, index) => {
      console.log(`\n📋 NPS Nacional ${index + 1}:`);
      console.log('  ID:', activity.id);
      console.log('  Título:', activity.title);
      console.log('  Regional:', activity.regional);
      console.log('  Data criação:', activity.created_at);
    });
  }
}

testNPSNacional().catch(console.error);