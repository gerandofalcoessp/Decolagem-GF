require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGoalsWithValidUser() {
  console.log('🔍 Testando API de metas com usuário válido...\n');

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
    console.log(`👤 Usuário: ${loginData.user.email}`);
    console.log(`🎫 Token: ${loginData.session.access_token.substring(0, 30)}...`);

    // Buscar member_id
    const { data: member, error: memberError } = await supabase
      .from('members')
      .select('id, name, email, auth_user_id')
      .eq('auth_user_id', loginData.user.id)
      .single();

    if (memberError) {
      console.error('❌ Erro ao buscar member:', memberError);
      return;
    }

    console.log(`👥 Member ID: ${member.id}`);
    console.log(`📧 Member Name: ${member.name}`);

    // 1. Testar API de metas
    console.log('\n1. 🎯 Testando API de metas...');
    
    const goalsResponse = await fetch('http://localhost:4000/api/goals', {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status da resposta: ${goalsResponse.status}`);

    if (goalsResponse.ok) {
      const goals = await goalsResponse.json();
      console.log(`📊 Metas encontradas: ${goals.length}`);
      
      if (goals.length > 0) {
        console.log('\n📋 Primeiras 3 metas:');
        goals.slice(0, 3).forEach((goal, index) => {
          console.log(`${index + 1}. ${goal.title}`);
          console.log(`   Meta: ${goal.target_value}`);
          console.log(`   Atual: ${goal.current_value}`);
          console.log(`   Member ID: ${goal.member_id}`);
          console.log('');
        });
      }
    } else {
      const errorText = await goalsResponse.text();
      console.log(`❌ Erro na API de metas: ${errorText}`);
    }

    // 2. Testar API de atividades regionais
    console.log('2. 🏢 Testando API de atividades regionais...');
    
    const activitiesResponse = await fetch('http://localhost:4000/api/regional-activities', {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status da resposta: ${activitiesResponse.status}`);

    if (activitiesResponse.ok) {
      const activities = await activitiesResponse.json();
      console.log(`🏢 Atividades encontradas: ${activities.length}`);
      
      if (activities.length > 0) {
        console.log('\n📋 Primeiras 3 atividades:');
        activities.slice(0, 3).forEach((activity, index) => {
          console.log(`${index + 1}. ${activity.name}`);
          console.log(`   Valor: ${activity.value}`);
          console.log(`   Member ID: ${activity.member_id}`);
          console.log('');
        });
      }
    } else {
      const errorText = await activitiesResponse.text();
      console.log(`❌ Erro na API de atividades: ${errorText}`);
    }

    // 3. Verificar metas no banco diretamente
    console.log('3. 🗄️ Verificando metas no banco diretamente...');
    
    const { data: allGoals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .limit(5);

    if (goalsError) {
      console.error('❌ Erro ao buscar metas:', goalsError);
    } else {
      console.log(`📊 Total de metas no banco: ${allGoals.length}`);
      
      if (allGoals.length > 0) {
        console.log('\n📋 Metas no banco:');
        allGoals.forEach((goal, index) => {
          console.log(`${index + 1}. ${goal.title}`);
          console.log(`   Member ID: ${goal.member_id}`);
          console.log(`   Meta: ${goal.target_value}`);
          console.log(`   Atual: ${goal.current_value}`);
          console.log('');
        });
      }
    }

    // 4. Verificar se o member_id do usuário logado tem metas
    console.log(`4. 🔍 Verificando metas para member_id: ${member.id}...`);
    
    const { data: userGoals, error: userGoalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('member_id', member.id);

    if (userGoalsError) {
      console.error('❌ Erro ao buscar metas do usuário:', userGoalsError);
    } else {
      console.log(`📊 Metas para este usuário: ${userGoals.length}`);
      
      if (userGoals.length > 0) {
        console.log('\n📋 Metas do usuário:');
        userGoals.forEach((goal, index) => {
          console.log(`${index + 1}. ${goal.title}`);
          console.log(`   Meta: ${goal.target_value}`);
          console.log(`   Atual: ${goal.current_value}`);
          console.log('');
        });
      } else {
        console.log('⚠️ Este usuário não tem metas associadas ao seu member_id');
        
        // Vamos associar algumas metas a este usuário
        console.log('\n🔧 Associando metas existentes a este usuário...');
        
        const { data: updateResult, error: updateError } = await supabase
          .from('goals')
          .update({ member_id: member.id })
          .neq('member_id', member.id)
          .select();

        if (updateError) {
          console.error('❌ Erro ao atualizar metas:', updateError);
        } else {
          console.log(`✅ ${updateResult.length} metas atualizadas com sucesso!`);
          
          // Testar API novamente
          console.log('\n🔄 Testando API de metas novamente...');
          
          const newGoalsResponse = await fetch('http://localhost:4000/api/goals', {
            headers: {
              'Authorization': `Bearer ${loginData.session.access_token}`,
              'Content-Type': 'application/json'
            }
          });

          if (newGoalsResponse.ok) {
            const newGoals = await newGoalsResponse.json();
            console.log(`📊 Metas encontradas após atualização: ${newGoals.length}`);
            
            if (newGoals.length > 0) {
              console.log('\n📋 Primeiras 3 metas após atualização:');
              newGoals.slice(0, 3).forEach((goal, index) => {
                console.log(`${index + 1}. ${goal.title}`);
                console.log(`   Meta: ${goal.target_value}`);
                console.log(`   Atual: ${goal.current_value}`);
                console.log('');
              });
            }
          }
        }
      }
    }

    // Fazer logout
    await supabase.auth.signOut();
    console.log('\n✅ Logout realizado com sucesso!');

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
  }
}

// Executar o script
testGoalsWithValidUser();