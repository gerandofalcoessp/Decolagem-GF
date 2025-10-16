const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ixqkqvfkpbwqmjwpgvqz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWtxdmZrcGJ3cW1qd3BndnF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NzI4NzEsImV4cCI6MjA1MDA0ODg3MX0.Ej1rpaPBbaFHmBbEo_TrXGIWDFBzqKM7QgIkN_-Zyxs';

const supabase = createClient(supabaseUrl, supabaseKey);

const REGIONAL_LABELS = {
  'sp': 'São Paulo',
  'rio_de_janeiro': 'Rio de Janeiro', 
  'nordeste_2': 'Nordeste 2',
  'centro_oeste': 'Centro-Oeste',
  'sul': 'Sul',
  'nordeste': 'Nordeste',
  'sudeste': 'Sudeste',
  'norte': 'Norte'
};

async function debugFamiliasDecolagem() {
  try {
    console.log('🔍 INVESTIGANDO DADOS DE FAMÍLIAS EMBARCADAS DECOLAGEM');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // 1. Verificar estrutura da tabela regional_activities
    console.log('1. Verificando estrutura da tabela regional_activities...');
    const { data: allActivities, error: allError } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(3);

    if (allError) {
      console.error('❌ Erro ao acessar regional_activities:', allError.message);
      return;
    }

    if (!allActivities || allActivities.length === 0) {
      console.log('⚠️ Tabela regional_activities está vazia');
      return;
    }

    console.log('📋 Estrutura da tabela:');
    const fields = Object.keys(allActivities[0]);
    fields.forEach(field => {
      console.log(`  - ${field}: ${typeof allActivities[0][field]} = ${allActivities[0][field]}`);
    });

    // 2. Buscar especificamente por "Famílias Embarcadas Decolagem"
    console.log('\n2. Buscando atividades "Famílias Embarcadas Decolagem"...');
    const { data: familiasData, error: familiasError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem');

    if (familiasError) {
      console.error('❌ Erro ao buscar famílias:', familiasError.message);
    } else {
      console.log(`✅ Encontradas ${familiasData?.length || 0} atividades "Famílias Embarcadas Decolagem"`);
      
      if (familiasData && familiasData.length > 0) {
        let totalFamilias = 0;
        const resumoPorRegional = {};

        familiasData.forEach(activity => {
          const regional = activity.regional || 'sem_regional';
          const regionalLabel = REGIONAL_LABELS[regional] || regional;
          const quantidade = parseInt(activity.quantidade) || 0;
          
          if (!resumoPorRegional[regionalLabel]) {
            resumoPorRegional[regionalLabel] = 0;
          }
          
          resumoPorRegional[regionalLabel] += quantidade;
          totalFamilias += quantidade;
          
          console.log(`  - ${regionalLabel}: +${quantidade} famílias (${activity.activity_date})`);
        });

        console.log('\n📊 RESUMO POR REGIONAL:');
        Object.entries(resumoPorRegional).forEach(([regional, total]) => {
          console.log(`  🏢 ${regional}: ${total} famílias`);
        });
        
        console.log(`\n🎯 TOTAL GERAL: ${totalFamilias} famílias embarcadas`);
      }
    }

    // 3. Buscar por outras variações do nome
    console.log('\n3. Buscando por variações do nome...');
    const { data: variacoesData, error: variacoesError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('atividade_label.ilike.%família%,atividade_label.ilike.%decolagem%,title.ilike.%família%,title.ilike.%decolagem%');

    if (variacoesError) {
      console.error('❌ Erro ao buscar variações:', variacoesError.message);
    } else {
      console.log(`✅ Encontradas ${variacoesData?.length || 0} atividades relacionadas`);
      
      if (variacoesData && variacoesData.length > 0) {
        const labels = [...new Set(variacoesData.map(a => a.atividade_label || a.title))];
        console.log('📝 Labels encontrados:');
        labels.forEach(label => {
          const count = variacoesData.filter(a => (a.atividade_label || a.title) === label).length;
          console.log(`  - "${label}": ${count} registros`);
        });
      }
    }

    // 4. Mostrar todos os atividade_label únicos
    console.log('\n4. Todos os atividade_label únicos na tabela...');
    const { data: allLabels, error: labelsError } = await supabase
      .from('regional_activities')
      .select('atividade_label')
      .not('atividade_label', 'is', null);

    if (labelsError) {
      console.error('❌ Erro ao buscar labels:', labelsError.message);
    } else {
      const uniqueLabels = [...new Set(allLabels.map(a => a.atividade_label))];
      console.log(`✅ ${uniqueLabels.length} labels únicos encontrados:`);
      uniqueLabels.forEach(label => {
        console.log(`  - "${label}"`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

debugFamiliasDecolagem();