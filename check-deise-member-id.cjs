const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ldfldwfvspclsnpgjgmv.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZmxkd2Z2c3BjbHNucGdqZ212Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTI3MzUyNCwiZXhwIjoyMDc0ODQ5NTI0fQ.vjoLmfwissSJZPddjiMBOQjIznyFPaAHkgpY8qGS1CE';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDeiseMemberId() {
  console.log('🔍 Verificando member_id da Deise...\n');

  try {
    // 1. Buscar Deise na tabela members
    console.log('1️⃣ Buscando Deise na tabela members...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('email', 'coord.regional.co@gerandofalcoes.com');

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError.message);
      return;
    }

    if (!members || members.length === 0) {
      console.log('⚠️ Deise não encontrada na tabela members');
      return;
    }

    const deiseMember = members[0];
    console.log('✅ Deise encontrada na tabela members:');
    console.log('   - ID:', deiseMember.id);
    console.log('   - Nome:', deiseMember.name);
    console.log('   - Email:', deiseMember.email);
    console.log('   - Regional:', deiseMember.regional);
    console.log('   - Auth User ID:', deiseMember.auth_user_id);

    // 2. Buscar usuário na tabela auth
    console.log('\n2️⃣ Buscando usuário na tabela auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar auth users:', authError.message);
      return;
    }

    const deiseAuthUser = authUsers.users.find(user => user.email === 'coord.regional.co@gerandofalcoes.com');
    
    if (deiseAuthUser) {
      console.log('✅ Deise encontrada na tabela auth:');
      console.log('   - Auth ID:', deiseAuthUser.id);
      console.log('   - Email:', deiseAuthUser.email);
      console.log('   - Created:', deiseAuthUser.created_at);
    } else {
      console.log('⚠️ Deise não encontrada na tabela auth');
    }

    // 3. Verificar se os IDs coincidem
    console.log('\n3️⃣ Verificando correspondência de IDs...');
    if (deiseAuthUser && deiseMember.auth_user_id === deiseAuthUser.id) {
      console.log('✅ IDs coincidem corretamente');
      console.log('   - Member ID para usar:', deiseMember.id);
      console.log('   - Auth User ID:', deiseAuthUser.id);
    } else {
      console.log('⚠️ IDs não coincidem:');
      console.log('   - Member auth_user_id:', deiseMember.auth_user_id);
      console.log('   - Auth user ID:', deiseAuthUser?.id || 'N/A');
    }

    // 4. Buscar atividades existentes da Deise
    console.log('\n4️⃣ Buscando atividades existentes da Deise...');
    const { data: activities, error: activitiesError } = await supabase
      .from('regional_activities')
      .select('*')
      .eq('member_id', deiseMember.id)
      .limit(5);

    if (activitiesError) {
      console.error('❌ Erro ao buscar atividades:', activitiesError.message);
    } else {
      console.log(`✅ Encontradas ${activities.length} atividades da Deise`);
      activities.forEach((activity, index) => {
        console.log(`   ${index + 1}. ${activity.title} (ID: ${activity.id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

checkDeiseMemberId();