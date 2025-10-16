const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSeptemberDataDetailed() {
  console.log('🔍 Verificação DETALHADA de dados de setembro...\n');
  
  // 1. Verificar atividades_regionais com diferentes formatos de data
  console.log('📅 === ATIVIDADES REGIONAIS ===');
  
  // Verificar com diferentes filtros de data
  const queries = [
    { name: 'Setembro 2025 (activity_date)', filter: { gte: '2025-09-01', lt: '2025-10-01' }, column: 'activity_date' },
    { name: 'Setembro 2025 (data_inicio)', filter: { gte: '2025-09-01', lt: '2025-10-01' }, column: 'data_inicio' },
    { name: 'Mês 9 (qualquer ano)', filter: null, column: 'activity_date' },
  ];
  
  for (const query of queries) {
    try {
      let supabaseQuery = supabase.from('atividades_regionais').select('*');
      
      if (query.filter) {
        supabaseQuery = supabaseQuery
          .gte(query.column, query.filter.gte)
          .lt(query.column, query.filter.lt);
      }
      
      const { data, error } = await supabaseQuery;
      
      if (error) {
        console.log(`❌ Erro em ${query.name}:`, error.message);
        continue;
      }
      
      console.log(`${query.name}: ${data?.length || 0} registros`);
      
      if (data?.length > 0) {
        console.log('Primeiros registros encontrados:');
        data.slice(0, 3).forEach((item, i) => {
          console.log(`  ${i+1}. ${item.activity_name || item.titulo || 'Sem nome'}`);
          console.log(`     Data: ${item.activity_date || item.data_inicio || 'Sem data'}`);
          console.log(`     ID: ${item.id}`);
        });
      }
    } catch (err) {
      console.log(`❌ Erro ao consultar ${query.name}:`, err.message);
    }
  }
  
  // 2. Buscar por mês 9 em qualquer formato
  console.log('\n🔍 === BUSCA POR MÊS 9 (QUALQUER FORMATO) ===');
  try {
    const { data: allActivities, error } = await supabase
      .from('atividades_regionais')
      .select('*');
      
    if (allActivities) {
      const septemberActivities = allActivities.filter(activity => {
        const dateFields = [activity.activity_date, activity.data_inicio, activity.created_at];
        
        return dateFields.some(dateField => {
          if (!dateField) return false;
          
          try {
            const date = new Date(dateField);
            return date.getMonth() === 8; // Setembro = mês 8 (0-indexed)
          } catch {
            return false;
          }
        });
      });
      
      console.log(`Atividades com mês 9 encontradas: ${septemberActivities.length}`);
      
      if (septemberActivities.length > 0) {
        console.log('Detalhes das atividades de setembro:');
        septemberActivities.forEach((activity, i) => {
          console.log(`\n  ${i+1}. ${activity.activity_name || activity.titulo || 'Sem nome'}`);
          console.log(`     ID: ${activity.id}`);
          console.log(`     activity_date: ${activity.activity_date}`);
          console.log(`     data_inicio: ${activity.data_inicio}`);
          console.log(`     created_at: ${activity.created_at}`);
          console.log(`     regional: ${activity.regional}`);
        });
      }
    }
  } catch (err) {
    console.log('❌ Erro na busca geral:', err.message);
  }
  
  // 3. Verificar estrutura da tabela
  console.log('\n📋 === ESTRUTURA DA TABELA ===');
  try {
    const { data: sample, error } = await supabase
      .from('atividades_regionais')
      .select('*')
      .limit(1);
      
    if (sample && sample.length > 0) {
      console.log('Campos disponíveis na tabela:');
      Object.keys(sample[0]).forEach(key => {
        console.log(`  - ${key}: ${typeof sample[0][key]} = ${sample[0][key]}`);
      });
    }
  } catch (err) {
    console.log('❌ Erro ao verificar estrutura:', err.message);
  }
  
  // 4. Contar total de registros
  console.log('\n📊 === ESTATÍSTICAS GERAIS ===');
  try {
    const { count, error } = await supabase
      .from('atividades_regionais')
      .select('*', { count: 'exact', head: true });
      
    console.log(`Total de atividades na tabela: ${count}`);
  } catch (err) {
    console.log('❌ Erro ao contar registros:', err.message);
  }
}

checkSeptemberDataDetailed().catch(console.error);