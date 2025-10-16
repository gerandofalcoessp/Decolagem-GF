const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkNPSNacional() {
  console.log('🔍 Verificando atividades NPS nacionais no banco...');
  
  // Buscar atividades com tipo 'nps' e regional 'nacional'
  const { data: npsNacional, error: npsError } = await supabase
    .from('regional_activities')
    .select('*')
    .eq('type', 'nps')
    .eq('regional', 'nacional')
    .order('created_at', { ascending: false });
    
  if (npsError) {
    console.error('❌ Erro ao buscar NPS nacional:', npsError);
  } else {
    console.log('📊 Atividades NPS nacionais encontradas:', npsNacional.length);
    npsNacional.forEach((activity, index) => {
      console.log(`\n📋 NPS Nacional ${index + 1}:`);
      console.log('  ID:', activity.id);
      console.log('  Título:', activity.title);
      console.log('  Regional:', activity.regional);
      console.log('  Tipo:', activity.type);
      console.log('  Regionais NPS:', activity.regionais_nps);
      console.log('  Data criação:', activity.created_at);
    });
  }
  
  // Buscar atividades que tenham regionais_nps preenchido (independente da regional)
  const { data: comRegionaisNPS, error: regionaisError } = await supabase
    .from('regional_activities')
    .select('*')
    .eq('type', 'nps')
    .not('regionais_nps', 'is', null)
    .order('created_at', { ascending: false });
    
  if (regionaisError) {
    console.error('❌ Erro ao buscar atividades com regionais_nps:', regionaisError);
  } else {
    console.log('\n🎯 Atividades NPS com regionais_nps preenchido:', comRegionaisNPS.length);
    comRegionaisNPS.forEach((activity, index) => {
      console.log(`\n📋 NPS com regionais ${index + 1}:`);
      console.log('  ID:', activity.id);
      console.log('  Título:', activity.title);
      console.log('  Regional:', activity.regional);
      console.log('  Regionais NPS:', activity.regionais_nps);
      console.log('  Data criação:', activity.created_at);
    });
  }
  
  // Buscar todas as atividades NPS para comparar
  const { data: todasNPS, error: todasError } = await supabase
    .from('regional_activities')
    .select('*')
    .eq('type', 'nps')
    .order('created_at', { ascending: false });
    
  if (todasError) {
    console.error('❌ Erro ao buscar todas as NPS:', todasError);
  } else {
    console.log('\n📈 Resumo de todas as atividades NPS:');
    console.log('  Total:', todasNPS.length);
    
    const porRegional = {};
    todasNPS.forEach(activity => {
      const regional = activity.regional || 'sem_regional';
      if (!porRegional[regional]) porRegional[regional] = 0;
      porRegional[regional]++;
    });
    
    console.log('  Por regional:');
    Object.entries(porRegional).forEach(([regional, count]) => {
      console.log(`    ${regional}: ${count}`);
    });
  }
}

checkNPSNacional().catch(console.error);