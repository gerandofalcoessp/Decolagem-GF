const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStatsEndpoint() {
  try {
    console.log('🧪 Testando lógica do endpoint /api/instituicoes/stats...\n');
    
    // Simular a mesma lógica do endpoint
    
    // 1. Contagem total de instituições
    const { count: totalInstituicoes, error: totalError } = await supabase
      .from('instituicoes')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('❌ Erro ao contar total:', totalError.message);
      return;
    }

    console.log(`📊 Total de instituições: ${totalInstituicoes}`);

    // 2. Contagem por programa
    const { data: programData, error: programError } = await supabase
      .from('instituicoes')
      .select('programa')
      .not('programa', 'is', null);

    if (programError) {
      console.error('❌ Erro ao buscar dados de programa:', programError.message);
      return;
    }

    console.log(`📋 Dados de programa encontrados: ${programData.length} registros`);

    // 3. Contagem por regional (área)
    const { data: regionalData, error: regionalError } = await supabase
      .from('instituicoes')
      .select('regional')
      .not('regional', 'is', null);

    if (regionalError) {
      console.error('❌ Erro ao buscar dados regionais:', regionalError.message);
      return;
    }

    console.log(`🗺️ Dados regionais encontrados: ${regionalData.length} registros`);

    // 4. Processar contagens por programa
    const programCounts = programData.reduce((acc, item) => {
      const programa = item.programa;
      acc[programa] = (acc[programa] || 0) + 1;
      return acc;
    }, {});

    console.log('\n📈 Contagens por programa:');
    Object.entries(programCounts).forEach(([programa, count]) => {
      console.log(`  ${programa}: ${count}`);
    });

    // 5. Processar contagens por regional
    const regionalCounts = regionalData.reduce((acc, item) => {
      const regional = item.regional;
      acc[regional] = (acc[regional] || 0) + 1;
      return acc;
    }, {});

    console.log('\n🗺️ Contagens por regional:');
    Object.entries(regionalCounts).forEach(([regional, count]) => {
      console.log(`  ${regional}: ${count}`);
    });

    // 6. Contagens específicas para ONGs Maras e Decolagem
    const ongsMaras = programCounts['as_maras'] || 0;
    const ongsDecolagem = programCounts['decolagem'] || 0;
    const ongsMicrocredito = programCounts['microcredito'] || 0;

    console.log('\n🎯 Contagens específicas:');
    console.log(`  ONGs Maras (as_maras): ${ongsMaras}`);
    console.log(`  ONGs Decolagem (decolagem): ${ongsDecolagem}`);
    console.log(`  ONGs Microcrédito (microcredito): ${ongsMicrocredito}`);

    // 7. Montar objeto de estatísticas final
    const stats = {
      total: totalInstituicoes || 0,
      porPrograma: {
        as_maras: ongsMaras,
        decolagem: ongsDecolagem,
        microcredito: ongsMicrocredito
      },
      porRegional: regionalCounts,
      resumo: {
        ongsMaras,
        ongsDecolagem,
        ongsMicrocredito,
        totalPorArea: Object.keys(regionalCounts).length
      }
    };

    console.log('\n📊 Objeto de estatísticas final:');
    console.log(JSON.stringify(stats, null, 2));

    // 8. Verificar se há dados suficientes para os cards
    console.log('\n✅ Verificação dos cards:');
    console.log(`  Total Instituições: ${stats.total} (${stats.total > 0 ? '✅' : '❌'})`);
    console.log(`  ONGs Maras: ${stats.porPrograma.as_maras} (${stats.porPrograma.as_maras > 0 ? '✅' : '❌'})`);
    console.log(`  ONGs Decolagem: ${stats.porPrograma.decolagem} (${stats.porPrograma.decolagem > 0 ? '✅' : '❌'})`);
    console.log(`  Áreas Ativas: ${stats.resumo.totalPorArea} (${stats.resumo.totalPorArea > 0 ? '✅' : '❌'})`);

  } catch (err) {
    console.error('❌ Erro geral:', err.message);
  }
}

testStatsEndpoint();