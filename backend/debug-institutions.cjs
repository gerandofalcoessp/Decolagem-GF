const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugInstitutions() {
  try {
    console.log('🔍 Verificando dados de instituições no banco...');
    
    // Buscar todas as instituições
    const { data: instituicoes, error } = await supabase
      .from('instituicoes')
      .select('*')
      .order('regional', { ascending: true });
    
    if (error) {
      console.error('❌ Erro ao buscar instituições:', error);
      return;
    }
    
    console.log('📊 Total de instituições:', instituicoes.length);
    
    // Agrupar por regional
    const porRegional = {};
    instituicoes.forEach(inst => {
      const regional = inst.regional || 'sem_regional';
      if (!porRegional[regional]) {
        porRegional[regional] = [];
      }
      porRegional[regional].push(inst);
    });
    
    console.log('\n📍 Instituições por regional:');
    Object.keys(porRegional).sort().forEach(regional => {
      console.log(`\n${regional.toUpperCase()}:`);
      porRegional[regional].forEach(inst => {
        console.log(`  - ${inst.nome} (ID: ${inst.id})`);
        console.log(`    Status: ${inst.status || 'N/A'}`);
        console.log(`    Programa: ${inst.programa || 'N/A'}`);
      });
    });
    
    // Verificar especificamente Nordeste 2
    const nordeste2 = instituicoes.filter(inst => 
      inst.regional && (
        inst.regional.toLowerCase().includes('nordeste') && 
        inst.regional.toLowerCase().includes('2')
      )
    );
    
    console.log('\n🎯 Instituições específicas do Nordeste 2:');
    if (nordeste2.length > 0) {
      nordeste2.forEach(inst => {
        console.log(`  - ${inst.nome} (Regional: ${inst.regional})`);
      });
    } else {
      console.log('  ❌ Nenhuma instituição encontrada para Nordeste 2');
      
      // Verificar variações possíveis
      const variacoes = [
        'nordeste_2',
        'nordeste 2',
        'r. nordeste 2',
        'R. Nordeste 2',
        'nordeste2'
      ];
      
      console.log('\n🔍 Verificando variações possíveis:');
      variacoes.forEach(variacao => {
        const found = instituicoes.filter(inst => 
          inst.regional && inst.regional.toLowerCase() === variacao.toLowerCase()
        );
        if (found.length > 0) {
          console.log(`  ✅ Encontrado com "${variacao}": ${found.length} instituições`);
          found.forEach(inst => console.log(`    - ${inst.nome}`));
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

debugInstitutions();