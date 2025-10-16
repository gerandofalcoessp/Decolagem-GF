// Debug específico para o problema do filtro de setembro no Dashboard
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqhqjqjqjqjqjqjqjqj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWhxanFqcWpxanFqcWpxanFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzQ0MDAsImV4cCI6MjA1MTUxMDQwMH0.Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8Ky8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSeptemberDashboard() {
  console.log('🔍 === DEBUG FILTRO SETEMBRO DASHBOARD ===\n');

  try {
    // 1. Buscar todas as atividades regionais
    console.log('1. Buscando todas as atividades regionais...');
    const { data: allActivities, error: allError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('status', 'ativo')
      .order('activity_date');

    if (allError) {
      console.error('❌ Erro ao buscar atividades:', allError);
      return;
    }

    console.log(`📊 Total de atividades ativas: ${allActivities.length}`);

    // 2. Filtrar atividades por mês (simulando a lógica do Dashboard)
    console.log('\n2. Simulando filtro por mês (como no Dashboard)...');
    
    const filterByMonth = (activities, monthNumber) => {
      return activities.filter(activity => {
        let mesMatch = false;
        
        // Verificar activity_date (principal campo usado)
        if (activity.activity_date) {
          const date = new Date(activity.activity_date);
          if (!isNaN(date.getTime())) {
            const mes = (date.getMonth() + 1).toString();
            mesMatch = monthNumber === mes;
          }
        } 
        // Fallback para data_inicio
        else if (activity.data_inicio) {
          const date = new Date(activity.data_inicio);
          if (!isNaN(date.getTime())) {
            const mes = (date.getMonth() + 1).toString();
            mesMatch = monthNumber === mes;
          }
        } 
        // Fallback para created_at
        else if (activity.created_at) {
          const date = new Date(activity.created_at);
          if (!isNaN(date.getTime())) {
            const mes = (date.getMonth() + 1).toString();
            mesMatch = monthNumber === mes;
          }
        }
        
        return mesMatch;
      });
    };

    // Testar setembro (mês 9)
    const setemberActivities = filterByMonth(allActivities, '9');
    console.log(`📅 Atividades de setembro (mês 9): ${setemberActivities.length}`);
    
    if (setemberActivities.length > 0) {
      console.log('   Detalhes das atividades de setembro:');
      setemberActivities.forEach((activity, i) => {
        console.log(`   ${i+1}. ${activity.activity_name || activity.titulo || 'Sem nome'}`);
        console.log(`      Data: ${activity.activity_date || activity.data_inicio || activity.created_at}`);
        console.log(`      Regional: ${activity.regional}`);
        console.log(`      Status: ${activity.status}`);
      });
    }

    // Testar outubro (mês 10) para comparação
    const octoberActivities = filterByMonth(allActivities, '10');
    console.log(`\n📅 Atividades de outubro (mês 10): ${octoberActivities.length}`);

    // 3. Verificar se há metas para setembro
    console.log('\n3. Verificando metas para setembro...');
    const { data: allMetas, error: metasError } = await supabase
      .from('metas')
      .select('*')
      .order('created_at');

    if (metasError) {
      console.error('❌ Erro ao buscar metas:', metasError);
    } else {
      console.log(`📊 Total de metas: ${allMetas.length}`);
      
      const septemberMetas = allMetas.filter(meta => {
        let mesMatch = false;
        
        if (meta.dataInicio) {
          const date = new Date(meta.dataInicio);
          if (!isNaN(date.getTime())) {
            const mes = (date.getMonth() + 1).toString();
            mesMatch = '9' === mes;
          }
        } else if (meta.data_inicio) {
          const date = new Date(meta.data_inicio);
          if (!isNaN(date.getTime())) {
            const mes = (date.getMonth() + 1).toString();
            mesMatch = '9' === mes;
          }
        } else if (meta.created_at) {
          const date = new Date(meta.created_at);
          if (!isNaN(date.getTime())) {
            const mes = (date.getMonth() + 1).toString();
            mesMatch = '9' === mes;
          }
        }
        
        return mesMatch;
      });
      
      console.log(`📅 Metas de setembro: ${septemberMetas.length}`);
      
      if (septemberMetas.length > 0) {
        console.log('   Detalhes das metas de setembro:');
        septemberMetas.forEach((meta, i) => {
          console.log(`   ${i+1}. ${meta.titulo || meta.nome || 'Sem título'}`);
          console.log(`      Data: ${meta.dataInicio || meta.data_inicio || meta.created_at}`);
          console.log(`      Regional: ${meta.regional}`);
        });
      }
    }

    // 4. Simular a lógica mesComDados do Dashboard
    console.log('\n4. Simulando lógica mesComDados do Dashboard...');
    
    const filtroMes = '9'; // Setembro
    const filtroRegional = 'todos'; // Todos
    
    // Verificar se há metas para setembro
    const metasDoMes = (allMetas || []).filter(meta => {
      let mesMatch = false;
      
      if (meta.dataInicio) {
        const date = new Date(meta.dataInicio);
        if (!isNaN(date.getTime())) {
          const mes = (date.getMonth() + 1).toString();
          mesMatch = filtroMes === mes;
        }
      } else if (meta.data_inicio) {
        const date = new Date(meta.data_inicio);
        if (!isNaN(date.getTime())) {
          const mes = (date.getMonth() + 1).toString();
          mesMatch = filtroMes === mes;
        }
      } else if (meta.created_at) {
        const date = new Date(meta.created_at);
        if (!isNaN(date.getTime())) {
          const mes = (date.getMonth() + 1).toString();
          mesMatch = filtroMes === mes;
        }
      }
      
      // Aplicar filtro regional
      let regionalMatch = true;
      if (filtroRegional !== 'todos') {
        regionalMatch = meta.regional === filtroRegional ||
          meta.regional?.includes(filtroRegional) ||
          (meta.regionais && Array.isArray(meta.regionais) && meta.regionais.includes(filtroRegional));
      }
      
      return mesMatch && regionalMatch;
    });
    
    // Verificar se há atividades regionais para setembro
    const atividadesDoMes = allActivities.filter(atividade => {
      let mesMatch = false;
      
      if (atividade.activity_date) {
        const date = new Date(atividade.activity_date);
        if (!isNaN(date.getTime())) {
          const mes = (date.getMonth() + 1).toString();
          mesMatch = filtroMes === mes;
        }
      } else if (atividade.data_inicio) {
        const date = new Date(atividade.data_inicio);
        if (!isNaN(date.getTime())) {
          const mes = (date.getMonth() + 1).toString();
          mesMatch = filtroMes === mes;
        }
      } else if (atividade.created_at) {
        const date = new Date(atividade.created_at);
        if (!isNaN(date.getTime())) {
          const mes = (date.getMonth() + 1).toString();
          mesMatch = filtroMes === mes;
        }
      }
      
      // Aplicar filtro regional
      let regionalMatch = true;
      if (filtroRegional !== 'todos') {
        regionalMatch = atividade.regional === filtroRegional && atividade.status === 'ativo';
      } else {
        regionalMatch = atividade.status === 'ativo';
      }
      
      return mesMatch && regionalMatch;
    });
    
    console.log(`📊 Metas do mês (setembro): ${metasDoMes.length}`);
    console.log(`📊 Atividades do mês (setembro): ${atividadesDoMes.length}`);
    
    // Resultado da lógica mesComDados
    const mesComDados = metasDoMes.length > 0 || atividadesDoMes.length > 0;
    console.log(`✅ mesComDados resultado: ${mesComDados}`);
    
    // 5. Análise do problema
    console.log('\n5. Análise do problema:');
    if (setemberActivities.length > 0 && !mesComDados) {
      console.log('❌ PROBLEMA IDENTIFICADO: Existem atividades de setembro, mas mesComDados retorna false');
      console.log('   Isso significa que o Dashboard não mostrará as atividades mesmo elas existindo');
    } else if (setemberActivities.length > 0 && mesComDados) {
      console.log('✅ Lógica funcionando: Existem atividades de setembro e mesComDados retorna true');
    } else if (setemberActivities.length === 0) {
      console.log('⚠️  Não há atividades de setembro no banco de dados');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugSeptemberDashboard();