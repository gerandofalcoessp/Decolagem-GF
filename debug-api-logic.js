const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugApiLogic() {
  console.log('=== SIMULANDO EXATAMENTE A LÓGICA DA API ===\n');

  try {
    // 1. Login como usuário normal
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
    console.log(`User ID: ${authData.user.id}`);
    console.log(`User role: ${authData.user.user_metadata?.role || 'user'}`);

    // 2. Buscar member do usuário logado (simulando a lógica da API)
    console.log('\n2. Buscando member do usuário logado...');
    const { data: me, error: meError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (meError) {
      console.error('Erro ao buscar member:', meError);
      return;
    }

    console.log('✓ Member encontrado:');
    console.log(`Member ID: ${me.id}`);
    console.log(`Nome: ${me.name}`);

    // 3. Verificar se é super admin
    const isUserSuperAdmin = authData.user.user_metadata?.role === 'super_admin';
    console.log(`\n3. É super admin? ${isUserSuperAdmin}`);

    if (isUserSuperAdmin) {
      console.log('Como é super admin, deveria ver todas as metas');
      
      const { data: allGoals, error: allGoalsError } = await supabase
        .from('goals')
        .select('*');

      if (allGoalsError) {
        console.error('Erro ao buscar todas as metas:', allGoalsError);
      } else {
        console.log(`✓ Total de metas (super admin): ${allGoals.length}`);
      }
    } else {
      console.log('Como é usuário normal, aplicando lógica de filtragem...');

      // 4. Buscar members com auth_user_id (EXATAMENTE como na API)
      console.log('\n4. Buscando members com auth_user_id...');
      const { data: superAdminMembers, error: superAdminError } = await supabase
        .from('members')
        .select('id, auth_user_id')
        .not('auth_user_id', 'is', null);

      if (superAdminError) {
        console.error('Erro ao buscar members:', superAdminError);
        return;
      }

      console.log(`✓ Members com auth_user_id encontrados: ${superAdminMembers.length}`);

      // 5. Verificar quais são super admins (EXATAMENTE como na API)
      console.log('\n5. Verificando quais members são super admins...');
      const superAdminMemberIds = [];
      
      for (const member of superAdminMembers) {
        try {
          console.log(`Verificando member ${member.id} (auth_user_id: ${member.auth_user_id})...`);
          
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.auth_user_id);
          
          if (userError) {
            console.log(`❌ Erro ao buscar usuário: ${userError.message}`);
            continue;
          }

          if (!userData.user) {
            console.log(`❌ Usuário não encontrado`);
            continue;
          }

          const userRole = userData.user.user_metadata?.role;
          console.log(`  Role do usuário: ${userRole}`);

          if (userRole === 'super_admin') {
            console.log(`  🎯 SUPER ADMIN! Adicionando member_id: ${member.id}`);
            superAdminMemberIds.push(member.id);
          }

        } catch (error) {
          console.log(`❌ Erro ao verificar usuário ${member.auth_user_id}:`, error.message);
        }
      }

      console.log(`\n✓ Super admin member IDs encontrados: [${superAdminMemberIds.join(', ')}]`);

      // 6. Aplicar filtro (EXATAMENTE como na API)
      console.log('\n6. Aplicando filtro de metas...');
      
      let query = supabase.from('goals').select('*');

      if (superAdminMemberIds.length > 0) {
        const orCondition = `member_id.eq.${me.id},member_id.in.(${superAdminMemberIds.join(',')})`;
        console.log(`Aplicando filtro OR: ${orCondition}`);
        query = query.or(orCondition);
      } else {
        console.log(`Aplicando filtro apenas para member_id: ${me.id}`);
        query = query.eq('member_id', me.id);
      }

      const { data: filteredGoals, error: filteredError } = await query;

      if (filteredError) {
        console.error('Erro ao executar query filtrada:', filteredError);
      } else {
        console.log(`✓ Metas retornadas após filtro: ${filteredGoals.length}`);
        
        if (filteredGoals.length > 0) {
          console.log('\nDistribuição por member_id:');
          const distribution = {};
          filteredGoals.forEach(goal => {
            distribution[goal.member_id] = (distribution[goal.member_id] || 0) + 1;
          });
          
          Object.entries(distribution).forEach(([memberId, count]) => {
            console.log(`  ${memberId}: ${count} metas`);
          });
        }
      }
    }

    // Logout
    await supabase.auth.signOut();
    console.log('\n✓ Logout realizado');

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugApiLogic();