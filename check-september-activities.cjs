const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzY5NzEsImV4cCI6MjA1MDU1Mjk3MX0.Qs8Ej7Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeptemberActivities() {
  try {
    console.log('🔍 Verificando atividades de setembro na tabela regional_activities...\n');
    
    // Buscar atividades de setembro 2024
    console.log('📅 Buscando atividades de setembro 2024...');
    const { data: sept2024, error: error2024 } = await supabase
      .from('regional_activities')
      .select('*')
      .gte('activity_date', '2024-09-01')
      .lt('activity_date', '2024-10-01')
      .eq('status', 'ativo');

    if (error2024) {
      console.error('❌ Erro ao buscar setembro 2024:', error2024);
    } else {
      console.log(`📊 Atividades encontradas em setembro 2024: ${sept2024?.length || 0}`);
      if (sept2024 && sept2024.length > 0) {
        sept2024.forEach((activity, index) => {
          console.log(`\n--- Atividade ${index + 1} (Set/2024) ---`);
          console.log(`Data: ${activity.activity_date}`);
          console.log(`Título: ${activity.title}`);
          console.log(`Regional: ${activity.regional}`);
          console.log(`Tipo: ${activity.atividade_label || activity.type}`);
          console.log(`Quantidade: ${activity.quantidade}`);
        });
      }
    }

    // Buscar atividades de setembro 2025
    console.log('\n📅 Buscando atividades de setembro 2025...');
    const { data: sept2025, error: error2025 } = await supabase
      .from('regional_activities')
      .select('*')
      .gte('activity_date', '2025-09-01')
      .lt('activity_date', '2025-10-01')
      .eq('status', 'ativo');

    if (error2025) {
      console.error('❌ Erro ao buscar setembro 2025:', error2025);
    } else {
      console.log(`📊 Atividades encontradas em setembro 2025: ${sept2025?.length || 0}`);
      if (sept2025 && sept2025.length > 0) {
        sept2025.forEach((activity, index) => {
          console.log(`\n--- Atividade ${index + 1} (Set/2025) ---`);
          console.log(`Data: ${activity.activity_date}`);
          console.log(`Título: ${activity.title}`);
          console.log(`Regional: ${activity.regional}`);
          console.log(`Tipo: ${activity.atividade_label || activity.type}`);
          console.log(`Quantidade: ${activity.quantidade}`);
        });
      }
    }

    // Buscar todas as atividades para ver as datas disponíveis
    console.log('\n📅 Verificando todas as datas disponíveis...');
    const { data: allActivities, error: allError } = await supabase
      .from('regional_activities')
      .select('activity_date, regional, title')
      .eq('status', 'ativo')
      .order('activity_date', { ascending: true });

    if (allError) {
      console.error('❌ Erro ao buscar todas as atividades:', allError);
    } else {
      console.log(`📊 Total de atividades ativas: ${allActivities?.length || 0}`);
      
      // Agrupar por mês/ano
      const dateGroups = {};
      allActivities?.forEach(activity => {
        const date = new Date(activity.activity_date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!dateGroups[monthYear]) {
          dateGroups[monthYear] = 0;
        }
        dateGroups[monthYear]++;
      });

      console.log('\n📊 Atividades por mês/ano:');
      Object.entries(dateGroups)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([monthYear, count]) => {
          console.log(`  ${monthYear}: ${count} atividades`);
        });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkSeptemberActivities();