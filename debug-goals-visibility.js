const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugGoalsVisibility() {
  console.log('🔍 Debug da lógica de visibilidade das metas...\n');
  
  try {
    // 1. Verificar todos os members e seus auth_user_ids
    console.log('👥 Verificando todos os members:');
    const { data: allMembers, error: membersError } = await supabase
      .from('members')
      .select('id, name, email, auth_user_id')
      .not('auth_user_id', 'is', null);
      
    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }
    
    console.log(`📊 Total de members com auth_user_id: ${allMembers.length}`);
    
    // 2. Para cada member, verificar se é super admin
    console.log('\n🔍 Verificando roles dos usuários:');
    const superAdminMembers = [];
    
    for (const member of allMembers) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.auth_user_id);
        
        if (userError) {
          console.log(`❌ Erro ao buscar usuário ${member.email}: ${userError.message}`);
          continue;
        }
        
        const role = userData.user?.user_metadata?.role;
        console.log(`👤 ${member.name} (${member.email}): ${role || 'sem role'}`);
        
        if (role === 'super_admin') {
          superAdminMembers.push(member);
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar ${member.email}: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 Super admins encontrados: ${superAdminMembers.length}`);
    superAdminMembers.forEach(member => {
      console.log(`  - ${member.name} (${member.email}) - ID: ${member.id}`);
    });
    
    // 3. Verificar qual member criou as metas
    console.log('\n📋 Verificando quem criou as metas:');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, nome, member_id')
      .limit(5);
      
    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }
    
    const creatorMemberId = goals[0]?.member_id;
    console.log(`🎯 Member ID que criou as metas: ${creatorMemberId}`);
    
    // Encontrar o member que criou as metas
    const creatorMember = allMembers.find(m => m.id === creatorMemberId);
    if (creatorMember) {
      console.log(`👤 Criador das metas: ${creatorMember.name} (${creatorMember.email})`);
      
      // Verificar se o criador é super admin
      try {
        const { data: creatorUserData, error: creatorUserError } = await supabase.auth.admin.getUserById(creatorMember.auth_user_id);
        
        if (!creatorUserError) {
          const creatorRole = creatorUserData.user?.user_metadata?.role;
          console.log(`🔑 Role do criador: ${creatorRole}`);
          
          if (creatorRole === 'super_admin') {
            console.log('✅ O criador das metas É um super admin!');
          } else {
            console.log('❌ O criador das metas NÃO é um super admin!');
          }
        }
      } catch (error) {
        console.log(`❌ Erro ao verificar role do criador: ${error.message}`);
      }
    } else {
      console.log('❌ Não foi possível encontrar o member que criou as metas');
    }
    
    // 4. Simular a lógica da API para um usuário normal
    console.log('\n🧪 Simulando lógica da API para usuário normal:');
    const normalUser = allMembers.find(m => m.email === 'lemaestro@gerandofalcoes.com');
    
    if (normalUser) {
      console.log(`👤 Testando com: ${normalUser.name} (${normalUser.email})`);
      console.log(`   Member ID: ${normalUser.id}`);
      
      const superAdminMemberIds = superAdminMembers.map(m => m.id);
      console.log(`🎯 Super admin member IDs: [${superAdminMemberIds.join(', ')}]`);
      
      if (superAdminMemberIds.length > 0) {
        console.log(`🔍 Query seria: member_id.eq.${normalUser.id} OR member_id.in.(${superAdminMemberIds.join(',')})`);
        
        // Testar a query
        const { data: testGoals, error: testError } = await supabase
          .from('goals')
          .select('id, nome, member_id')
          .or(`member_id.eq.${normalUser.id},member_id.in.(${superAdminMemberIds.join(',')})`);
          
        if (testError) {
          console.log(`❌ Erro na query de teste: ${testError.message}`);
        } else {
          console.log(`📊 Metas que deveriam ser visíveis: ${testGoals.length}`);
          testGoals.slice(0, 3).forEach((goal, index) => {
            console.log(`   ${index + 1}. ${goal.nome} (Member: ${goal.member_id})`);
          });
        }
      } else {
        console.log('❌ Nenhum super admin encontrado, usuário veria apenas suas próprias metas');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

debugGoalsVisibility().catch(console.error);