const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldflwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeptemberActivities() {
  console.log('🔍 Verificando atividades de setembro na tabela regional_activities...\n');

  try {
    // Verificar atividades de setembro 2024
    console.log('📅 Verificando setembro de 2024...');
    const { data: sept2024, error: error2024 } = await supabase
      .from('regional_activities')
      .select('*')
      .gte('activity_date', '2024-09-01')
      .lt('activity_date', '2024-10-01');

    if (error2024) {
      console.error('❌ Erro ao buscar setembro 2024:', error2024);
    } else {
      console.log(`✅ Encontradas ${sept2024.length} atividades em setembro 2024`);
      if (sept2024.length > 0) {
        console.log('Primeiras 3 atividades:');
        sept2024.slice(0, 3).forEach((activity, index) => {
          console.log(`  ${index + 1}. ID: ${activity.id}, Data: ${activity.activity_date}, Regional: ${activity.regional_id}`);
        });
      }
    }

    // Verificar atividades de setembro 2025
    console.log('\n📅 Verificando setembro de 2025...');
    const { data: sept2025, error: error2025 } = await supabase
      .from('regional_activities')
      .select('*')
      .gte('activity_date', '2025-09-01')
      .lt('activity_date', '2025-10-01');

    if (error2025) {
      console.error('❌ Erro ao buscar setembro 2025:', error2025);
    } else {
      console.log(`✅ Encontradas ${sept2025.length} atividades em setembro 2025`);
      if (sept2025.length > 0) {
        console.log('Primeiras 3 atividades:');
        sept2025.slice(0, 3).forEach((activity, index) => {
          console.log(`  ${index + 1}. ID: ${activity.id}, Data: ${activity.activity_date}, Regional: ${activity.regional_id}`);
        });
      }
    }

    // Verificar todas as atividades agrupadas por mês/ano
    console.log('\n📊 Verificando distribuição de atividades por mês/ano...');
    const { data: allActivities, error: errorAll } = await supabase
      .from('regional_activities')
      .select('activity_date')
      .order('activity_date', { ascending: true });

    if (errorAll) {
      console.error('❌ Erro ao buscar todas as atividades:', errorAll);
    } else {
      const monthYearCounts = {};
      allActivities.forEach(activity => {
        const date = new Date(activity.activity_date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthYearCounts[monthYear] = (monthYearCounts[monthYear] || 0) + 1;
      });

      console.log('Distribuição por mês/ano:');
      Object.entries(monthYearCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([monthYear, count]) => {
          console.log(`  ${monthYear}: ${count} atividades`);
        });
    }

    // Verificar especificamente atividades com data_inicio em setembro
    console.log('\n📅 Verificando atividades com data_inicio em setembro...');
    const { data: septDataInicio, error: errorDataInicio } = await supabase
      .from('regional_activities')
      .select('*')
      .or('data_inicio.gte.2024-09-01,data_inicio.gte.2025-09-01')
      .or('data_inicio.lt.2024-10-01,data_inicio.lt.2025-10-01');

    if (errorDataInicio) {
      console.error('❌ Erro ao buscar por data_inicio:', errorDataInicio);
    } else {
      console.log(`✅ Encontradas ${septDataInicio.length} atividades com data_inicio em setembro`);
      if (septDataInicio.length > 0) {
        console.log('Primeiras 3 atividades:');
        septDataInicio.slice(0, 3).forEach((activity, index) => {
          console.log(`  ${index + 1}. ID: ${activity.id}, data_inicio: ${activity.data_inicio}, activity_date: ${activity.activity_date}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkSeptemberActivities();