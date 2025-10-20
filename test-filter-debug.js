const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFilterDebug() {
  console.log('🔧 Testando nova lógica de filtro...\n');

  try {
    const flaviaId = '10c8676e-d045-49a4-850d-ad8b99fb6110';
    const superAdminIds = [
      '3450ebb4-6e86-475a-9443-ed84369c5184',
      '0e63b7c4-0e3c-4295-8443-cacce34ec1c3',
      '784f9d08-b86c-4a90-849a-817866ded138'
    ];
    const regional = 'R. Rio de Janeiro';

    // 1. Testar filtro de metas próprias
    console.log('1️⃣ Testando metas próprias da Flávia...');
    const { data: ownGoals, error: ownError } = await supabase
      .from('goals')
      .select('*')
      .eq('member_id', flaviaId);

    if (ownError) {
      console.error('❌ Erro:', ownError.message);
    } else {
      console.log(`📊 Metas próprias: ${ownGoals.length}`);
    }

    // 2. Testar filtro AND aninhado para super admins
    console.log('\n2️⃣ Testando filtro AND aninhado...');
    const andFilter = `and(member_id.in.(${superAdminIds.join(',')}),descricao.ilike.*${regional}*)`;
    console.log('Filtro AND:', andFilter);

    const { data: andGoals, error: andError } = await supabase
      .from('goals')
      .select('*')
      .or(andFilter);

    if (andError) {
      console.error('❌ Erro no filtro AND:', andError.message);
    } else {
      console.log(`✅ Metas com filtro AND: ${andGoals.length}`);
      andGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        console.log(`      Descrição: ${goal.descricao.substring(0, 100)}...`);
      });
    }

    // 3. Testar filtro combinado completo
    console.log('\n3️⃣ Testando filtro combinado completo...');
    const filters = [];
    filters.push(`member_id.eq.${flaviaId}`);
    filters.push(`and(member_id.in.(${superAdminIds.join(',')}),descricao.ilike.*${regional}*)`);

    console.log('Filtros combinados:', filters);
    console.log('Filtro OR final:', filters.join(','));

    const { data: combinedGoals, error: combinedError } = await supabase
      .from('goals')
      .select('*')
      .or(filters.join(','));

    if (combinedError) {
      console.error('❌ Erro no filtro combinado:', combinedError.message);
    } else {
      console.log(`✅ Metas com filtro combinado: ${combinedGoals.length}`);
      combinedGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        console.log(`      Member ID: ${goal.member_id}`);
        if (goal.descricao.includes('Rio')) {
          console.log(`      ⭐ CONTÉM RIO: ${goal.descricao.substring(0, 100)}...`);
        }
      });
    }

    // 4. Testar apenas metas de super admins com Rio
    console.log('\n4️⃣ Testando apenas super admins com Rio...');
    const { data: adminRioGoals, error: adminRioError } = await supabase
      .from('goals')
      .select('*')
      .in('member_id', superAdminIds)
      .ilike('descricao', '*Rio*');

    if (adminRioError) {
      console.error('❌ Erro:', adminRioError.message);
    } else {
      console.log(`👑 Metas de super admins com Rio: ${adminRioGoals.length}`);
      adminRioGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testFilterDebug().catch(console.error);