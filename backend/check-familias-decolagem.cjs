const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkFamiliasDecolagem() {
  console.log('=== Verificando dados de Famílias Embarcadas Decolagem ===');
  
  // 1. Buscar atividades com 'Famílias Embarcadas Decolagem'
  const { data: activities, error: activitiesError } = await supabase
    .from('activities')
    .select('*')
    .ilike('atividade_label', '%Famílias Embarcadas Decolagem%');
    
  if (activitiesError) {
    console.error('Erro ao buscar atividades:', activitiesError);
    return;
  }
  
  console.log('Total de registros encontrados:', activities?.length || 0);
  
  if (activities && activities.length > 0) {
    console.log('\nPrimeiros 3 registros:');
    activities.slice(0, 3).forEach((activity, index) => {
      console.log(`${index + 1}. Quantidade: ${activity.quantidade}, Label: ${activity.atividade_label}, Data: ${activity.data_atividade}`);
    });
    
    // Somar todas as quantidades
    const totalFamilias = activities.reduce((acc, curr) => acc + (curr.quantidade || 0), 0);
    console.log(`\nTOTAL DE FAMÍLIAS EMBARCADAS DECOLAGEM: ${totalFamilias}`);
  } else {
    console.log('Nenhum registro encontrado com "Famílias Embarcadas Decolagem"');
    
    // Tentar buscar variações
    const { data: variations, error: varError } = await supabase
      .from('activities')
      .select('atividade_label')
      .ilike('atividade_label', '%decolagem%')
      .limit(10);
      
    if (!varError && variations) {
      console.log('\nVariações encontradas com "decolagem":');
      variations.forEach(v => console.log('- ' + v.atividade_label));
    }
  }
  
  // 2. Verificar também se há dados na tabela members relacionados ao Decolagem
  console.log('\n=== Verificando members relacionados ao Decolagem ===');
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .eq('programa', 'decolagem')
    .limit(5);
    
  if (membersError) {
    console.error('Erro ao buscar members:', membersError);
  } else {
    console.log('Members do programa Decolagem encontrados:', members?.length || 0);
    if (members && members.length > 0) {
      console.log('Exemplo de member:', {
        id: members[0].id,
        name: members[0].name,
        programa: members[0].programa,
        instituicao_id: members[0].instituicao_id
      });
    }
  }
}

checkFamiliasDecolagem().catch(console.error);