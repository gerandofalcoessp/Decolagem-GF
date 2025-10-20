const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testExactFilter() {
  console.log('🎯 Testando filtros exatos...\n');

  try {
    const superAdminIds = [
      '3450ebb4-6e86-475a-9443-ed84369c5184',
      '0e63b7c4-0e3c-4295-8443-cacce34ec1c3',
      '784f9d08-b86c-4a90-849a-817866ded138'
    ];

    // 1. Testar diferentes variações do texto Rio de Janeiro
    const variations = [
      'Rio de Janeiro',
      'R. Rio de Janeiro',
      'Rio',
      'RJ'
    ];

    for (const variation of variations) {
      console.log(`\n🔍 Testando variação: "${variation}"`);
      
      const { data: goals, error } = await supabase
        .from('goals')
        .select('*')
        .in('member_id', superAdminIds)
        .ilike('descricao', `*${variation}*`);

      if (error) {
        console.error(`❌ Erro para "${variation}":`, error.message);
      } else {
        console.log(`📊 Metas encontradas: ${goals.length}`);
        goals.forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome}`);
        });
      }
    }

    // 2. Testar o filtro AND exato que deveria funcionar
    console.log('\n\n🔧 Testando filtro AND com diferentes variações...');
    
    for (const variation of variations) {
      console.log(`\n🎯 Testando AND com: "${variation}"`);
      
      const andFilter = `and(member_id.in.(${superAdminIds.join(',')}),descricao.ilike.*${variation}*)`;
      console.log('Filtro:', andFilter);
      
      const { data: andGoals, error: andError } = await supabase
        .from('goals')
        .select('*')
        .or(andFilter);

      if (andError) {
        console.error(`❌ Erro AND para "${variation}":`, andError.message);
      } else {
        console.log(`✅ Metas com AND: ${andGoals.length}`);
        andGoals.forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome}`);
        });
      }
    }

    // 3. Testar sem o filtro AND, apenas OR simples
    console.log('\n\n🔄 Testando OR simples...');
    
    const flaviaId = '10c8676e-d045-49a4-850d-ad8b99fb6110';
    const simpleFilters = [
      `member_id.eq.${flaviaId}`,
      `member_id.in.(${superAdminIds.join(',')})`,
      `descricao.ilike.*Rio*`
    ];

    console.log('Filtros OR simples:', simpleFilters);
    console.log('Filtro final:', simpleFilters.join(','));

    const { data: simpleGoals, error: simpleError } = await supabase
      .from('goals')
      .select('*')
      .or(simpleFilters.join(','));

    if (simpleError) {
      console.error('❌ Erro OR simples:', simpleError.message);
    } else {
      console.log(`✅ Metas com OR simples: ${simpleGoals.length}`);
      simpleGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        if (goal.descricao.includes('Rio')) {
          console.log(`      ⭐ CONTÉM RIO`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testExactFilter().catch(console.error);