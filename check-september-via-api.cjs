const axios = require('axios');

async function checkSeptemberViaAPI() {
  console.log('🔍 Verificando atividades de setembro através da API local...\n');

  try {
    // Testar se a API está funcionando
    console.log('🔗 Testando conexão com a API...');
    const healthResponse = await axios.get('http://localhost:4000/api/health');
    
    console.log('✅ API está funcionando');

    // Buscar atividades regionais
    console.log('\n📊 Buscando atividades regionais...');
    const activitiesResponse = await axios.get('http://localhost:4000/api/regional-activities');
    
    const activities = activitiesResponse.data;
    console.log(`✅ Total de atividades encontradas: ${activities.length}`);

    // Filtrar atividades de setembro
    const septemberActivities = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date || activity.data_inicio || activity.created_at);
      return activityDate.getMonth() === 8; // Setembro é mês 8 (0-indexed)
    });

    console.log(`📅 Atividades de setembro encontradas: ${septemberActivities.length}`);

    if (septemberActivities.length > 0) {
      console.log('\nPrimeiras 5 atividades de setembro:');
      septemberActivities.slice(0, 5).forEach((activity, index) => {
        const date = activity.activity_date || activity.data_inicio || activity.created_at;
        console.log(`  ${index + 1}. ID: ${activity.id}, Data: ${date}, Regional: ${activity.regional_id || 'N/A'}`);
      });

      // Agrupar por regional
      const byRegional = {};
      septemberActivities.forEach(activity => {
        const regional = activity.regional_id || 'Sem Regional';
        byRegional[regional] = (byRegional[regional] || 0) + 1;
      });

      console.log('\nDistribuição por regional:');
      Object.entries(byRegional).forEach(([regional, count]) => {
        console.log(`  ${regional}: ${count} atividades`);
      });
    }

    // Verificar distribuição geral por mês
    console.log('\n📊 Distribuição geral por mês/ano:');
    const monthYearCounts = {};
    activities.forEach(activity => {
      const date = new Date(activity.activity_date || activity.data_inicio || activity.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthYearCounts[monthYear] = (monthYearCounts[monthYear] || 0) + 1;
    });

    Object.entries(monthYearCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([monthYear, count]) => {
        console.log(`  ${monthYear}: ${count} atividades`);
      });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkSeptemberViaAPI();