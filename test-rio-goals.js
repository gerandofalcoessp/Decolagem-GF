const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRioGoals() {
  console.log('🏙️ Testando metas relacionadas ao Rio de Janeiro...\n');

  try {
    // 1. Buscar metas que contenham "Rio" na descrição
    console.log('1️⃣ Buscando metas com "Rio" na descrição...');
    const { data: rioGoals, error: rioError } = await supabase
      .from('goals')
      .select('*')
      .ilike('descricao', '*Rio*');

    if (rioError) {
      console.error('❌ Erro ao buscar metas com Rio:', rioError.message);
    } else {
      console.log(`📊 Metas encontradas com "Rio": ${rioGoals.length}`);
      rioGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        console.log(`      Descrição: ${goal.descricao}`);
        console.log(`      Member ID: ${goal.member_id}`);
      });
    }

    // 2. Buscar metas que contenham "RJ" no nome
    console.log('\n2️⃣ Buscando metas com "RJ" no nome...');
    const { data: rjGoals, error: rjError } = await supabase
      .from('goals')
      .select('*')
      .ilike('nome', '*RJ*');

    if (rjError) {
      console.error('❌ Erro ao buscar metas com RJ:', rjError.message);
    } else {
      console.log(`📊 Metas encontradas com "RJ": ${rjGoals.length}`);
      rjGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        console.log(`      Descrição: ${goal.descricao}`);
        console.log(`      Member ID: ${goal.member_id}`);
      });
    }

    // 3. Testar o filtro exato que está sendo usado no código
    console.log('\n3️⃣ Testando filtro exato usado no código...');
    const regional = 'R. Rio de Janeiro';
    
    // Simular o filtro que está sendo construído
    const filters = [];
    const flaviaId = '10c8676e-d045-49a4-850d-ad8b99fb6110';
    const superAdminIds = [
      '3450ebb4-6e86-475a-9443-ed84369c5184',
      '0e63b7c4-0e3c-4295-8443-cacce34ec1c3',
      '784f9d08-b86c-4a90-849a-817866ded138'
    ];

    filters.push(`member_id.eq.${flaviaId}`);
    filters.push(`member_id.in.(${superAdminIds.join(',')})`);
    filters.push(`descricao.ilike.*${regional}*`);

    console.log('Filtros construídos:', filters);
    console.log('Filtro OR final:', filters.join(','));

    const { data: filteredGoals, error: filterError } = await supabase
      .from('goals')
      .select('*')
      .or(filters.join(','));

    if (filterError) {
      console.error('❌ Erro no filtro combinado:', filterError.message);
    } else {
      console.log(`✅ Metas encontradas com filtro combinado: ${filteredGoals.length}`);
      filteredGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        console.log(`      Descrição: ${goal.descricao}`);
        console.log(`      Member ID: ${goal.member_id}`);
      });
    }

    // 4. Testar apenas o filtro de super admins
    console.log('\n4️⃣ Testando apenas filtro de super admins...');
    const { data: adminOnlyGoals, error: adminOnlyError } = await supabase
      .from('goals')
      .select('*')
      .in('member_id', superAdminIds);

    if (adminOnlyError) {
      console.error('❌ Erro no filtro de super admins:', adminOnlyError.message);
    } else {
      console.log(`👑 Metas de super admins: ${adminOnlyGoals.length}`);
      adminOnlyGoals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        if (goal.descricao && goal.descricao.includes('Rio')) {
          console.log(`      ⭐ CONTÉM RIO: ${goal.descricao}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testRioGoals().catch(console.error);