const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFlaviaFinal() {
  console.log('🎯 Teste final - Flávia Silva após correção simplificada\n');

  try {
    // 1. Buscar dados da Flávia
    const { data: flaviaData, error: flaviaError } = await supabase
      .from('members')
      .select('*')
      .eq('email', 'flavia.silva@decolagem.org.br');

    if (flaviaError) {
      console.error('❌ Erro ao buscar Flávia:', flaviaError.message);
      return;
    }

    if (!flaviaData || flaviaData.length === 0) {
      console.error('❌ Flávia não encontrada');
      return;
    }

    const flavia = flaviaData[0]; // Pegar o primeiro registro
    console.log('👤 Dados da Flávia:');
    console.log(`   ID: ${flavia.id}`);
    console.log(`   Nome: ${flavia.nome}`);
    console.log(`   Regional: ${flavia.regional}`);
    console.log(`   Área: ${flavia.area}`);

    // 2. Buscar super admins
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('members')
      .select('id')
      .eq('role', 'super_admin');

    if (superAdminsError) {
      console.error('❌ Erro ao buscar super admins:', superAdminsError.message);
      return;
    }

    const superAdminIds = superAdmins.map(admin => admin.id);
    console.log(`\n🔑 Super admins encontrados: ${superAdminIds.length}`);

    // 3. Simular a lógica corrigida
    const filters = [];
    
    // Metas próprias da Flávia
    filters.push(`member_id.eq.${flavia.id}`);
    
    // Metas de super admins com "Rio" (já que regional da Flávia contém "Rio")
    if (flavia.regional && flavia.regional.includes('Rio')) {
      filters.push(`and(member_id.in.(${superAdminIds.join(',')}),descricao.ilike.*Rio*)`);
      console.log('✅ Adicionado filtro para metas com "Rio"');
    }
    
    // Metas de super admins com área (se diferente da regional)
    if (flavia.area && flavia.area !== flavia.regional) {
      filters.push(`and(member_id.in.(${superAdminIds.join(',')}),descricao.ilike.*${flavia.area}*)`);
      console.log(`✅ Adicionado filtro para área: ${flavia.area}`);
    }

    console.log('\n🔍 Filtros construídos:');
    filters.forEach((filter, index) => {
      console.log(`   ${index + 1}. ${filter}`);
    });

    // 4. Executar a consulta final
    console.log('\n🎯 Executando consulta final...');
    
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or(filters.join(','));

    if (goalsError) {
      console.error('❌ Erro na consulta:', goalsError.message);
      return;
    }

    console.log(`\n✅ Metas encontradas para Flávia: ${goals.length}`);
    
    if (goals.length > 0) {
      console.log('\n📋 Lista de metas:');
      goals.forEach((goal, index) => {
        console.log(`   ${index + 1}. ${goal.nome}`);
        if (goal.descricao && goal.descricao.includes('Rio')) {
          console.log(`      🎯 Contém "Rio" na descrição`);
        }
        if (goal.member_id === flavia.id) {
          console.log(`      👤 Meta própria da Flávia`);
        } else if (superAdminIds.includes(goal.member_id)) {
          console.log(`      🔑 Meta de super admin`);
        }
      });
    } else {
      console.log('❌ Nenhuma meta encontrada para Flávia');
    }

    // 5. Teste adicional: verificar se há metas próprias da Flávia
    console.log('\n🔍 Verificando metas próprias da Flávia...');
    const { data: ownGoals, error: ownError } = await supabase
      .from('goals')
      .select('*')
      .eq('member_id', flavia.id);

    if (ownError) {
      console.error('❌ Erro ao buscar metas próprias:', ownError.message);
    } else {
      console.log(`📊 Metas próprias da Flávia: ${ownGoals.length}`);
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testFlaviaFinal().catch(console.error);