require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMembersTable() {
  console.log('🔍 Verificando tabela members...\n');

  try {
    // 1. Buscar todos os members
    console.log('1. Buscando todos os members...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }

    console.log('👥 Total de members encontrados:', members.length);

    if (members.length > 0) {
      console.log('\n📋 Primeiros 5 members:');
      members.slice(0, 5).forEach((member, index) => {
        console.log(`${index + 1}. ID: ${member.id}`);
        console.log(`   Nome: ${member.name || member.nome || 'N/A'}`);
        console.log(`   Email: ${member.email || 'N/A'}`);
        console.log(`   Role: ${member.role || 'N/A'}`);
        console.log(`   Auth User ID: ${member.auth_user_id || 'N/A'}`);
        console.log('');
      });
    }

    // 2. Verificar se o member_id problemático existe
    console.log('2. Verificando member_id problemático...');
    const problematicMemberId = 'bb8b6d26-1cc4-488e-883f-e27639b0bce9';
    
    const { data: problematicMember, error: problematicError } = await supabase
      .from('members')
      .select('*')
      .eq('id', problematicMemberId)
      .single();

    if (problematicError) {
      console.log('❌ Member problemático não encontrado:', problematicError.message);
    } else {
      console.log('✅ Member problemático encontrado:', problematicMember);
    }

    // 3. Buscar member do usuário logado
    console.log('\n3. Buscando member do usuário logado...');
    const { data: loggedMember, error: loggedError } = await supabase
      .from('members')
      .select('*')
      .eq('email', 'coord.regional.sp@gerandofalcoes.com')
      .single();

    if (loggedError) {
      console.log('❌ Member do usuário logado não encontrado:', loggedError.message);
    } else {
      console.log('✅ Member do usuário logado encontrado:');
      console.log(`   ID: ${loggedMember.id}`);
      console.log(`   Nome: ${loggedMember.name || loggedMember.nome}`);
      console.log(`   Email: ${loggedMember.email}`);
      console.log(`   Role: ${loggedMember.role}`);
    }

    // 4. Verificar metas existentes e seus member_ids
    console.log('\n4. Verificando metas existentes...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('id, nome, member_id');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log('🎯 Total de metas:', goals.length);
    
    // Agrupar metas por member_id
    const goalsByMember = {};
    goals.forEach(goal => {
      if (!goalsByMember[goal.member_id]) {
        goalsByMember[goal.member_id] = [];
      }
      goalsByMember[goal.member_id].push(goal);
    });

    console.log('\n📊 Metas agrupadas por member_id:');
    for (const memberId in goalsByMember) {
      const memberGoals = goalsByMember[memberId];
      console.log(`\n🆔 Member ID: ${memberId}`);
      console.log(`   Número de metas: ${memberGoals.length}`);
      
      // Verificar se este member_id existe na tabela members
      const { data: memberExists } = await supabase
        .from('members')
        .select('name, nome, email')
        .eq('id', memberId)
        .single();
      
      if (memberExists) {
        console.log(`   ✅ Member válido: ${memberExists.name || memberExists.nome} (${memberExists.email})`);
      } else {
        console.log(`   ❌ Member inválido - não existe na tabela members`);
        console.log('   Metas afetadas:');
        memberGoals.forEach(goal => {
          console.log(`     - ${goal.nome}`);
        });
      }
    }

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
checkMembersTable();