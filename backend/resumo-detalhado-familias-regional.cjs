const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeamento de regionais para labels legíveis
const REGIONAL_LABELS = {
  'nacional': 'Nacional',
  'comercial': 'Comercial', 
  'centro_oeste': 'Centro-Oeste',
  'mg_es': 'MG/ES',
  'nordeste_1': 'Nordeste 1',
  'nordeste_2': 'Nordeste 2',
  'norte': 'Norte',
  'rj': 'RJ',
  'sp': 'SP',
  'sul': 'Sul'
};

async function resumoDetalhadoFamiliasRegional() {
  try {
    console.log('📊 RESUMO DETALHADO: FAMÍLIAS EMBARCADAS DECOLAGEM POR REGIONAL');
    console.log('═══════════════════════════════════════════════════════════════════\n');
    
    // Buscar todas as atividades de "Famílias Embarcadas Decolagem"
    const { data: familiasActivities, error } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem')
      .order('regional', { ascending: true })
      .order('activity_date', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar atividades:', error.message);
      return;
    }

    if (!familiasActivities || familiasActivities.length === 0) {
      console.log('⚠️ Nenhuma atividade "Famílias Embarcadas Decolagem" encontrada');
      return;
    }

    // Agrupar e somar por regional
    const resumoPorRegional = {};
    let totalAtividades = 0;
    let totalFamilias = 0;

    familiasActivities.forEach(activity => {
      const regional = activity.regional || 'sem_regional';
      const regionalLabel = REGIONAL_LABELS[regional] || regional;
      const quantidade = parseInt(activity.quantidade) || 0;
      
      if (!resumoPorRegional[regionalLabel]) {
        resumoPorRegional[regionalLabel] = {
          atividades: 0,
          totalFamilias: 0,
          detalhes: []
        };
      }
      
      resumoPorRegional[regionalLabel].atividades++;
      resumoPorRegional[regionalLabel].totalFamilias += quantidade;
      resumoPorRegional[regionalLabel].detalhes.push({
        data: activity.activity_date,
        quantidade: quantidade,
        responsavel: activity.responsavel_id,
        status: activity.status,
        instituicao: activity.instituicao_id
      });
      
      totalAtividades++;
      totalFamilias += quantidade;
    });

    // Exibir resultados ordenados por quantidade de famílias
    const regionaisOrdenadas = Object.entries(resumoPorRegional)
      .sort(([,a], [,b]) => b.totalFamilias - a.totalFamilias);

    regionaisOrdenadas.forEach(([regional, dados]) => {
      console.log(`🏢 ${regional.toUpperCase()}`);
      console.log(`   📋 Atividades registradas: ${dados.atividades}`);
      console.log(`   👨‍👩‍👧‍👦 Total de famílias: ${dados.totalFamilias}`);
      console.log(`   📈 Média por atividade: ${(dados.totalFamilias / dados.atividades).toFixed(1)} famílias`);
      
      console.log('   📝 Detalhes das atividades:');
      dados.detalhes.forEach((detalhe, index) => {
        console.log(`      ${index + 1}. ${detalhe.data} - ${detalhe.quantidade} famílias (Status: ${detalhe.status})`);
      });
      console.log('');
    });

    // Resumo geral
    console.log('═══════════════════════════════════════════════════════════════════');
    console.log('📊 RESUMO GERAL:');
    console.log(`   🎯 Total de atividades registradas: ${totalAtividades}`);
    console.log(`   👨‍👩‍👧‍👦 Total de famílias embarcadas: ${totalFamilias}`);
    console.log(`   🏢 Regionais com atividades: ${Object.keys(resumoPorRegional).length}`);
    console.log(`   📈 Média geral: ${(totalFamilias / totalAtividades).toFixed(1)} famílias por atividade`);

    // Ranking das regionais
    console.log('\n🏆 RANKING DAS REGIONAIS:');
    regionaisOrdenadas.forEach(([regional, dados], index) => {
      const posicao = index + 1;
      const emoji = posicao === 1 ? '🥇' : posicao === 2 ? '🥈' : posicao === 3 ? '🥉' : '📍';
      console.log(`   ${emoji} ${posicao}º lugar: ${regional} - ${dados.totalFamilias} famílias`);
    });

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

resumoDetalhadoFamiliasRegional();