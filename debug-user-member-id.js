require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUserMemberId() {
  console.log('🔍 Investigando member_id do usuário logado...\n');

  try {
    // 1. Fazer login via API
    console.log('1. Fazendo login via API...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'coord.regional.sp@gerandofalcoes.com',
        password: '123456'
      })
    });

    const loginData = await loginResponse.json();
    
    // Verificar se temos dados do usuário (mesmo que success não esteja presente)
    if (!loginData.user && !loginData.session) {
      console.error('❌ Erro no login:', loginData);
      return;
    }

    const token = loginData.session?.access_token;
    const userId = loginData.user?.id;
    const memberId = loginData.member?.id;
    
    console.log('✅ Login bem-sucedido!');
    console.log('🔑 User ID:', userId);
    console.log('👤 Member ID:', memberId);
    console.log('📧 Email:', loginData.user?.email);
    console.log('🎭 Role:', loginData.user?.role);

    // 2. Buscar dados do usuário via API
    console.log('\n2. Buscando dados do usuário via API...');
    const userResponse = await fetch('http://localhost:4000/api/regionals/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const userData = await userResponse.json();
    console.log('📊 Dados do usuário via API:', JSON.stringify(userData, null, 2));

    // 3. Buscar member_id diretamente no banco
    console.log('\n3. Buscando member_id no banco de dados...');
    
    // Usar o userId do login
    console.log('🔑 Auth User ID do login:', userId);

    // 4. Buscar member correspondente
    console.log('\n4. Buscando member correspondente...');
    const { data: members, error: membersError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', userId);

    if (membersError) {
      console.error('❌ Erro ao buscar members:', membersError);
      return;
    }

    console.log('👥 Members encontrados:', members.length);
    if (members.length > 0) {
      console.log('📋 Member do usuário logado:', JSON.stringify(members[0], null, 2));
    }

    // 5. Buscar todas as metas existentes
    console.log('\n5. Verificando metas existentes...');
    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log('🎯 Total de metas na tabela:', goals.length);
    if (goals.length > 0) {
      console.log('📊 Primeira meta:', JSON.stringify(goals[0], null, 2));
      
      // Verificar quantas metas pertencem ao usuário logado
      const userGoals = goals.filter(g => members.length > 0 && g.member_id === members[0].id);
      console.log(`🎯 Metas do usuário logado: ${userGoals.length}`);
      
      // Mostrar member_ids únicos nas metas
      const uniqueMemberIds = [...new Set(goals.map(g => g.member_id))];
      console.log('🆔 Member IDs únicos nas metas:', uniqueMemberIds);
      
      // Para cada member_id, buscar o nome do member
      for (const memberId of uniqueMemberIds) {
        const { data: memberInfo, error: memberInfoError } = await supabase
          .from('members')
          .select('nome, email')
          .eq('id', memberId)
          .single();
        
        if (!memberInfoError && memberInfo) {
          const memberGoalsCount = goals.filter(g => g.member_id === memberId).length;
          console.log(`   - ${memberId}: ${memberInfo.nome} (${memberInfo.email}) - ${memberGoalsCount} metas`);
        }
      }
    }

    // 6. Testar API de metas
    console.log('\n6. Testando API de metas...');
    const goalsApiResponse = await fetch('http://localhost:4000/api/goals', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const goalsApiData = await goalsApiResponse.json();
    console.log('📊 Resposta da API de metas:', JSON.stringify(goalsApiData, null, 2));

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
debugUserMemberId();