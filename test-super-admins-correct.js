const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findSuperAdmins() {
  console.log('🔍 Procurando super admins no sistema...\n');

  try {
    // 1. Buscar todos os usuários do auth
    console.log('1. Buscando usuários no auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar usuários auth:', authError.message);
      return;
    }

    console.log(`✅ Total de usuários auth: ${authUsers.users.length}`);

    // 2. Filtrar super admins
    const superAdmins = authUsers.users.filter(user => 
      user.user_metadata?.role === 'super_admin'
    );

    console.log(`🔑 Super admins encontrados: ${superAdmins.length}`);

    if (superAdmins.length === 0) {
      console.log('❌ Nenhum super admin encontrado!');
      return;
    }

    // 3. Para cada super admin, buscar dados na tabela members
    const superAdminMemberIds = [];
    
    for (const superAdmin of superAdmins) {
      console.log(`\n👤 Super admin: ${superAdmin.email}`);
      console.log(`   Auth ID: ${superAdmin.id}`);
      console.log(`   Role: ${superAdmin.user_metadata?.role}`);
      console.log(`   Nome: ${superAdmin.user_metadata?.nome || 'Não definido'}`);

      // Buscar na tabela members
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('*')
        .eq('auth_user_id', superAdmin.id);

      if (memberError) {
        console.error(`   ❌ Erro ao buscar member: ${memberError.message}`);
      } else if (!memberData || memberData.length === 0) {
        console.log('   ⚠️  Não tem entrada na tabela members');
      } else {
        const member = memberData[0];
        console.log(`   ✅ Member ID: ${member.id}`);
        console.log(`   ✅ Nome: ${member.nome || 'Não definido'}`);
        console.log(`   ✅ Email: ${member.email}`);
        console.log(`   ✅ Regional: ${member.regional || 'Não definido'}`);
        
        superAdminMemberIds.push(member.id);
      }
    }

    console.log(`\n📊 Super admin member IDs encontrados: ${superAdminMemberIds.length}`);
    console.log('IDs:', superAdminMemberIds);

    // 4. Testar busca de metas de super admins
    if (superAdminMemberIds.length > 0) {
      console.log('\n🎯 Testando busca de metas de super admins...');
      
      const { data: superAdminGoals, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .in('member_id', superAdminMemberIds);

      if (goalsError) {
        console.error('❌ Erro ao buscar metas:', goalsError.message);
      } else {
        console.log(`✅ Metas de super admins: ${superAdminGoals.length}`);
        superAdminGoals.forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome}`);
        });
      }

      // 5. Testar filtro com "Rio"
      console.log('\n🌎 Testando metas de super admins com "Rio"...');
      
      const { data: rioGoals, error: rioError } = await supabase
        .from('goals')
        .select('*')
        .in('member_id', superAdminMemberIds)
        .ilike('descricao', '*Rio*');

      if (rioError) {
        console.error('❌ Erro ao buscar metas Rio:', rioError.message);
      } else {
        console.log(`✅ Metas de super admins com Rio: ${rioGoals.length}`);
        rioGoals.forEach((goal, index) => {
          console.log(`   ${index + 1}. ${goal.nome}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Erro durante busca:', error);
  }
}

findSuperAdmins().catch(console.error);