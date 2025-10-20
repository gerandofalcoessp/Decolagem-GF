const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFlaviaWithCorrectIds() {
  console.log('🎯 Teste final - Flávia Silva com IDs corretos dos super admins\n');

  try {
    // 1. Dados da Flávia (já sabemos)
    const flaviaId = '10c8676e-d045-49a4-850d-ad8b99fb6110';
    const flaviaRegional = 'R. Rio de Janeiro';
    
    console.log('👤 Dados da Flávia:');
    console.log(`   ID: ${flaviaId}`);
    console.log(`   Regional: ${flaviaRegional}`);

    // 2. IDs dos super admins (do teste anterior)
    const superAdminIds = [
      '784f9d08-b86c-4a90-849a-817866ded138', // Léo martins
      '0e63b7c4-0e3c-4295-8443-cacce34ec1c3', // Erika Miranda
      '3450ebb4-6e86-475a-9443-ed84369c5184'  // Flávio Almeida
    ];
    
    console.log(`\n🔑 Super admins: ${superAdminIds.length}`);

    // 3. Simular a lógica corrigida
    const filters = [];
    
    // Metas próprias da Flávia
    filters.push(`member_id.eq.${flaviaId}`);
    console.log('✅ Adicionado filtro para metas próprias da Flávia');
    
    // Metas de super admins com "Rio" (já que regional da Flávia contém "Rio")
    if (flaviaRegional && flaviaRegional.includes('Rio')) {
      filters.push(`and(member_id.in.(${superAdminIds.join(',')}),descricao.ilike.*Rio*)`);
      console.log('✅ Adicionado filtro para metas com "Rio"');
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
        if (goal.member_id === flaviaId) {
          console.log(`      👤 Meta própria da Flávia`);
        } else if (superAdminIds.includes(goal.member_id)) {
          console.log(`      🔑 Meta de super admin`);
        }
      });
      
      console.log('\n🎉 SUCESSO! Flávia agora consegue ver as metas!');
      console.log(`📊 Total: ${goals.length} metas visíveis`);
      
      // Contar por tipo
      const ownGoals = goals.filter(g => g.member_id === flaviaId);
      const adminGoals = goals.filter(g => superAdminIds.includes(g.member_id));
      
      console.log(`   - Metas próprias: ${ownGoals.length}`);
      console.log(`   - Metas de super admins: ${adminGoals.length}`);
      
    } else {
      console.log('❌ Nenhuma meta encontrada para Flávia');
      
      // Debug adicional
      console.log('\n🔍 Debug adicional:');
      
      // Verificar metas próprias
      const { data: ownGoals } = await supabase
        .from('goals')
        .select('*')
        .eq('member_id', flaviaId);
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

testFlaviaWithCorrectIds().catch(console.error);