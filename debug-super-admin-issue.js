const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNzM1MjQsImV4cCI6MjA3NDg0OTUyNH0.I_c31K314-UdDKWG4YxMFePAqoVjHVU8wvGHZbX0a28';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function debugSuperAdminIssue() {
  console.log('=== DEBUG DO PROBLEMA DOS SUPER ADMINS ===\n');

  try {
    // 1. Buscar todos os members
    console.log('1. Buscando TODOS os members...');
    const { data: allMembers, error: allMembersError } = await supabaseAdmin
      .from('members')
      .select('*');

    if (allMembersError) {
      console.error('Erro ao buscar todos os members:', allMembersError);
      return;
    }

    console.log(`✓ Total de members encontrados: ${allMembers.length}`);
    
    // Mostrar alguns members
    console.log('\nPrimeiros 5 members:');
    allMembers.slice(0, 5).forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - auth_user_id: ${member.auth_user_id || 'NULL'}`);
    });

    // 2. Buscar members com auth_user_id não nulo
    console.log('\n2. Buscando members com auth_user_id não nulo...');
    const { data: membersWithAuth, error: membersWithAuthError } = await supabaseAdmin
      .from('members')
      .select('*')
      .not('auth_user_id', 'is', null);

    if (membersWithAuthError) {
      console.error('Erro ao buscar members com auth_user_id:', membersWithAuthError);
      return;
    }

    console.log(`✓ Members com auth_user_id: ${membersWithAuth.length}`);
    
    console.log('\nMembers com auth_user_id:');
    membersWithAuth.forEach((member, index) => {
      console.log(`${index + 1}. ${member.name} - auth_user_id: ${member.auth_user_id}`);
    });

    // 3. Verificar usuários no auth.users
    console.log('\n3. Verificando usuários no auth.users...');
    
    for (const member of membersWithAuth) {
      try {
        console.log(`\nVerificando member: ${member.name} (${member.auth_user_id})`);
        
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(member.auth_user_id);
        
        if (userError) {
          console.error(`❌ Erro ao buscar usuário ${member.auth_user_id}:`, userError.message);
          continue;
        }

        if (!userData.user) {
          console.log(`❌ Usuário ${member.auth_user_id} não encontrado`);
          continue;
        }

        console.log(`✓ Usuário encontrado: ${userData.user.email}`);
        console.log(`  Role: ${userData.user.user_metadata?.role || 'não definido'}`);
        console.log(`  User metadata:`, JSON.stringify(userData.user.user_metadata, null, 2));

        if (userData.user.user_metadata?.role === 'super_admin') {
          console.log(`🎯 SUPER ADMIN ENCONTRADO: ${member.name} (${member.id})`);
        }

      } catch (error) {
        console.error(`❌ Erro ao verificar usuário ${member.auth_user_id}:`, error.message);
      }
    }

    // 4. Verificar especificamente o Flávio Almeida
    console.log('\n4. Verificando especificamente o Flávio Almeida...');
    const { data: flavioMember, error: flavioError } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('name', 'Flávio Almeida')
      .single();

    if (flavioError) {
      console.error('Erro ao buscar Flávio Almeida:', flavioError);
    } else {
      console.log('✓ Flávio Almeida encontrado:');
      console.log(`  ID: ${flavioMember.id}`);
      console.log(`  auth_user_id: ${flavioMember.auth_user_id || 'NULL'}`);
      console.log(`  Email: ${flavioMember.email || 'não definido'}`);
    }

    // 5. Verificar metas criadas por Flávio
    console.log('\n5. Verificando metas criadas por Flávio...');
    const { data: flavioGoals, error: flavioGoalsError } = await supabaseAdmin
      .from('goals')
      .select('*')
      .eq('member_id', '3450ebb4-6e86-475a-9443-ed84369c5184'); // ID conhecido do Flávio

    if (flavioGoalsError) {
      console.error('Erro ao buscar metas do Flávio:', flavioGoalsError);
    } else {
      console.log(`✓ Metas criadas por Flávio: ${flavioGoals.length}`);
    }

  } catch (error) {
    console.error('Erro geral:', error);
  }
}

debugSuperAdminIssue();