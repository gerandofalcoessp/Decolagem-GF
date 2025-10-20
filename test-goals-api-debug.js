require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugGoalsAPI() {
  console.log('🔍 Debugando API de metas...\n');

  try {
    // Login com Flávio Almeida (super_admin)
    const email = 'flavio.almeida@gerandofalcoes.com';
    const password = '123456';

    console.log(`🔑 Fazendo login com: ${email}`);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      console.error('❌ Erro no login:', loginError.message);
      return;
    }

    console.log('✅ Login bem-sucedido!');
    console.log(`👤 User ID: ${loginData.user.id}`);
    console.log(`📧 Email: ${loginData.user.email}`);
    console.log(`🎭 Role: ${loginData.user.user_metadata?.role}`);

    // Buscar member correspondente
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('*')
      .eq('auth_user_id', loginData.user.id)
      .single();

    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError);
      return;
    }

    console.log(`👥 Member ID: ${member.id}`);
    console.log(`📧 Member Name: ${member.name}`);

    // Verificar metas no banco diretamente
    console.log('\n🗄️ Verificando metas no banco diretamente...');
    
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*');

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
      return;
    }

    console.log(`📊 Total de metas no banco: ${allGoals.length}`);

    if (allGoals.length > 0) {
      console.log('\n📋 Estrutura da primeira meta:');
      const firstGoal = allGoals[0];
      console.log('Campos disponíveis:');
      Object.keys(firstGoal).forEach(key => {
        console.log(`  - ${key}: ${firstGoal[key]} (${typeof firstGoal[key]})`);
      });

      console.log('\n📋 Todas as metas:');
      allGoals.forEach((goal, index) => {
        console.log(`${index + 1}. ID: ${goal.id}`);
        console.log(`   Title: ${goal.title}`);
        console.log(`   Target: ${goal.target_value}`);
        console.log(`   Current: ${goal.current_value}`);
        console.log(`   Member ID: ${goal.member_id}`);
        console.log('');
      });
    }

    // Testar API de metas com fetch
    console.log('🌐 Testando API de metas via HTTP...');
    
    const response = await fetch('http://localhost:4000/api/goals', {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`📡 Status da resposta: ${response.status}`);
    console.log(`📡 Headers da resposta:`, Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const responseText = await response.text();
      console.log(`📄 Resposta bruta (texto): ${responseText}`);
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log(`📊 Resposta JSON:`, JSON.stringify(responseJson, null, 2));
        
        if (responseJson.data) {
          console.log(`📈 Número de metas na resposta: ${responseJson.data.length}`);
          
          if (responseJson.data.length > 0) {
            console.log('\n📋 Primeira meta da API:');
            const firstApiGoal = responseJson.data[0];
            Object.keys(firstApiGoal).forEach(key => {
              console.log(`  - ${key}: ${firstApiGoal[key]} (${typeof firstApiGoal[key]})`);
            });
          }
        } else {
          console.log('⚠️ Resposta não contém campo "data"');
        }
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse do JSON:', parseError.message);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Erro na API: ${errorText}`);
    }

    // Testar com diferentes usuários
    console.log('\n🔄 Testando com outros usuários...');
    
    const testUsers = [
      { email: 'lemaestro@gerandofalcoes.com', password: '123456' },
      { email: 'ana.neiry@gerandofalcoes.com', password: '123456' }
    ];

    for (const testUser of testUsers) {
      console.log(`\n👤 Testando com: ${testUser.email}`);
      
      const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });

      if (testLoginError) {
        console.log(`❌ Erro no login: ${testLoginError.message}`);
        continue;
      }

      const testResponse = await fetch('http://localhost:4000/api/goals', {
        headers: {
          'Authorization': `Bearer ${testLoginData.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        const testResponseJson = await testResponse.json();
        console.log(`📊 Metas para ${testUser.email}: ${testResponseJson.data?.length || 0}`);
      } else {
        console.log(`❌ Erro na API para ${testUser.email}: ${testResponse.status}`);
      }

      await supabase.auth.signOut();
    }

    // Fazer logout
    await supabase.auth.signOut();
    console.log('\n✅ Logout realizado com sucesso!');

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Executar o script
debugGoalsAPI();