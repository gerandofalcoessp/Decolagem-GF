const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function analyzeGoals() {
  console.log('📊 Analisando Goals no Banco de Dados...\n');
  
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Erro ao buscar goals:', error);
    return;
  }
  
  console.log(`✅ Encontrados ${goals.length} goals\n`);
  
  goals.forEach((goal, index) => {
    console.log(`${index + 1}. 📋 ${goal.nome}`);
    console.log(`   📝 Descrição: "${goal.descricao}"`);
    console.log(`   🏷️ Campo 'area': ${goal.area || 'null'}`);
    
    // Extrair regionais da descrição
    const regionaisMatch = goal.descricao.match(/(?:regional|regionais|área|áreas):\s*([^|\n]+)/i);
    if (regionaisMatch) {
      const regionaisStr = regionaisMatch[1].trim();
      console.log(`   🎯 Regionais extraídas: "${regionaisStr}"`);
      
      if (regionaisStr.toLowerCase() === 'nacional') {
        console.log('   ✅ DEVE MOSTRAR: "Nacional" (regional específica)');
      } else if (regionaisStr.toLowerCase().includes('todas')) {
        console.log('   ✅ DEVE MOSTRAR: "Todas" (todas as regionais)');
      } else {
        console.log(`   ✅ DEVE MOSTRAR: "${regionaisStr}" (regionais específicas)`);
      }
    } else {
      console.log('   ⚠️ Nenhuma regional encontrada na descrição');
    }
    
    console.log('   ' + '─'.repeat(50));
  });
}

analyzeGoals().catch(console.error);