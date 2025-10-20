const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFlaviaCorrect() {
  console.log('🎯 Teste final - Flávia Silva com email correto\n');

  try {
    // 1. Buscar dados da Flávia com email correto
    const { data: flaviaData, error: flaviaError } = await supabase
      .from('members')
      .select('*')
      .eq('email', 'flavia.silva@gerandofalcoes.com');

    if (flaviaError) {
      console.error('❌ Erro ao buscar Flávia:', flaviaError.message);
      return;
    }

    if (!flaviaData || flaviaData.length === 0) {
      console.error('❌ Flávia não encontrada');
      return;
    }

    const flavia = flaviaData[0];
    console.log('👤 Dados da Flávia:');
    console.log(`   ID: ${flavia.id}`);
    console.log(`   Nome: ${flavia.nome || 'Nome não definido'}`);
    console.log(`   Email: ${flavia.email}`);
    console.log(`   Regional: ${flavia.regional}`);
    console.log(`   Área: ${flavia.area || 'Área não definida'}`);
    console.log(`   Role: ${flavia.role || 'Role não definida'}`);

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
    console.log('✅ Adicionado filtro para metas próprias da Flávia');
    
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
      
      console.log('\n🎉 SUCESSO! Flávia agora consegue ver as metas!');
    } else {
      console.log('❌ Nenhuma meta encontrada para Flávia');
      
      // Debug adicional
      console.log('\n🔍 Debug adicional:');
      
      // Verificar metas próprias
      const { data: ownGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('member_id', flavia.id);
      console.log(`   Metas próprias: ${ownGoals?.length || 0}`);
      
      // Verificar metas de super admins com Rio
      const { data: rioGoals } = await supabase
        .from('goals')
        .select('*')
        .in('member_id', superAdminIds)
        .ilike('descricao', '*Rio*');
      console.log(`   Metas de super admins com Rio: ${rioGoals?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testFlaviaCorrect().catch(console.error);