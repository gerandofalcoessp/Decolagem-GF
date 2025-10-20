const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugGoalsFilter() {
  try {
    console.log('🔍 Debugando filtro de metas...\n');
    
    // 1. Login com Flávia
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'flavia.silva@gerandofalcoes.com',
      password: '123456'
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Buscar dados do member
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('id, regional, area, name, email')
      .eq('auth_user_id', authData.user.id)
      .single();
    
    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError);
      return;
    }
    
    console.log('👤 Dados do member:');
    console.log(`   - ID: ${memberData.id}`);
    console.log(`   - Nome: ${memberData.name}`);
    console.log(`   - Email: ${memberData.email}`);
    console.log(`   - Regional: ${memberData.regional}`);
    console.log(`   - Área: ${memberData.area}`);
    
    // 3. Buscar super admins
    console.log('\n🔑 Buscando super admins...');
    const { data: allMembers, error: membersError } = await supabaseAdmin
      .from('members')
      .select('id, auth_user_id, name, email')
      .not('auth_user_id', 'is', null);
    
    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }
    
    const superAdminMemberIds = [];
    for (const member of allMembers) {
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(member.auth_user_id);
        if (!userError && userData.user?.user_metadata?.role === 'super_admin') {
          superAdminMemberIds.push(member.id);
          console.log(`   - Super admin: ${member.name} (${member.email}) - ID: ${member.id}`);
        }
      } catch (error) {
        // Ignorar erros individuais
      }
    }
    
    console.log(`📊 Total de super admins encontrados: ${superAdminMemberIds.length}`);
    
    // 4. Testar filtros individuais
    console.log('\n🎯 Testando filtros individuais...');
    
    // 4.1. Metas próprias
    console.log('1️⃣ Metas próprias da Flávia:');
    const { data: ownGoals, error: ownError } = await supabase
      .from('goals')
      .select('*')
      .eq('member_id', memberData.id);
    
    if (!ownError) {
      console.log(`   - Encontradas: ${ownGoals.length}`);
    } else {
      console.error('   - Erro:', ownError);
    }
    
    // 4.2. Metas de super admins
    console.log('2️⃣ Metas criadas por super admins:');
    if (superAdminMemberIds.length > 0) {
      const { data: adminGoals, error: adminError } = await supabase
        .from('goals')
        .select('*')
        .in('member_id', superAdminMemberIds);
      
      if (!adminError) {
        console.log(`   - Encontradas: ${adminGoals.length}`);
        adminGoals.forEach((goal, index) => {
          console.log(`     ${index + 1}. ${goal.nome}`);
          console.log(`        - Descrição: ${goal.descricao?.substring(0, 80)}...`);
        });
      } else {
        console.error('   - Erro:', adminError);
      }
    }
    
    // 4.3. Metas por regional
    console.log('3️⃣ Metas filtradas por regional:');
    if (memberData.regional) {
      const { data: regionalGoals, error: regionalError } = await supabase
        .from('goals')
        .select('*')
        .ilike('descricao', `*${memberData.regional}*`);
      
      if (!regionalError) {
        console.log(`   - Encontradas: ${regionalGoals.length}`);
        regionalGoals.forEach((goal, index) => {
          console.log(`     ${index + 1}. ${goal.nome}`);
          console.log(`        - Descrição: ${goal.descricao?.substring(0, 80)}...`);
        });
      } else {
        console.error('   - Erro:', regionalError);
      }
    }
    
    // 5. Testar filtro combinado manual
    console.log('\n🔧 Testando filtro combinado manual...');
    const filters = [];
    
    // Metas próprias
    filters.push(`member_id.eq.${memberData.id}`);
    
    // Metas de super admins
    if (superAdminMemberIds.length > 0) {
      filters.push(`member_id.in.(${superAdminMemberIds.join(',')})`);
    }
    
    // Metas por regional
    if (memberData.regional) {
      filters.push(`descricao.ilike.*${memberData.regional}*`);
    }
    
    console.log('Filtros construídos:');
    filters.forEach((filter, index) => {
      console.log(`   ${index + 1}. ${filter}`);
    });
    
    const filterString = filters.join(',');
    console.log(`\nFiltro final: ${filterString}`);
    
    const { data: combinedGoals, error: combinedError } = await supabase
      .from('goals')
      .select('*')
      .or(filterString);
    
    if (!combinedError) {
      console.log(`✅ Metas encontradas com filtro combinado: ${combinedGoals.length}`);
      combinedGoals.forEach((goal, index) => {
        console.log(`${index + 1}. ${goal.nome}`);
        console.log(`   - Descrição: ${goal.descricao?.substring(0, 80)}...`);
        console.log(`   - Criador: ${goal.member_id}`);
        console.log('');
      });
    } else {
      console.error('❌ Erro no filtro combinado:', combinedError);
    }
    
    await supabase.auth.signOut();
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugGoalsFilter();