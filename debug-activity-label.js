const { createClient } = require('@supabase/supabase-js');

async function debugActivityLabel() {
  console.log('🔍 Investigando o campo atividade_label...');
  
  // Configuração do Supabase com service role key
  const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('📊 1. Verificando estrutura da tabela regional_activities...');
    
    // Buscar algumas atividades para ver a estrutura
    const { data: activities, error } = await supabase
      .from('regional_activities')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Erro ao buscar atividades:', error);
      return;
    }

    if (activities && activities.length > 0) {
      console.log('📋 Campos disponíveis na tabela:');
      Object.keys(activities[0]).forEach(field => {
        console.log(`  - ${field}: ${typeof activities[0][field]}`);
      });
      
      console.log('\n📝 Exemplo de atividade:');
      console.log(JSON.stringify(activities[0], null, 2));
    }

    console.log('\n🎯 2. Buscando especificamente por "Famílias Embarcadas Decolagem"...');
    
    // Buscar por atividade_label exato
    const { data: familiasExatas, error: familiasError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('atividade_label', 'Famílias Embarcadas Decolagem');

    if (familiasError) {
      console.error('❌ Erro ao buscar famílias exatas:', familiasError);
    } else {
      console.log(`✅ Encontradas ${familiasExatas?.length || 0} atividades com atividade_label exato`);
      
      if (familiasExatas && familiasExatas.length > 0) {
        familiasExatas.forEach((activity, index) => {
          console.log(`\n--- Atividade ${index + 1} ---`);
          console.log(`ID: ${activity.id}`);
          console.log(`Title: ${activity.title}`);
          console.log(`Atividade Label: ${activity.atividade_label}`);
          console.log(`Type: ${activity.type}`);
          console.log(`Quantidade: ${activity.quantidade}`);
          console.log(`Regional: ${activity.regional}`);
          console.log(`Status: ${activity.status}`);
        });
      }
    }

    console.log('\n🔍 3. Buscando por variações do termo...');
    
    // Buscar por variações
    const { data: variacoes, error: variacoesError } = await supabase
      .from('regional_activities')
      .select('*')
      .or('atividade_label.ilike.%família%,atividade_label.ilike.%embarcada%,atividade_label.ilike.%decolagem%');

    if (variacoesError) {
      console.error('❌ Erro ao buscar variações:', variacoesError);
    } else {
      console.log(`✅ Encontradas ${variacoes?.length || 0} atividades com variações do termo`);
      
      if (variacoes && variacoes.length > 0) {
        console.log('\n📋 Atividades encontradas com variações:');
        variacoes.forEach((activity, index) => {
          console.log(`${index + 1}. ${activity.atividade_label} (ID: ${activity.id})`);
        });
      }
    }

    console.log('\n🔍 4. Verificando todos os valores únicos de atividade_label...');
    
    // Buscar todos os valores únicos de atividade_label
    const { data: allLabels, error: labelsError } = await supabase
      .from('regional_activities')
      .select('atividade_label')
      .not('atividade_label', 'is', null);

    if (labelsError) {
      console.error('❌ Erro ao buscar labels:', labelsError);
    } else {
      const uniqueLabels = [...new Set(allLabels?.map(item => item.atividade_label))];
      console.log(`✅ Total de labels únicos: ${uniqueLabels.length}`);
      
      console.log('\n📋 Todos os atividade_label únicos:');
      uniqueLabels.sort().forEach((label, index) => {
        console.log(`${index + 1}. "${label}"`);
      });
      
      // Procurar labels que contenham "família" ou "decolagem"
      const familiasLabels = uniqueLabels.filter(label => 
        label && (
          label.toLowerCase().includes('família') ||
          label.toLowerCase().includes('familia') ||
          label.toLowerCase().includes('decolagem') ||
          label.toLowerCase().includes('embarcada')
        )
      );
      
      console.log(`\n🎯 Labels relacionados a famílias/decolagem: ${familiasLabels.length}`);
      familiasLabels.forEach((label, index) => {
        console.log(`${index + 1}. "${label}"`);
      });
    }
    
  } catch (error) {
    console.error('💥 Erro:', error);
  }
}

debugActivityLabel();