const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugGoalsLogicDetailed() {
  console.log('=== DEBUG DETALHADO DA LÓGICA DE VISIBILIDADE DAS METAS ===\n');

  try {
    // 1. Login como usuário normal (Lemaestro)
    console.log('1. Fazendo login como usuário normal (Lemaestro)...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'lemaestro@gerandofalcoes.com',
      password: '123456'
    });

    if (authError) {
      console.error('Erro no login:', authError);
      return;
    }

    console.log('✓ Login realizado com sucesso');
    console.log('User ID:', authData.user.id);
    console.log('User role:', authData.user.user_metadata?.role || 'normal');

    // 2. Buscar o member correspondente ao usuário logado
    console.log('\n2. Buscando member do usuário logado...');
    const { data: userMember, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (memberError) {
      console.error('Erro ao buscar member:', memberError);
      return;
    }

    console.log('✓ Member encontrado:');
    console.log('Member ID:', userMember.id);
    console.log('Nome:', userMember.name);

    // 3. Buscar todos os members com auth_user_id
    console.log('\n3. Buscando todos os members com auth_user_id...');
    const { data: allMembers, error: allMembersError } = await supabase
      .from('members')
      .select('id, name, auth_user_id')
      .not('auth_user_id', 'is', null);

    if (allMembersError) {
      console.error('Erro ao buscar members:', allMembersError);
      return;
    }

    console.log(`✓ Encontrados ${allMembers.length} members com auth_user_id`);

    // 4. Verificar quais são super admins
    console.log('\n4. Verificando quais members são super admins...');
    const superAdminMemberIds = [];
    
    for (const member of allMembers) {
      try {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.auth_user_id);
        if (!userError && userData.user?.user_metadata?.role === 'super_admin') {
          superAdminMemberIds.push(member.id);
          console.log(`✓ Super admin encontrado: ${member.name} (ID: ${member.id})`);
        }
      } catch (error) {
        console.warn(`⚠ Erro ao verificar usuário ${member.auth_user_id}:`, error.message);
      }
    }

    console.log(`\nTotal de super admins encontrados: ${superAdminMemberIds.length}`);
    console.log('IDs dos super admins:', superAdminMemberIds);

    // 5. Simular a query que seria executada na API
    console.log('\n5. Simulando a query da API...');
    
    let query = supabase.from('goals').select('*');
    
    if (superAdminMemberIds.length > 0) {
      const orCondition = `member_id.eq.${userMember.id},member_id.in.(${superAdminMemberIds.join(',')})`;
      console.log('Condição OR que será aplicada:', orCondition);
      
      query = query.or(orCondition);
    } else {
      console.log('Nenhum super admin encontrado, filtrando apenas por member_id do usuário');
      query = query.eq('member_id', userMember.id);
    }

    const { data: goals, error: goalsError } = await query;

    if (goalsError) {
      console.error('Erro na query de metas:', goalsError);
      return;
    }

    console.log(`\n✓ Query executada com sucesso`);
    console.log(`Número de metas retornadas: ${goals.length}`);

    if (goals.length > 0) {
      console.log('\nPrimeiras 3 metas encontradas:');
      goals.slice(0, 3).forEach((goal, index) => {
        console.log(`Meta ${index + 1}:`);
        console.log(`  ID: ${goal.id}`);
        console.log(`  Member ID: ${goal.member_id}`);
        console.log(`  Descrição: ${goal.description.substring(0, 100)}...`);
      });

      // Verificar distribuição por member_id
      const memberIdCounts = {};
      goals.forEach(goal => {
        memberIdCounts[goal.member_id] = (memberIdCounts[goal.member_id] || 0) + 1;
      });

      console.log('\nDistribuição de metas por member_id:');
      Object.entries(memberIdCounts).forEach(([memberId, count]) => {
        console.log(`  ${memberId}: ${count} metas`);
      });
    }

    // 6. Verificar se há metas no sistema
    console.log('\n6. Verificando total de metas no sistema...');
    const { data: allGoals, error: allGoalsError } = await supabase
      .from('goals')
      .select('*');

    if (allGoalsError) {
      console.error('Erro ao buscar todas as metas:', allGoalsError);
      return;
    }

    console.log(`Total de metas no sistema: ${allGoals.length}`);

    if (allGoals.length > 0) {
      const allMemberIdCounts = {};
      allGoals.forEach(goal => {
        allMemberIdCounts[goal.member_id] = (allMemberIdCounts[goal.member_id] || 0) + 1;
      });

      console.log('\nDistribuição de TODAS as metas por member_id:');
      Object.entries(allMemberIdCounts).forEach(([memberId, count]) => {
        console.log(`  ${memberId}: ${count} metas`);
      });
    }

    // 7. Fazer logout
    await supabase.auth.signOut();
    console.log('\n✓ Logout realizado');

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugGoalsLogicDetailed();