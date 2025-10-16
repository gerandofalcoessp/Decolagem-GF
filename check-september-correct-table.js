const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSeptemberActivities() {
  console.log('🔍 Verificando atividades de setembro na tabela CORRETA: regional_activities\n');

  try {
    // 1. Verificar se a tabela existe e quantos registros tem
    console.log('📊 1. Verificando total de registros na tabela regional_activities...');
    const { count: totalCount, error: countError } = await supabase
      .from('regional_activities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Erro ao contar registros:', countError.message);
      return;
    }

    console.log(`✅ Total de registros na tabela regional_activities: ${totalCount}\n`);

    if (totalCount === 0) {
      console.log('⚠️ A tabela regional_activities está vazia!');
      return;
    }

    // 2. Buscar atividades de setembro por activity_date
    console.log('🗓️ 2. Buscando atividades com activity_date em setembro de 2025...');
    const { data: septemberByDate, error: dateError } = await supabase
      .from('regional_activities')
      .select('*')
      .gte('activity_date', '2025-09-01')
      .lt('activity_date', '2025-10-01');

    if (dateError) {
      console.error('❌ Erro ao buscar por activity_date:', dateError.message);
    } else {
      console.log(`📅 Atividades encontradas por activity_date (setembro 2025): ${septemberByDate?.length || 0}`);
      if (septemberByDate && septemberByDate.length > 0) {
        console.log('📋 Detalhes das atividades encontradas:');
        septemberByDate.forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.title} - ${activity.activity_date} - Regional: ${activity.regional}`);
        });
      }
    }

    // 3. Buscar atividades de setembro de qualquer ano
    console.log('\n🗓️ 3. Buscando atividades de setembro (qualquer ano)...');
    const { data: septemberAnyYear, error: anyYearError } = await supabase
      .from('regional_activities')
      .select('*')
      .ilike('activity_date', '%-09-%');

    if (anyYearError) {
      console.error('❌ Erro ao buscar setembro de qualquer ano:', anyYearError.message);
    } else {
      console.log(`📅 Atividades encontradas em setembro (qualquer ano): ${septemberAnyYear?.length || 0}`);
      if (septemberAnyYear && septemberAnyYear.length > 0) {
        console.log('📋 Detalhes das atividades encontradas:');
        septemberAnyYear.forEach((activity, index) => {
          console.log(`   ${index + 1}. ${activity.title} - ${activity.activity_date} - Regional: ${activity.regional}`);
        });
      }
    }

    // 4. Mostrar algumas atividades de exemplo para entender a estrutura
    console.log('\n📝 4. Exemplos de atividades na tabela (primeiros 5 registros):');
    const { data: examples, error: exampleError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (exampleError) {
      console.error('❌ Erro ao buscar exemplos:', exampleError.message);
    } else if (examples && examples.length > 0) {
      examples.forEach((activity, index) => {
        console.log(`\n--- Exemplo ${index + 1} ---`);
        console.log(`ID: ${activity.id}`);
        console.log(`Título: ${activity.title}`);
        console.log(`Data: ${activity.activity_date}`);
        console.log(`Regional: ${activity.regional}`);
        console.log(`Tipo: ${activity.type}`);
        console.log(`Status: ${activity.status}`);
      });
    }

    // 5. Verificar distribuição por mês
    console.log('\n📊 5. Distribuição de atividades por mês/ano:');
    const { data: allActivities, error: allError } = await supabase
      .from('regional_activities')
      .select('activity_date');

    if (allError) {
      console.error('❌ Erro ao buscar todas as atividades:', allError.message);
    } else if (allActivities && allActivities.length > 0) {
      const monthCounts = {};
      allActivities.forEach(activity => {
        if (activity.activity_date) {
          const monthYear = activity.activity_date.substring(0, 7); // YYYY-MM
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        }
      });

      console.log('📈 Atividades por mês:');
      Object.keys(monthCounts)
        .sort()
        .forEach(monthYear => {
          console.log(`   ${monthYear}: ${monthCounts[monthYear]} atividades`);
        });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar a verificação
checkSeptemberActivities()
  .then(() => {
    console.log('\n✅ Verificação concluída!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erro na execução:', error);
    process.exit(1);
  });