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

async function consultarAtividadesFamiliasRegional() {
  try {
    console.log('🔍 Consultando atividades "Famílias Embarcadas Decolagem" por regional...\n');
    
    // Primeiro, verificar se a tabela regional_activities existe e tem dados
    const { data: allActivities, error: allError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (allError) {
      console.log('❌ Erro ao acessar regional_activities:', allError.message);
      console.log('🔄 Tentando consultar a tabela activities original...\n');
      
      // Tentar a tabela activities original
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .limit(5);

      if (activitiesError) {
        console.error('❌ Erro ao acessar activities:', activitiesError.message);
        return;
      }

      if (activitiesData && activitiesData.length > 0) {
        console.log('📋 Estrutura da tabela activities:');
        const fields = Object.keys(activitiesData[0]);
        fields.forEach(field => {
          console.log(`  - ${field}: ${typeof activitiesData[0][field]}`);
        });
        
        // Buscar atividades relacionadas a famílias
        await consultarAtividadesOriginal();
      } else {
        console.log('⚠️ Tabela activities também está vazia');
      }
      return;
    }

    if (!allActivities || allActivities.length === 0) {
      console.log('⚠️ Tabela regional_activities está vazia');
      console.log('🔄 Tentando consultar a tabela activities original...\n');
      await consultarAtividadesOriginal();
      return;
    }

    console.log('📋 Estrutura da tabela regional_activities:');
    const fields = Object.keys(allActivities[0]);
    fields.forEach(field => {
      console.log(`  - ${field}: ${typeof allActivities[0][field]}`);
    });

    // Buscar atividades específicas de "Famílias Embarcadas Decolagem"
    const { data: familiasActivities, error: familiasError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('title.ilike.%família%,title.ilike.%decolagem%,type.ilike.%família%,type.ilike.%decolagem%');

    if (familiasError) {
      console.error('❌ Erro ao buscar atividades de famílias:', familiasError.message);
      return;
    }

    if (!familiasActivities || familiasActivities.length === 0) {
      console.log('⚠️ Nenhuma atividade relacionada a "Famílias Embarcadas Decolagem" encontrada');
      
      // Mostrar algumas atividades de exemplo para entender os dados
      console.log('\n📝 Exemplos de atividades existentes:');
      allActivities.slice(0, 3).forEach((activity, index) => {
        console.log(`\n--- Atividade ${index + 1} ---`);
        console.log(`Título: ${activity.title || 'N/A'}`);
        console.log(`Tipo: ${activity.type || 'N/A'}`);
        console.log(`Regional: ${activity.regional || 'N/A'}`);
        console.log(`Data: ${activity.activity_date || activity.created_at}`);
      });
      return;
    }

    // Agrupar por regional
    const resumoPorRegional = {};
    let totalGeral = 0;

    familiasActivities.forEach(activity => {
      const regional = activity.regional || 'sem_regional';
      const regionalLabel = REGIONAL_LABELS[regional] || regional;
      
      if (!resumoPorRegional[regionalLabel]) {
        resumoPorRegional[regionalLabel] = {
          count: 0,
          atividades: []
        };
      }
      
      resumoPorRegional[regionalLabel].count++;
      resumoPorRegional[regionalLabel].atividades.push({
        titulo: activity.title,
        tipo: activity.type,
        data: activity.activity_date || activity.created_at,
        status: activity.status
      });
      
      totalGeral++;
    });

    // Exibir resultados
    console.log('\n📊 RESUMO DE ATIVIDADES "FAMÍLIAS EMBARCADAS DECOLAGEM" POR REGIONAL:');
    console.log('═══════════════════════════════════════════════════════════════════');
    
    Object.entries(resumoPorRegional)
      .sort(([,a], [,b]) => b.count - a.count)
      .forEach(([regional, dados]) => {
        console.log(`\n🏢 ${regional}: ${dados.count} atividades`);
        
        dados.atividades.forEach((atividade, index) => {
          console.log(`  ${index + 1}. ${atividade.titulo} (${atividade.tipo}) - ${atividade.data}`);
        });
      });

    console.log(`\n🎯 TOTAL GERAL: ${totalGeral} atividades registradas`);

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

async function consultarAtividadesOriginal() {
  try {
    console.log('🔍 Consultando tabela activities original...\n');
    
    // Buscar atividades que podem estar relacionadas a famílias
    const { data: activitiesData, error } = await supabase
      .from('activities')
      .select('*')
      .or('title.ilike.%família%,title.ilike.%decolagem%,titulo.ilike.%família%,titulo.ilike.%decolagem%,atividade_label.ilike.%família%');

    if (error) {
      console.error('❌ Erro ao buscar na tabela activities:', error.message);
      return;
    }

    if (!activitiesData || activitiesData.length === 0) {
      console.log('⚠️ Nenhuma atividade relacionada a famílias encontrada na tabela activities');
      
      // Mostrar total de registros na tabela
      const { count, error: countError } = await supabase
        .from('activities')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`📊 Total de registros na tabela activities: ${count}`);
        
        if (count > 0) {
          // Mostrar alguns exemplos
          const { data: examples, error: exampleError } = await supabase
            .from('activities')
            .select('*')
            .limit(3);

          if (!exampleError && examples) {
            console.log('\n📝 Exemplos de registros na tabela activities:');
            examples.forEach((activity, index) => {
              console.log(`\n--- Registro ${index + 1} ---`);
              Object.entries(activity).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  console.log(`${key}: ${JSON.stringify(value)}`);
                }
              });
            });
          }
        }
      }
      return;
    }

    console.log(`✅ Encontradas ${activitiesData.length} atividades relacionadas a famílias`);
    
    // Agrupar por regional (se existir o campo)
    const resumoPorRegional = {};
    let totalGeral = 0;

    activitiesData.forEach(activity => {
      // Tentar diferentes campos para regional
      const regional = activity.regional || activity.area || 'sem_regional';
      const regionalLabel = REGIONAL_LABELS[regional] || regional;
      
      if (!resumoPorRegional[regionalLabel]) {
        resumoPorRegional[regionalLabel] = {
          count: 0,
          atividades: []
        };
      }
      
      resumoPorRegional[regionalLabel].count++;
      resumoPorRegional[regionalLabel].atividades.push({
        titulo: activity.title || activity.titulo || activity.atividade_label,
        tipo: activity.type,
        data: activity.activity_date || activity.created_at,
        quantidade: activity.quantidade
      });
      
      totalGeral++;
    });

    // Exibir resultados
    console.log('\n📊 RESUMO DE ATIVIDADES RELACIONADAS A FAMÍLIAS POR REGIONAL:');
    console.log('═══════════════════════════════════════════════════════════════');
    
    Object.entries(resumoPorRegional)
      .sort(([,a], [,b]) => b.count - a.count)
      .forEach(([regional, dados]) => {
        console.log(`\n🏢 ${regional}: ${dados.count} atividades`);
        
        dados.atividades.forEach((atividade, index) => {
          const quantidade = atividade.quantidade ? ` (Qtd: ${atividade.quantidade})` : '';
          console.log(`  ${index + 1}. ${atividade.titulo} - ${atividade.data}${quantidade}`);
        });
      });

    console.log(`\n🎯 TOTAL GERAL: ${totalGeral} atividades registradas`);

  } catch (error) {
    console.error('❌ Erro ao consultar activities:', error.message);
  }
}

consultarAtividadesFamiliasRegional();